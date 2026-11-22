"""Reglas de negocio de HU-01 · Turnos (capa de servicios).

Las vistas y los serializers delegan aquí la creación, edición y baja lógica
de turnos y sus días, siempre dentro de una transacción y con auditoría.
"""
from django.db import transaction
from django.utils import timezone

from asistencia.models import Estado, Turno, TurnoDia


def _marcar_actualizado(instancia, actor: str) -> None:
    instancia.actualizado_en = timezone.now()
    instancia.actualizado_por = actor


def _sincronizar_dias(turno: Turno, dias: list[dict], actor: str) -> None:
    """Deja los días del turno exactamente como indica `dias`.

    - Día nuevo: se inserta.
    - Día existente: se actualiza `laborable` y se reactiva si estaba inactivo.
    - Día que ya no viene en la lista: baja lógica (estado I). Nunca DELETE.
    """
    existentes = {d.dia_semana: d for d in turno.dias.all()}
    recibidos = set()

    for dato in dias:
        dia_semana = dato["dia_semana"]
        laborable = dato.get("laborable", "S")
        recibidos.add(dia_semana)
        actual = existentes.get(dia_semana)
        if actual is None:
            TurnoDia.objects.create(
                turno=turno,
                dia_semana=dia_semana,
                laborable=laborable,
                estado=Estado.ACTIVO,
                creado_por=actor,
            )
            continue
        cambios = actual.laborable != laborable or actual.estado != Estado.ACTIVO
        if cambios:
            actual.laborable = laborable
            actual.estado = Estado.ACTIVO
            _marcar_actualizado(actual, actor)
            actual.save(update_fields=["laborable", "estado", "actualizado_en", "actualizado_por"])

    for dia_semana, actual in existentes.items():
        if dia_semana not in recibidos and actual.estado == Estado.ACTIVO:
            actual.estado = Estado.INACTIVO
            _marcar_actualizado(actual, actor)
            actual.save(update_fields=["estado", "actualizado_en", "actualizado_por"])


@transaction.atomic
def crear_turno(datos: dict, dias: list[dict] | None, actor: str) -> Turno:
    """CA-01: crea el turno activo con creado_en y creado_por; CA-05: sus días."""
    turno = Turno.objects.create(
        **datos,
        estado=Estado.ACTIVO,
        creado_por=actor,
    )
    if dias:
        _sincronizar_dias(turno, dias, actor)
    return turno


@transaction.atomic
def actualizar_turno(
    turno: Turno, datos: dict, dias: list[dict] | None, actor: str
) -> Turno:
    """CA-06: actualiza campos, completa actualizado_en/por y conserva el id."""
    for campo, valor in datos.items():
        setattr(turno, campo, valor)
    _marcar_actualizado(turno, actor)
    turno.save()
    if dias is not None:
        _sincronizar_dias(turno, dias, actor)
    return turno


@transaction.atomic
def dar_de_baja_turno(turno: Turno, actor: str) -> Turno:
    """CA-07: baja lógica. El registro no se borra; pasa a estado I."""
    if turno.estado == Estado.INACTIVO:
        return turno
    turno.estado = Estado.INACTIVO
    _marcar_actualizado(turno, actor)
    turno.save(update_fields=["estado", "actualizado_en", "actualizado_por"])
    return turno
