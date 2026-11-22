"""Rutas del módulo Control de Asistencia: /api/asistencia/<recurso-en-plural>/."""
from rest_framework.routers import DefaultRouter

from asistencia.views import TurnoViewSet

app_name = "asistencia"

router = DefaultRouter()
router.register("turnos", TurnoViewSet, basename="turno")

urlpatterns = router.urls
