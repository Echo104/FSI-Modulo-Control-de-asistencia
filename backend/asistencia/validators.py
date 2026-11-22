"""Validadores reutilizables del módulo Control de Asistencia."""
from rest_framework import serializers

# Definición de Hecho: los textos libres rechazan los caracteres | / \
CARACTERES_PROHIBIDOS = ("|", "/", "\\")


def validar_texto_libre(valor: str) -> str:
    """Rechaza los caracteres | / \\ en cualquier texto libre (CA-09 de HU-01)."""
    if valor is None:
        return valor
    encontrados = [c for c in CARACTERES_PROHIBIDOS if c in valor]
    if encontrados:
        lista = " ".join(encontrados)
        raise serializers.ValidationError(
            f"No se admiten los caracteres {lista} en este campo."
        )
    return valor
