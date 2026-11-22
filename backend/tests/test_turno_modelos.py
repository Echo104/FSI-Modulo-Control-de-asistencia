"""Pruebas de modelo HU-01 (issue #10): restricciones verificadas en la BD.

Cada prueba inserta directamente con el ORM (saltando los serializers) para
comprobar que PostgreSQL rechaza datos inválidos aunque se evite la API.
"""
from datetime import time

import pytest
from django.db import IntegrityError, transaction

from asistencia.models import Estado, Turno, TurnoDia

pytestmark = pytest.mark.django_db


def _turno(**extra):
    datos = dict(
        empresa_id=1,
        nombre="Mañana",
        hora_entrada=time(8, 0),
        hora_salida=time(17, 0),
        tolerancia_min=10,
        refrigerio_min=60,
        cruza_medianoche="N",
        creado_por="pytest",
    )
    datos.update(extra)
    return Turno.objects.create(**datos)


def test_turno_se_crea_activo_con_auditoria():
    turno = _turno()
    assert turno.id is not None
    assert turno.estado == Estado.ACTIVO
    assert turno.creado_en is not None
    assert turno.creado_por == "pytest"
    assert turno.actualizado_en is None
    assert turno.actualizado_por is None


def test_bd_rechaza_nombre_repetido_en_la_misma_empresa():
    _turno()
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            _turno()


def test_mismo_nombre_en_otra_empresa_si_se_permite():
    _turno(empresa_id=1)
    otro = _turno(empresa_id=2)
    assert otro.id is not None


@pytest.mark.parametrize("tolerancia", [121, 500])
def test_bd_rechaza_tolerancia_fuera_de_rango(tolerancia):
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            _turno(tolerancia_min=tolerancia)


@pytest.mark.parametrize("refrigerio", [181, 999])
def test_bd_rechaza_refrigerio_fuera_de_rango(refrigerio):
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            _turno(refrigerio_min=refrigerio)


def test_bd_rechaza_salida_menor_que_entrada_sin_cruce():
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            _turno(hora_entrada=time(22, 0), hora_salida=time(6, 0), cruza_medianoche="N")


def test_bd_acepta_salida_menor_que_entrada_con_cruce():
    turno = _turno(
        nombre="Noche", hora_entrada=time(22, 0), hora_salida=time(6, 0), cruza_medianoche="S"
    )
    assert turno.id is not None


def test_bd_rechaza_valor_invalido_en_cruza_medianoche_y_estado():
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            _turno(cruza_medianoche="X")
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            _turno(estado="Z")


def test_bd_rechaza_dia_repetido_en_el_mismo_turno():
    turno = _turno()
    TurnoDia.objects.create(turno=turno, dia_semana=1, laborable="S", creado_por="pytest")
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            TurnoDia.objects.create(turno=turno, dia_semana=1, laborable="N", creado_por="pytest")


@pytest.mark.parametrize("dia", [0, 8])
def test_bd_rechaza_dia_semana_fuera_de_1_a_7(dia):
    turno = _turno()
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            TurnoDia.objects.create(turno=turno, dia_semana=dia, creado_por="pytest")


def test_bd_rechaza_laborable_distinto_de_s_n():
    turno = _turno()
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            TurnoDia.objects.create(turno=turno, dia_semana=1, laborable="X", creado_por="pytest")


def test_no_se_puede_borrar_fisicamente_un_turno_con_dias():
    """La FK es PROTECT: la baja debe ser lógica (estado I), nunca DELETE."""
    from django.db.models import ProtectedError

    turno = _turno()
    TurnoDia.objects.create(turno=turno, dia_semana=1, creado_por="pytest")
    with pytest.raises(ProtectedError):
        turno.delete()


def test_dias_activos_ordenados_y_sin_inactivos():
    turno = _turno()
    TurnoDia.objects.create(turno=turno, dia_semana=3, creado_por="pytest")
    TurnoDia.objects.create(turno=turno, dia_semana=1, creado_por="pytest")
    TurnoDia.objects.create(turno=turno, dia_semana=2, estado="I", creado_por="pytest")
    assert list(turno.dias_activos().values_list("dia_semana", flat=True)) == [1, 3]
