# Wakaya: contenido corporativo histórico administrable

Fecha: 2026-07-10

## Objetivo

Recuperar el contenido relevante de la web histórica de Wakaya y convertirlo en la fuente administrable de las páginas públicas de empresa, políticas y contacto. La publicación debe conservar el detalle operativo del respaldo, eliminar copy genérico o propio del proceso de desarrollo y permitir cambios sin desplegar código.

## Fuente y alcance

Las fuentes históricas son los artefactos de `output/wakaya-corporate-legacy/extracted/` para `aboutus`, `terms`, `faq` y `testimonial`, junto con el HTML capturado y el contenido público vigente como respaldo de compatibilidad.

El documento corporativo cubre:

- Nosotros: historia, entorno natural, significado de Wakaya, propósito y valores.
- Preguntas frecuentes: preguntas y respuestas recuperadas, con ortografía normalizada.
- Testimonios: autores, procedencia, cita e imagen.
- Términos: definiciones, derechos y obligaciones, registro, admisión, horarios, pagos, reservas, cancelaciones, no-show, reglas de convivencia, seguridad, objetos olvidados, estacionamiento y servicios de terceros.
- Privacidad: introducción, finalidad, marco legal, principios, datos recopilados, veracidad, usos, consentimiento, comunicaciones, seguridad, derechos y vigencia.
- Contacto: dirección, teléfonos, WhatsApp, correos y horario de atención.

## Decisiones

1. La fuente de verdad será una revisión JSONB versionada en PostgreSQL, siguiendo el patrón ya usado por Home.
2. El Centro de Contenido incorporará la pestaña `Empresa y políticas` con edición ES/EN, guardado explícito, número de versión e historial restaurable.
3. Las páginas públicas leerán la última revisión publicada y usarán el documento inicial del código solo si aún no existe la tabla o no hay revisiones.
4. Las notas de origen, discrepancias y revisión legal serán internas. Nunca se renderizarán en la web pública.
5. El early check-in inicial será 50 % desde las 06:00, por corresponder a la política de reserva específica. La discrepancia histórica de 25 % se conserva en notas internas.
6. Se mantiene inicialmente el horario público vigente, lunes a domingo de 07:00 a 20:00, al no existir un horario verificable en el respaldo histórico. Queda editable.
7. La política de privacidad mencionará la Ley 29733 y su reglamento vigente; no se importará la referencia histórica errónea a la Ley 27086.
8. El contenido público no incluirá indicaciones para desarrolladores, notas de implementación, sugerencias de navegación redundantes ni explicaciones del flujo interno.

## Modelo

`corporate_content_revision` conserva una secuencia inmutable de publicaciones. Cada registro incluye versión, documento validado, usuario que publicó, fecha y versión restaurada cuando corresponda.

El documento contiene `schemaVersion`, contenidos localizados de las cuatro páginas corporativas, configuración compartida de contacto y metadatos internos de procedencia.

## Superficie administrativa

La pestaña utiliza los componentes y densidad ya establecidos por el Centro de Contenido:

- selector ES/EN;
- navegación lateral por página o grupo;
- campos directos, sin párrafos de ayuda ornamental;
- listas editables para secciones, FAQ, valores y testimonios;
- bloque de contacto compartido;
- advertencias internas compactas;
- acción `Guardar y publicar`;
- historial con acción `Restaurar`.

## Publicación y concurrencia

El cliente envía `expectedVersion`. Si otra persona publicó antes, la API responde 409 y no pisa los cambios. Restaurar crea una revisión nueva; nunca altera una revisión existente.

## Verificación

- pruebas de esquema y cobertura del respaldo histórico;
- pruebas del store, conflicto de versión y restauración;
- pruebas de API, permisos y errores;
- pruebas de editor y ausencia de notas internas en la web pública;
- pruebas de páginas ES/EN y datos de contacto;
- typecheck, suite Vitest, build y smoke E2E;
- backup, migración, despliegue, verificación pública y backoffice, con rollback documentado.
