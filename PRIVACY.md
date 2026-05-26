# Privacidad y datos

[README principal](README.md) | [Indice docs](docs/README.md)

Este documento describe como la plantilla `project-template` trata los datos cuando se usa como base de un proyecto real. Cada equipo debe adaptarlo a su jurisdiccion y caso de negocio.

## Principios

- Minimizacion: recolectar solo los datos necesarios para la funcion descrita.
- Proposito limitado: los datos se usan para el fin declarado al usuario.
- Retencion limitada: los datos se eliminan o anonimizan cuando ya no son necesarios.
- Transparencia: los usuarios saben que datos se procesan y como.

## Categorias de datos consideradas

| Categoria              | Ejemplo                           | Sensibilidad |
|------------------------|-----------------------------------|--------------|
| Datos tecnicos         | IP, user-agent, traceId           | Media        |
| Identificadores        | id de usuario, correo             | Media-alta   |
| Contenido operativo    | expediente, comentarios           | Alta         |
| Credenciales           | tokens, claves API                | Critica      |

## Derechos del titular

Se soportan los derechos ARCO (o equivalentes) segun la jurisdiccion: acceso, rectificacion, cancelacion, oposicion, portabilidad y supresion. Los canales especificos se registran en `docs/transversal/90.16-privacidad-compliance.md`.

## Subprocesadores y transferencias

Los subprocesadores (proveedores cloud, SMTP, analytics) se listan en `ops/privacidad/subprocesadores.md` cuando el proyecto real los agregue. Cualquier transferencia internacional requiere clausula contractual estandar o mecanismo equivalente.

## Contacto

Correo del oficial de privacidad: `privacidad@ejemplo.dev`. Adaptar al canal real del equipo.

---

[Volver al README principal](README.md)
