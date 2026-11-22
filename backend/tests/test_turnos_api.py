"""Pruebas de API HU-01 (issue #12): CA-01, CA-06, CA-07 y CA-08 de punta a punta.

También repasa CA-02 a CA-05 y CA-09 a través del endpoint para asegurar que
los errores llegan como HTTP 400 con mensajes legibles.
"""
import pytest
from rest_framework.test import APIClient

from asistencia.models import Turno, TurnoDia

pytestmark = pytest.mark.django_db

URL = "/api/asistencia/turnos/"


@pytest.fixture
def api():
    return APIClient()


def _payload(**extra):
    datos = {
        "empresa_id": 1,
        "nombre": "Mañana",
        "hora_entrada": "08:00",
        "hora_salida": "17:00",
        "tolerancia_min": 10,
        "refrigerio_min": 60,
        "cruza_medianoche": "N",
        "dias": [{"dia_semana": d, "laborable": "S" if d <= 5 else "N"} for d in range(1, 8)],
    }
    datos.update(extra)
    return datos


def _crear(api, **extra):
    respuesta = api.post(URL, _payload(**extra), format="json", HTTP_X_USUARIO="rrhh.ana")
    assert respuesta.status_code == 201, respuesta.data
    return respuesta.data


# ----------------------------------------------------------------------
# CA-01 · Crear
# ----------------------------------------------------------------------
def test_ca01_crear_turno_responde_201_activo_con_auditoria(api):
    respuesta = api.post(URL, _payload(), format="json", HTTP_X_USUARIO="rrhh.ana")
    assert respuesta.status_code == 201, respuesta.data
    datos = respuesta.data
    assert datos["estado"] == "A"
    assert datos["creado_en"] is not None
    assert datos["creado_por"] == "rrhh.ana"
    assert datos["actualizado_en"] is None
    assert datos["hora_entrada"] == "08:00"
    assert datos["hora_salida"] == "17:00"
    assert [d["dia_semana"] for d in datos["dias"]] == [1, 2, 3, 4, 5, 6, 7]
    assert Turno.objects.get(pk=datos["id"]).dias.count() == 7


def test_ca01_sin_cabecera_x_usuario_registra_sistema(api):
    respuesta = api.post(URL, _payload(), format="json")
    assert respuesta.status_code == 201
    assert respuesta.data["creado_por"] == "sistema"


def test_ca01_usuario_autenticado_prevalece_sobre_la_cabecera(api, django_user_model):
    usuario = django_user_model.objects.create_user(username="camila", password="x")
    api.force_authenticate(usuario)
    respuesta = api.post(URL, _payload(), format="json", HTTP_X_USUARIO="otro")
    assert respuesta.status_code == 201
    assert respuesta.data["creado_por"] == "camila"


# ----------------------------------------------------------------------
# CA-02 a CA-05 y CA-09 · 400 con mensajes legibles
# ----------------------------------------------------------------------
def test_ca02_nombre_repetido_responde_400(api):
    _crear(api)
    respuesta = api.post(URL, _payload(), format="json")
    assert respuesta.status_code == 400
    assert "nombre" in respuesta.data


def test_ca03_salida_menor_que_entrada_sin_cruce_400_y_con_cruce_201(api):
    malo = api.post(
        URL, _payload(nombre="Noche", hora_entrada="22:00", hora_salida="06:00"), format="json"
    )
    assert malo.status_code == 400
    assert "hora_salida" in malo.data

    bueno = api.post(
        URL,
        _payload(nombre="Noche", hora_entrada="22:00", hora_salida="06:00", cruza_medianoche="S"),
        format="json",
    )
    assert bueno.status_code == 201, bueno.data


@pytest.mark.parametrize(
    "campo,valor",
    [("tolerancia_min", 121), ("tolerancia_min", -1), ("tolerancia_min", "diez"),
     ("refrigerio_min", 181), ("refrigerio_min", -1), ("refrigerio_min", 2.5)],
)
def test_ca04_rangos_invalidos_responden_400_indicando_el_campo(api, campo, valor):
    respuesta = api.post(URL, _payload(**{campo: valor}), format="json")
    assert respuesta.status_code == 400
    assert campo in respuesta.data


def test_ca05_dia_repetido_responde_400(api):
    respuesta = api.post(
        URL, _payload(dias=[{"dia_semana": 1}, {"dia_semana": 1}]), format="json"
    )
    assert respuesta.status_code == 400
    assert "dias" in respuesta.data
    assert Turno.objects.count() == 0  # la transacción no dejó nada a medias


def test_ca05_se_guarda_una_fila_de_turno_dia_por_dia(api):
    datos = _crear(api, dias=[{"dia_semana": 1, "laborable": "S"}, {"dia_semana": 6, "laborable": "N"}])
    filas = TurnoDia.objects.filter(turno_id=datos["id"]).order_by("dia_semana")
    assert [(f.dia_semana, f.laborable) for f in filas] == [(1, "S"), (6, "N")]


@pytest.mark.parametrize("nombre", ["Mañana|1", "Turno/A", "Tarde\\B"])
def test_ca09_nombre_con_caracteres_prohibidos_responde_400(api, nombre):
    respuesta = api.post(URL, _payload(nombre=nombre), format="json")
    assert respuesta.status_code == 400
    assert "nombre" in respuesta.data


# ----------------------------------------------------------------------
# CA-06 · Editar
# ----------------------------------------------------------------------
def test_ca06_patch_actualiza_auditoria_y_conserva_el_id(api):
    creado = _crear(api)
    respuesta = api.patch(
        f"{URL}{creado['id']}/", {"tolerancia_min": 15}, format="json", HTTP_X_USUARIO="rrhh.luis"
    )
    assert respuesta.status_code == 200, respuesta.data
    assert respuesta.data["id"] == creado["id"]
    assert respuesta.data["tolerancia_min"] == 15
    assert respuesta.data["actualizado_en"] is not None
    assert respuesta.data["actualizado_por"] == "rrhh.luis"
    assert respuesta.data["creado_por"] == "rrhh.ana"  # la creación no se altera
    assert Turno.objects.count() == 1


def test_ca06_put_reemplaza_los_dias_con_baja_logica_de_los_que_salen(api):
    creado = _crear(api)
    nuevo = _payload(nombre="Mañana", dias=[{"dia_semana": 1, "laborable": "N"}, {"dia_semana": 3}])
    respuesta = api.put(f"{URL}{creado['id']}/", nuevo, format="json", HTTP_X_USUARIO="rrhh.luis")
    assert respuesta.status_code == 200, respuesta.data
    assert [(d["dia_semana"], d["laborable"]) for d in respuesta.data["dias"]] == [(1, "N"), (3, "S")]
    # Los días que salieron de la lista siguen en la BD pero inactivos.
    filas = TurnoDia.objects.filter(turno_id=creado["id"])
    assert filas.count() == 7
    assert filas.filter(estado="I").count() == 5
    assert filas.get(dia_semana=1).actualizado_por == "rrhh.luis"


def test_ca06_patch_sin_dias_no_toca_los_dias(api):
    creado = _crear(api)
    respuesta = api.patch(f"{URL}{creado['id']}/", {"nombre": "Mañana B"}, format="json")
    assert respuesta.status_code == 200
    assert len(respuesta.data["dias"]) == 7


def test_ca06_editar_con_nombre_de_otro_turno_responde_400(api):
    _crear(api, nombre="Mañana")
    otro = _crear(api, nombre="Tarde", hora_entrada="14:00", hora_salida="22:00")
    respuesta = api.patch(f"{URL}{otro['id']}/", {"nombre": "Mañana"}, format="json")
    assert respuesta.status_code == 400
    assert "nombre" in respuesta.data


def test_ca06_patch_cruce_de_medianoche_valida_contra_valores_actuales(api):
    creado = _crear(api)  # 08:00 - 17:00, N
    respuesta = api.patch(f"{URL}{creado['id']}/", {"hora_salida": "07:00"}, format="json")
    assert respuesta.status_code == 400
    assert "hora_salida" in respuesta.data


# ----------------------------------------------------------------------
# CA-07 · Baja lógica
# ----------------------------------------------------------------------
def test_ca07_delete_es_baja_logica_y_no_borra_de_la_bd(api):
    creado = _crear(api)
    respuesta = api.delete(f"{URL}{creado['id']}/", HTTP_X_USUARIO="rrhh.luis")
    assert respuesta.status_code == 204

    turno = Turno.objects.get(pk=creado["id"])  # sigue existiendo
    assert turno.estado == "I"
    assert turno.actualizado_por == "rrhh.luis"
    assert turno.actualizado_en is not None

    # Deja de listarse por defecto…
    assert api.get(URL).data == []
    # …pero el detalle sigue disponible
    detalle = api.get(f"{URL}{creado['id']}/")
    assert detalle.status_code == 200
    assert detalle.data["estado"] == "I"


def test_ca07_baja_de_un_turno_ya_inactivo_es_idempotente(api):
    creado = _crear(api)
    api.delete(f"{URL}{creado['id']}/")
    segunda = api.delete(f"{URL}{creado['id']}/")
    assert segunda.status_code == 204
    assert Turno.objects.filter(pk=creado["id"], estado="I").count() == 1


def test_ca07_baja_de_turno_inexistente_responde_404(api):
    assert api.delete(f"{URL}9999/").status_code == 404


# ----------------------------------------------------------------------
# CA-08 · Listado con filtro por estado y detalle con días
# ----------------------------------------------------------------------
def test_ca08_listado_por_defecto_solo_activos_y_filtro_por_estado(api):
    activo = _crear(api, nombre="Mañana")
    inactivo = _crear(api, nombre="Tarde", hora_entrada="14:00", hora_salida="22:00")
    api.delete(f"{URL}{inactivo['id']}/")

    por_defecto = api.get(URL)
    assert por_defecto.status_code == 200
    assert [t["id"] for t in por_defecto.data] == [activo["id"]]

    assert [t["id"] for t in api.get(URL, {"estado": "A"}).data] == [activo["id"]]
    assert [t["id"] for t in api.get(URL, {"estado": "I"}).data] == [inactivo["id"]]
    assert len(api.get(URL, {"estado": "todos"}).data) == 2


def test_ca08_filtro_estado_invalido_responde_400(api):
    respuesta = api.get(URL, {"estado": "Z"})
    assert respuesta.status_code == 400
    assert "estado" in respuesta.data


def test_ca08_filtro_por_empresa(api):
    _crear(api, empresa_id=1, nombre="Mañana")
    _crear(api, empresa_id=2, nombre="Mañana")
    assert len(api.get(URL).data) == 2
    assert len(api.get(URL, {"empresa_id": 2}).data) == 1
    assert api.get(URL, {"empresa_id": "abc"}).status_code == 400


def test_ca08_detalle_incluye_sus_dias(api):
    creado = _crear(api)
    respuesta = api.get(f"{URL}{creado['id']}/")
    assert respuesta.status_code == 200
    assert len(respuesta.data["dias"]) == 7
    assert respuesta.data["dias"][5] == {"id": respuesta.data["dias"][5]["id"], "dia_semana": 6, "laborable": "N"}


def test_detalle_inexistente_responde_404(api):
    assert api.get(f"{URL}9999/").status_code == 404


# ----------------------------------------------------------------------
# Swagger / OpenAPI
# ----------------------------------------------------------------------
def test_endpoints_de_turnos_visibles_en_el_esquema_openapi(api):
    respuesta = api.get("/api/schema/", HTTP_ACCEPT="application/json")
    assert respuesta.status_code == 200
    rutas = respuesta.json()["paths"]
    assert "/api/asistencia/turnos/" in rutas
    assert "/api/asistencia/turnos/{id}/" in rutas
    assert set(rutas["/api/asistencia/turnos/"]) == {"get", "post"}
    assert set(rutas["/api/asistencia/turnos/{id}/"]) == {"get", "put", "patch", "delete"}
    # Los ejemplos de petición están documentados
    post = rutas["/api/asistencia/turnos/"]["post"]
    ejemplos = post["requestBody"]["content"]["application/json"]["examples"]
    assert any("Mañana" in e["value"]["nombre"] for e in ejemplos.values())
