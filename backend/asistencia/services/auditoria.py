"""Resolución del actor (usuario) que realiza una operación, para auditoría.

Mientras el proyecto no tenga autenticación, el actor se toma en este orden:
1. `request.user.username` si el usuario está autenticado.
2. Cabecera HTTP `X-Usuario` enviada por el cliente.
3. El valor por defecto `sistema`.
Cuando se agregue login, el punto 1 se activa solo, sin tocar el código.
"""

ACTOR_POR_DEFECTO = "sistema"
LONGITUD_MAXIMA_ACTOR = 128


def obtener_actor(request) -> str:
    """Devuelve el identificador del usuario que ejecuta la petición."""
    if request is None:
        return ACTOR_POR_DEFECTO

    usuario = getattr(request, "user", None)
    if usuario is not None and getattr(usuario, "is_authenticated", False):
        nombre = usuario.get_username()
        if nombre:
            return nombre[:LONGITUD_MAXIMA_ACTOR]

    cabecera = (request.headers.get("X-Usuario") or "").strip()
    if cabecera:
        return cabecera[:LONGITUD_MAXIMA_ACTOR]

    return ACTOR_POR_DEFECTO
