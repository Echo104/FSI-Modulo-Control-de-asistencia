"""Pruebas de serializers HU-01 (issue #11): CA-02 a CA-05 y CA-09."""
from datetime import time

import pytest

from asistencia.models import Turno
from asistencia.serializers import TurnoSerializer

pytestmark = pytest.mark.django_db


def _payload(**extra):
    datos = {
        "empresa_id": 1,
        "nombre": "Mañana",
        "hora_entrada": "08:00",
        "hora_salida": "17:00",
        "tolerancia_min": 10,
        "refrigerio_min": 60,
        "cruza_medianoche": "N",
    }
    datos.update(extra)
    return datos


def test_payload_valido_crea_turno_activo_con_auditoria():
    serializer = TurnoSerializer(data=_payload(dias=[{"dia_semana": 1}, {"dia_semana": 2}]))
    assert serializer.is_valid(), serializer.errors
    turno = serializer.save(actor="rrhh.ana")
    assert turno.estado == "A"
    assert turno.creado_por == "rrhh.ana"
    assert turno.creado_en is not None
    assert turno.actualizado_en is None
    assert list(turno.dias_activos().values_list("dia_semana", flat=True)) == [1, 2]
    assert serializer.data["hora_entrada"] == "08:00"
    assert serializer.data["estado"] == "A"


def test_ca02_nombre_repetido_en_la_empresa_es_invalido():
    Turno.objects.create(
        empresa_id=1, nombre="Mañana", hora_entrada=time(8), hora_salida=time(17), creado_por="t"
    )
    serializer = TurnoSerializer(data=_payload())
    assert not serializer.is_valid()
    assert "nombre" in serializer.errors
    assert "Ya existe un turno" in serializer.errors["nombre"][0]


def test_ca02_nombre_repetido_no_distingue_mayusculas():
    Turno.objects.create(
        empresa_id=1, nombre="Mañana", hora_entrada=time(8), hora_salida=time(17), creado_por="t"
    )
    serializer = TurnoSerializer(data=_payload(nombre="MAÑANA"))
    assert not serializer.is_valid()
    assert "nombre" in serializer.errors


def test_ca02_mismo_nombre_en_otra_empresa_es_valido():
    Turno.objects.create(
        empresa_id=1, nombre="Mañana", hora_entrada=time(8), hora_salida=time(17), creado_por="t"
    )
    serializer = TurnoSerializer(data=_payload(empresa_id=2))
    assert serializer.is_valid(), serializer.errors


def test_ca02_al_editar_no_choca_con_su_propio_nombre():
    turno = Turno.objects.create(
        empresa_id=1, nombre="Mañana", hora_entrada=time(8), hora_salida=time(17), creado_por="t"
    )
    serializer = TurnoSerializer(turno, data={"tolerancia_min": 15}, partial=True)
    assert serializer.is_valid(), serializer.errors


def test_ca03_salida_menor_que_entrada_sin_cruce_es_invalido():
    serializer = TurnoSerializer(
        data=_payload(hora_entrada="22:00", hora_salida="06:00", cruza_medianoche="N")
    )
    assert not serializer.is_valid()
    assert "hora_salida" in serializer.errors
    assert "cruza_medianoche = S" in serializer.errors["hora_salida"][0]


def test_ca03_salida_igual_a_entrada_sin_cruce_es_invalido():
    serializer = TurnoSerializer(data=_payload(hora_entrada="08:00", hora_salida="08:00"))
    assert not serializer.is_valid()
    assert "hora_salida" in serializer.errors


def test_ca03_salida_menor_que_entrada_con_cruce_es_valido():
    serializer = TurnoSerializer(
        data=_payload(nombre="Noche", hora_entrada="22:00", hora_salida="06:00", cruza_medianoche="S")
    )
    assert serializer.is_valid(), serializer.errors


@pytest.mark.parametrize("tolerancia", [-1, 121, "abc", 10.5])
def test_ca04_tolerancia_fuera_de_rango_o_no_entera(tolerancia):
    serializer = TurnoSerializer(data=_payload(tolerancia_min=tolerancia))
    assert not serializer.is_valid()
    assert "tolerancia_min" in serializer.errors


@pytest.mark.parametrize("refrigerio", [-1, 181, "xx", 5.5])
def test_ca04_refrigerio_fuera_de_rango_o_no_entero(refrigerio):
    serializer = TurnoSerializer(data=_payload(refrigerio_min=refrigerio))
    assert not serializer.is_valid()
    assert "refrigerio_min" in serializer.errors


@pytest.mark.parametrize("tolerancia,refrigerio", [(0, 0), (120, 180), (10, 60)])
def test_ca04_limites_del_rango_son_validos(tolerancia, refrigerio):
    serializer = TurnoSerializer(data=_payload(tolerancia_min=tolerancia, refrigerio_min=refrigerio))
    assert serializer.is_valid(), serializer.errors


def test_ca04_tolerancia_y_refrigerio_tienen_valores_por_defecto():
    datos = _payload()
    datos.pop("tolerancia_min")
    datos.pop("refrigerio_min")
    serializer = TurnoSerializer(data=datos)
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["tolerancia_min"] == 10
    assert serializer.validated_data["refrigerio_min"] == 0


def test_ca05_dia_repetido_en_el_mismo_turno_es_invalido():
    serializer = TurnoSerializer(
        data=_payload(dias=[{"dia_semana": 1, "laborable": "S"}, {"dia_semana": 1, "laborable": "N"}])
    )
    assert not serializer.is_valid()
    assert "dias" in serializer.errors
    assert "no puede repetirse" in str(serializer.errors["dias"])


@pytest.mark.parametrize("dia", [0, 8, "x"])
def test_ca05_dia_fuera_de_1_a_7_es_invalido(dia):
    serializer = TurnoSerializer(data=_payload(dias=[{"dia_semana": dia}]))
    assert not serializer.is_valid()
    assert "dias" in serializer.errors


def test_ca05_laborable_distinto_de_s_n_es_invalido():
    serializer = TurnoSerializer(data=_payload(dias=[{"dia_semana": 1, "laborable": "X"}]))
    assert not serializer.is_valid()
    assert "dias" in serializer.errors


def test_ca05_siete_dias_con_laborable_s_n_es_valido():
    dias = [{"dia_semana": d, "laborable": "S" if d <= 5 else "N"} for d in range(1, 8)]
    serializer = TurnoSerializer(data=_payload(dias=dias))
    assert serializer.is_valid(), serializer.errors
    turno = serializer.save(actor="t")
    assert turno.dias_activos().count() == 7
    assert turno.dias.get(dia_semana=6).laborable == "N"


@pytest.mark.parametrize("nombre", ["Mañana|Tarde", "Turno/1", "Noche\\A"])
def test_ca09_nombre_con_caracteres_prohibidos_es_invalido(nombre):
    serializer = TurnoSerializer(data=_payload(nombre=nombre))
    assert not serializer.is_valid()
    assert "nombre" in serializer.errors
    assert "No se admiten los caracteres" in serializer.errors["nombre"][0]


def test_nombre_vacio_o_muy_largo_es_invalido():
    assert not TurnoSerializer(data=_payload(nombre="   ")).is_valid()
    assert not TurnoSerializer(data=_payload(nombre="x" * 101)).is_valid()


def test_campos_de_auditoria_y_estado_son_de_solo_lectura():
    serializer = TurnoSerializer(
        data=_payload(estado="I", creado_por="hacker", actualizado_por="hacker")
    )
    assert serializer.is_valid(), serializer.errors
    turno = serializer.save(actor="rrhh")
    assert turno.estado == "A"
    assert turno.creado_por == "rrhh"
    assert turno.actualizado_por is None
