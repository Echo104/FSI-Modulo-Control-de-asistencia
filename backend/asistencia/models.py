"""Modelos del esquema `asistencia` (ver Diccionario de Datos del módulo).

Todas las tablas llevan `empresa_id` (diseño multiempresa) y los campos de
auditoría `creado_en`, `creado_por`, `actualizado_en` y `actualizado_por`.
No hay borrado físico en catálogos ni configuración: se usa `estado = I`.
"""
from django.db import models
from django.db.models import F, Q


class Estado(models.TextChoices):
    """Estado de habilitación del registro (baja lógica)."""

    ACTIVO = "A", "Activo"
    INACTIVO = "I", "Inactivo"


class SiNo(models.TextChoices):
    SI = "S", "Sí"
    NO = "N", "No"


class AuditoriaModel(models.Model):
    """Campos de auditoría comunes a toda tabla del módulo.

    `actualizado_en` y `actualizado_por` quedan nulos hasta la primera
    modificación (los completa la capa de servicios, no el ORM).
    """

    creado_en = models.DateTimeField(auto_now_add=True)
    creado_por = models.CharField(max_length=128)
    actualizado_en = models.DateTimeField(null=True, blank=True)
    actualizado_por = models.CharField(max_length=128, null=True, blank=True)

    class Meta:
        abstract = True


class Turno(AuditoriaModel):
    """E5M_TURNO · Horario base de trabajo (tabla asistencia.turno)."""

    TOLERANCIA_MIN = 0
    TOLERANCIA_MAX = 120
    REFRIGERIO_MIN = 0
    REFRIGERIO_MAX = 180

    id = models.AutoField(primary_key=True, db_column="turno_id")
    empresa_id = models.BigIntegerField()
    nombre = models.CharField(max_length=100)
    hora_entrada = models.TimeField()
    hora_salida = models.TimeField()
    tolerancia_min = models.PositiveSmallIntegerField(default=10)
    refrigerio_min = models.PositiveSmallIntegerField(default=0)
    cruza_medianoche = models.CharField(
        max_length=1, choices=SiNo.choices, default=SiNo.NO
    )
    estado = models.CharField(
        max_length=1, choices=Estado.choices, default=Estado.ACTIVO
    )

    class Meta:
        db_table = 'asistencia"."turno'
        ordering = ["nombre"]
        constraints = [
            models.UniqueConstraint(
                fields=["empresa_id", "nombre"], name="uq_turno_empresa_nombre"
            ),
            models.CheckConstraint(
                condition=Q(tolerancia_min__gte=0) & Q(tolerancia_min__lte=120),
                name="ck_turno_tolerancia_0_120",
            ),
            models.CheckConstraint(
                condition=Q(refrigerio_min__gte=0) & Q(refrigerio_min__lte=180),
                name="ck_turno_refrigerio_0_180",
            ),
            models.CheckConstraint(
                condition=Q(cruza_medianoche__in=["S", "N"]),
                name="ck_turno_cruza_medianoche_sn",
            ),
            models.CheckConstraint(
                condition=Q(estado__in=["A", "I"]),
                name="ck_turno_estado_ai",
            ),
            # Si no cruza la medianoche, la salida debe ser posterior a la entrada.
            models.CheckConstraint(
                condition=Q(cruza_medianoche="S")
                | Q(hora_salida__gt=F("hora_entrada")),
                name="ck_turno_salida_mayor_entrada_o_cruza",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.hora_entrada:%H:%M}-{self.hora_salida:%H:%M})"

    @property
    def activo(self) -> bool:
        return self.estado == Estado.ACTIVO

    def dias_activos(self):
        """Días del turno vigentes (estado A) ordenados de lunes (1) a domingo (7)."""
        return self.dias.filter(estado=Estado.ACTIVO).order_by("dia_semana")


class TurnoDia(AuditoriaModel):
    """E5M_TURNO_DIA · Días de la semana de cada turno (tabla asistencia.turno_dia).

    `dia_semana`: 1 = lunes … 7 = domingo (ISO 8601). Un día aparece una sola
    vez por turno. Un día no laborable (N) genera estado DES en la consolidación.
    """

    DIA_MIN = 1
    DIA_MAX = 7

    id = models.AutoField(primary_key=True, db_column="turno_dia_id")
    turno = models.ForeignKey(
        Turno, on_delete=models.PROTECT, related_name="dias", db_column="turno_id"
    )
    dia_semana = models.PositiveSmallIntegerField()
    laborable = models.CharField(
        max_length=1, choices=SiNo.choices, default=SiNo.SI
    )
    estado = models.CharField(
        max_length=1, choices=Estado.choices, default=Estado.ACTIVO
    )

    class Meta:
        db_table = 'asistencia"."turno_dia'
        ordering = ["turno_id", "dia_semana"]
        constraints = [
            models.UniqueConstraint(
                fields=["turno", "dia_semana"], name="uq_turno_dia_turno_dia"
            ),
            models.CheckConstraint(
                condition=Q(dia_semana__gte=1) & Q(dia_semana__lte=7),
                name="ck_turno_dia_dia_semana_1_7",
            ),
            models.CheckConstraint(
                condition=Q(laborable__in=["S", "N"]),
                name="ck_turno_dia_laborable_sn",
            ),
            models.CheckConstraint(
                condition=Q(estado__in=["A", "I"]),
                name="ck_turno_dia_estado_ai",
            ),
        ]

    def __str__(self):
        return f"{self.turno_id} · día {self.dia_semana} ({self.laborable})"
