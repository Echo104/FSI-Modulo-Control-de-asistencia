import pytest
from core.models import Establecimiento


def test_swagger_disponible(client):
    assert client.get("/api/docs/").status_code == 200


@pytest.mark.django_db
def test_conexion_a_la_base():
    Establecimiento.objects.create(codigo_anexo="0000", nombre="Sede principal")
    assert Establecimiento.objects.count() == 1