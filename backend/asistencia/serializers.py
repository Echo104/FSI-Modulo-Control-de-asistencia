"""Serializers de HU-01 · Turnos.

Contrato JSON de `/api/asistencia/turnos/` y validaciones de entrada
(CA-02 a CA-05 y CA-09). Las reglas de persistencia viven en
`asistencia.services.turnos`.
"""
from collections import Counter

from rest_framework import serializers

from asistencia.models import SiNo, Turno, TurnoDia
from asistencia.services import turnos as servicio_turnos
from asistencia.validators import validar_texto_libre

NOMBRES_DIA = {
    1: "lunes",
    2: "martes",
    3: "miércoles",
    4: "jueves",
    5: "viernes",
    6: "sábado",
    7: "domingo",
}


class TurnoDiaSerializer(serializers.ModelSerializer):
    """Un día de la semana del turno: 1 = lunes … 7 = domingo."""

    dia_semana = serializers.IntegerField(
        min_value=TurnoDia.DIA_MIN,
        max_value=TurnoDia.DIA_MAX,
        help_text="1 = lunes … 7 = domingo (ISO 8601).",
    )
    laborable = serializers.ChoiceField(
        choices=SiNo.choices,
        default=SiNo.SI,
        help_text="S = laborable; N = descanso (genera estado DES al consolidar).",
    )

    class Meta:
        model = TurnoDia
        fields = ["id", "dia_semana", "laborable"]
        read_only_fields = ["id"]


class TurnoSerializer(serializers.ModelSerializer):
    """Turno con sus días anidados (lectura y escritura)."""

    nombre = serializers.CharField(
        max_length=100,
        validators=[validar_texto_libre],
        help_text="Único por empresa. No admite los caracteres | / \\",
    )
    hora_entrada = serializers.TimeField(
        format="%H:%M", input_formats=["%H:%M", "%H:%M:%S"]
    )
    hora_salida = serializers.TimeField(
        format="%H:%M", input_formats=["%H:%M", "%H:%M:%S"]
    )
    tolerancia_min = serializers.IntegerField(
        min_value=Turno.TOLERANCIA_MIN,
        max_value=Turno.TOLERANCIA_MAX,
        default=10,
        help_text="Minutos de tolerancia tras la hora de entrada (0 a 120).",
    )
    refrigerio_min = serializers.IntegerField(
        min_value=Turno.REFRIGERIO_MIN,
        max_value=Turno.REFRIGERIO_MAX,
        default=0,
        help_text="Minutos de refrigerio que se restan del tiempo trabajado (0 a 180).",
    )
    cruza_medianoche = serializers.ChoiceField(
        choices=SiNo.choices,
        default=SiNo.NO,
        help_text="S si la jornada termina al día siguiente de iniciar.",
    )
    dias = TurnoDiaSerializer(
        many=True,
        required=False,
        help_text="Días de la semana del turno. Un día no puede repetirse.",
    )

    class Meta:
        model = Turno
        fields = [
            "id",
            "empresa_id",
            "nombre",
            "hora_entrada",
            "hora_salida",
            "tolerancia_min",
            "refrigerio_min",
            "cruza_medianoche",
            "estado",
            "dias",
            "creado_en",
            "creado_por",
            "actualizado_en",
            "actualizado_por",
        ]
        read_only_fields = [
            "id",
            "estado",
            "creado_en",
            "creado_por",
            "actualizado_en",
            "actualizado_por",
        ]
        extra_kwargs = {
            "empresa_id": {
                "min_value": 1,
                "help_text": "Empresa a la que pertenece el turno (multiempresa).",
            },
        }
        # La unicidad (empresa_id, nombre) se valida en validate() con un
        # mensaje legible sobre el campo `nombre` (CA-02), no con el validador
        # genérico de DRF.
        validators = []

    # ------------------------------------------------------------------
    # Validaciones por campo
    # ------------------------------------------------------------------
    def validate_nombre(self, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise serializers.ValidationError("El nombre del turno no puede estar vacío.")
        return valor

    def validate_dias(self, dias: list[dict]) -> list[dict]:
        """CA-05: un día de la semana no puede repetirse dentro del mismo turno."""
        conteo = Counter(d["dia_semana"] for d in dias)
        repetidos = sorted(dia for dia, veces in conteo.items() if veces > 1)
        if repetidos:
            nombres = ", ".join(f"{d} ({NOMBRES_DIA[d]})" for d in repetidos)
            raise serializers.ValidationError(
                f"El día de la semana no puede repetirse en el mismo turno: {nombres}."
            )
        return dias

    # ------------------------------------------------------------------
    # Validaciones cruzadas
    # ------------------------------------------------------------------
    def _valor(self, datos: dict, campo: str):
        """Valor enviado o, en una edición parcial, el valor actual del turno."""
        if campo in datos:
            return datos[campo]
        if self.instance is not None:
            return getattr(self.instance, campo)
        return None

    def validate(self, datos: dict) -> dict:
        errores = {}

        # CA-02: nombre único por empresa (sin distinguir mayúsculas).
        empresa_id = self._valor(datos, "empresa_id")
        nombre = self._valor(datos, "nombre")
        if empresa_id is not None and nombre:
            repetido = Turno.objects.filter(empresa_id=empresa_id, nombre__iexact=nombre)
            if self.instance is not None:
                repetido = repetido.exclude(pk=self.instance.pk)
            if repetido.exists():
                errores["nombre"] = [
                    f"Ya existe un turno con el nombre «{nombre}» en la empresa {empresa_id}."
                ]

        # CA-03: salida anterior (o igual) a la entrada solo si cruza la medianoche.
        hora_entrada = self._valor(datos, "hora_entrada")
        hora_salida = self._valor(datos, "hora_salida")
        cruza = self._valor(datos, "cruza_medianoche") or SiNo.NO
        if hora_entrada is not None and hora_salida is not None and cruza == SiNo.NO:
            if hora_salida <= hora_entrada:
                errores["hora_salida"] = [
                    "La hora de salida debe ser posterior a la hora de entrada. "
                    "Si el turno termina al día siguiente, envíe cruza_medianoche = S."
                ]

        if errores:
            raise serializers.ValidationError(errores)
        return datos

    # ------------------------------------------------------------------
    # Persistencia (delegada a la capa de servicios)
    # ------------------------------------------------------------------
    def create(self, validated_data: dict) -> Turno:
        actor = validated_data.pop("actor", "sistema")
        dias = validated_data.pop("dias", None)
        return servicio_turnos.crear_turno(validated_data, dias, actor)

    def update(self, instance: Turno, validated_data: dict) -> Turno:
        actor = validated_data.pop("actor", "sistema")
        dias = validated_data.pop("dias", None)
        return servicio_turnos.actualizar_turno(instance, validated_data, dias, actor)

    def to_representation(self, instance: Turno) -> dict:
        datos = super().to_representation(instance)
        # CA-08: el detalle incluye sus días (solo los vigentes, de lunes a domingo).
        datos["dias"] = TurnoDiaSerializer(instance.dias_activos(), many=True).data
        return datos
