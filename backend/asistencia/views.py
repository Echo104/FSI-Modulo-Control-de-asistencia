"""Vistas de HU-01 · Turnos.

Las vistas solo orquestan la petición: validan con el serializer y delegan
las reglas de negocio a `asistencia.services.turnos`.
"""
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from asistencia.models import Estado, Turno
from asistencia.serializers import TurnoSerializer
from asistencia.services import turnos as servicio_turnos
from asistencia.services.auditoria import obtener_actor

FILTRO_ESTADO_TODOS = "todos"
VALORES_FILTRO_ESTADO = (Estado.ACTIVO.value, Estado.INACTIVO.value, FILTRO_ESTADO_TODOS)

EJEMPLO_PETICION = OpenApiExample(
    "Turno Mañana (lunes a viernes)",
    summary="Crear turno de mañana",
    description="Entrada 08:00, salida 17:00, 10 min de tolerancia, 60 min de refrigerio.",
    value={
        "empresa_id": 1,
        "nombre": "Mañana",
        "hora_entrada": "08:00",
        "hora_salida": "17:00",
        "tolerancia_min": 10,
        "refrigerio_min": 60,
        "cruza_medianoche": "N",
        "dias": [
            {"dia_semana": 1, "laborable": "S"},
            {"dia_semana": 2, "laborable": "S"},
            {"dia_semana": 3, "laborable": "S"},
            {"dia_semana": 4, "laborable": "S"},
            {"dia_semana": 5, "laborable": "S"},
            {"dia_semana": 6, "laborable": "N"},
            {"dia_semana": 7, "laborable": "N"},
        ],
    },
    request_only=True,
)

EJEMPLO_PETICION_NOCHE = OpenApiExample(
    "Turno Noche (cruza medianoche)",
    summary="Crear turno nocturno 22:00 a 06:00",
    value={
        "empresa_id": 1,
        "nombre": "Noche",
        "hora_entrada": "22:00",
        "hora_salida": "06:00",
        "tolerancia_min": 10,
        "refrigerio_min": 45,
        "cruza_medianoche": "S",
        "dias": [{"dia_semana": d, "laborable": "S"} for d in range(1, 6)],
    },
    request_only=True,
)

EJEMPLO_RESPUESTA = OpenApiExample(
    "Turno creado",
    value={
        "id": 1,
        "empresa_id": 1,
        "nombre": "Mañana",
        "hora_entrada": "08:00",
        "hora_salida": "17:00",
        "tolerancia_min": 10,
        "refrigerio_min": 60,
        "cruza_medianoche": "N",
        "estado": "A",
        "dias": [
            {"id": 1, "dia_semana": 1, "laborable": "S"},
            {"id": 2, "dia_semana": 2, "laborable": "S"},
            {"id": 3, "dia_semana": 3, "laborable": "S"},
            {"id": 4, "dia_semana": 4, "laborable": "S"},
            {"id": 5, "dia_semana": 5, "laborable": "S"},
            {"id": 6, "dia_semana": 6, "laborable": "N"},
            {"id": 7, "dia_semana": 7, "laborable": "N"},
        ],
        "creado_en": "2026-11-22T09:15:00-05:00",
        "creado_por": "rrhh.ana",
        "actualizado_en": None,
        "actualizado_por": None,
    },
    response_only=True,
)

EJEMPLO_ERROR_400 = OpenApiExample(
    "Errores de validación",
    value={
        "nombre": ["Ya existe un turno con el nombre «Mañana» en la empresa 1."],
        "hora_salida": [
            "La hora de salida debe ser posterior a la hora de entrada. "
            "Si el turno termina al día siguiente, envíe cruza_medianoche = S."
        ],
        "tolerancia_min": ["Asegúrese de que este valor es menor o igual a 120."],
        "dias": ["El día de la semana no puede repetirse en el mismo turno: 1 (lunes)."],
    },
    response_only=True,
    status_codes=["400"],
)

PARAMETRO_ESTADO = OpenApiParameter(
    name="estado",
    type=str,
    location=OpenApiParameter.QUERY,
    enum=list(VALORES_FILTRO_ESTADO),
    description=(
        "Filtra por estado del turno. `A` = activos (por defecto), "
        "`I` = dados de baja, `todos` = ambos."
    ),
    required=False,
)

PARAMETRO_EMPRESA = OpenApiParameter(
    name="empresa_id",
    type=int,
    location=OpenApiParameter.QUERY,
    description="Devuelve solo los turnos de esa empresa.",
    required=False,
)


@extend_schema_view(
    list=extend_schema(
        summary="Listar turnos",
        description=(
            "Lista los turnos de la empresa. Por defecto solo devuelve los **activos** "
            "(estado A); los dados de baja se consultan con `?estado=I` o `?estado=todos` (CA-07, CA-08)."
        ),
        parameters=[PARAMETRO_ESTADO, PARAMETRO_EMPRESA],
        responses={200: TurnoSerializer(many=True), 400: OpenApiResponse(description="Filtro inválido")},
        tags=["Turnos"],
    ),
    create=extend_schema(
        summary="Crear turno",
        description=(
            "Crea un turno con sus días. El turno queda activo (estado A) con `creado_en` "
            "y `creado_por` completos (CA-01). Reglas: nombre único por empresa y sin `| / \\` "
            "(CA-02, CA-09); si `hora_salida` es anterior a `hora_entrada` debe enviarse "
            "`cruza_medianoche = S` (CA-03); tolerancia 0-120 y refrigerio 0-180 (CA-04); "
            "días 1 = lunes … 7 = domingo sin repetir (CA-05).\n\n"
            "Mientras no haya autenticación, el actor de auditoría se toma de la cabecera "
            "`X-Usuario`; si falta se registra `sistema`."
        ),
        examples=[EJEMPLO_PETICION, EJEMPLO_PETICION_NOCHE, EJEMPLO_RESPUESTA, EJEMPLO_ERROR_400],
        responses={201: TurnoSerializer, 400: OpenApiResponse(description="Datos inválidos")},
        tags=["Turnos"],
    ),
    retrieve=extend_schema(
        summary="Detalle de un turno",
        description="Devuelve el turno (activo o inactivo) con sus días vigentes (CA-08).",
        examples=[EJEMPLO_RESPUESTA],
        tags=["Turnos"],
    ),
    update=extend_schema(
        summary="Editar turno (completo)",
        description=(
            "Reemplaza todos los campos. Si se envía `dias`, los días quedan exactamente como "
            "la lista recibida (los que ya no vienen pasan a estado I). Actualiza "
            "`actualizado_en` y `actualizado_por`; el `id` no cambia (CA-06)."
        ),
        examples=[EJEMPLO_PETICION, EJEMPLO_RESPUESTA, EJEMPLO_ERROR_400],
        tags=["Turnos"],
    ),
    partial_update=extend_schema(
        summary="Editar turno (parcial)",
        description="Modifica solo los campos enviados. Actualiza `actualizado_en` y `actualizado_por` (CA-06).",
        examples=[
            OpenApiExample(
                "Cambiar tolerancia",
                value={"tolerancia_min": 15},
                request_only=True,
            ),
            EJEMPLO_RESPUESTA,
        ],
        tags=["Turnos"],
    ),
    destroy=extend_schema(
        summary="Dar de baja un turno (baja lógica)",
        description=(
            "No borra el registro: cambia `estado` a I. El turno deja de aparecer en el listado "
            "por defecto y no puede asignarse a nuevos trabajadores (CA-07). "
            "Si ya estaba dado de baja, la operación es idempotente."
        ),
        responses={204: OpenApiResponse(description="Turno dado de baja")},
        tags=["Turnos"],
    ),
)
class TurnoViewSet(viewsets.ModelViewSet):
    """CRUD de turnos con baja lógica. Endpoints: /api/asistencia/turnos/."""

    serializer_class = TurnoSerializer
    queryset = Turno.objects.all().prefetch_related("dias")
    pagination_class = None
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    # ------------------------------------------------------------------
    # Consulta
    # ------------------------------------------------------------------
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action != "list":
            # Detalle, edición y baja operan sobre cualquier turno, activo o no.
            return queryset

        estado = (self.request.query_params.get("estado") or Estado.ACTIVO.value).strip()
        if estado.lower() == FILTRO_ESTADO_TODOS:
            estado = FILTRO_ESTADO_TODOS
        else:
            estado = estado.upper()
        if estado not in VALORES_FILTRO_ESTADO:
            raise ValidationError(
                {"estado": ["Valor inválido. Use A (activos), I (inactivos) o todos."]}
            )
        if estado != FILTRO_ESTADO_TODOS:
            queryset = queryset.filter(estado=estado)

        empresa_id = self.request.query_params.get("empresa_id")
        if empresa_id not in (None, ""):
            if not empresa_id.isdigit():
                raise ValidationError({"empresa_id": ["Debe ser un número entero positivo."]})
            queryset = queryset.filter(empresa_id=int(empresa_id))

        return queryset.order_by("nombre")

    # ------------------------------------------------------------------
    # Escritura (el actor de auditoría viaja al serializer)
    # ------------------------------------------------------------------
    def perform_create(self, serializer):
        serializer.save(actor=obtener_actor(self.request))

    def perform_update(self, serializer):
        serializer.save(actor=obtener_actor(self.request))

    def destroy(self, request, *args, **kwargs):
        turno = self.get_object()
        servicio_turnos.dar_de_baja_turno(turno, obtener_actor(request))
        return Response(status=status.HTTP_204_NO_CONTENT)
