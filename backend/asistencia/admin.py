from django.contrib import admin

from .models import Turno, TurnoDia


class TurnoDiaInline(admin.TabularInline):
    model = TurnoDia
    extra = 0
    fields = ("dia_semana", "laborable", "estado", "creado_por")


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "empresa_id",
        "nombre",
        "hora_entrada",
        "hora_salida",
        "tolerancia_min",
        "refrigerio_min",
        "cruza_medianoche",
        "estado",
    )
    list_filter = ("estado", "empresa_id", "cruza_medianoche")
    search_fields = ("nombre",)
    readonly_fields = ("creado_en", "actualizado_en")
    inlines = [TurnoDiaInline]
