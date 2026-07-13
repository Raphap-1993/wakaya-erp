# Spec funcional - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Permitir que backoffice administre el home publico de Wakaya desde un editor
estructurado, bilingue y seguro, con publicacion inmediata y sin romper la
logica existente del sitio.

## Actores
- Editor de contenido: edita y publica el home.
- Administrador: puede publicar, restaurar revisiones y resolver conflictos.
- Operador sin permiso: puede navegar el backoffice, pero no publicar el home.
- Visitante: consume solo la version publicada.

## Requerimientos funcionales

| ID | Actor | Requerimiento | Resultado esperado |
|---|---|---|---|
| RF-HOME-01 | Editor de contenido | Administrar slides del slider en ES y EN | Slides con orden, visible y copy localizado |
| RF-HOME-02 | Editor de contenido | Editar textos de secciones visibles del home | Cada seccion expone campos localizados por bloque |
| RF-HOME-03 | Editor de contenido | Configurar etiquetas y destinos de CTA seguros | Solo rutas internas, telefono, WhatsApp o HTTPS |
| RF-HOME-04 | Editor de contenido | Cambiar visibilidad y orden de slider y secciones | El home publicado respeta estructura guardada |
| RF-HOME-05 | Editor de contenido | Cambiar tamano y peso tipografico con presets seguros mas ajuste fino acotado | Sin CSS libre ni valores fuera de rango |
| RF-HOME-06 | Editor de contenido | Guardar y publicar el home completo de forma atomica | No quedan versiones parciales visibles |
| RF-HOME-07 | Administrador | Consultar y restaurar revisiones publicadas | Restore rapido a ultimo estado valido |
| RF-HOME-08 | Sistema | Mantener la logica publica de reservas y bungalows | Bungalows destacados siguen viniendo de su modulo |
| RF-HOME-09 | Sistema | Restringir publicacion a `content:write` | Lectura publica y acceso admin protegidos |

## Requerimientos no funcionales
- RNF-HOME-01 Seguridad: solo `content:write` publica o restaura.
- RNF-HOME-02 UX: la pantalla debe priorizar estado, estructura y siguiente
  accion sobre explicaciones largas.
- RNF-HOME-03 Persistencia: cada publicacion genera una revision recuperable.
- RNF-HOME-04 Compatibilidad: la web publica cae al ultimo payload valido o al
  snapshot por defecto si falla la lectura persistida.
- RNF-HOME-05 Localizacion: ES y EN comparten estructura, media y orden.

## Criterios de aceptacion
- `/admin/home` existe y muestra version, ultima publicacion y CTA principal.
- El editor permite cambiar slider, textos, CTA, visibilidad y tipografia.
- El home publicado nunca expone un payload invalido.
- Un usuario sin `content:write` recibe `403` en APIs y no ve accion de publicar.
- Un conflicto de version devuelve `409 home_content_version_conflict`.
