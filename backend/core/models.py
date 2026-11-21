from django.db import models


class Establecimiento(models.Model):
    codigo_anexo = models.CharField(max_length=4)
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200, blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class CentroCosto(models.Model):
    codigo = models.CharField(max_length=24, unique=True)
    descripcion = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"


class Trabajador(models.Model):
    empresa_id = models.BigIntegerField()
    codigo = models.CharField(max_length=11)
    tipo_documento = models.CharField(max_length=1)  # Tabla 2 SUNAT
    numero_documento = models.CharField(max_length=15)
    apellidos_nombres = models.CharField(max_length=100)
    fecha_ingreso = models.DateField()
    fecha_cese = models.DateField(null=True, blank=True)
    establecimiento = models.ForeignKey(
        Establecimiento, null=True, blank=True, on_delete=models.PROTECT
    )
    centro_costo = models.ForeignKey(
        CentroCosto, null=True, blank=True, on_delete=models.PROTECT
    )
    activo = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["empresa_id", "tipo_documento", "numero_documento"],
                name="uq_trabajador_documento",
            )
        ]

    def __str__(self):
        return self.apellidos_nombres