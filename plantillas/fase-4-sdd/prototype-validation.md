> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# Prototype Validation - <Titulo de la feature>

## Participantes
- <Nombre humano 1, rol> — REQUIERE al menos 1 participante humano para aprobar.
- <Nombre humano 2, rol>

## Fecha
<YYYY-MM-DD>

## Resultado
- Aprobado:
- Aprobado con observaciones:
- Bloqueado:
- Pendiente:

## Validacion de prototipo HTML5
- [ ] El prototipo abre sin build, backend ni dependencias no documentadas.
- [ ] El flujo extremo a extremo se entiende.
- [ ] Los estados loading/progress, empty, error, success y permission denied estan claros cuando aplican.
- [ ] Los roles/permisos son visibles.
- [ ] Las validaciones de formulario se entienden.
- [ ] Los datos mock estan identificados.
- [ ] La navegacion por menu, tabs, botones o breadcrumb es suficiente.
- [ ] El feedback UX cubre toast, modal, confirmacion, progreso o mensajes recuperables.
- [ ] Las limitaciones estan registradas.
- [ ] Se decidio si se requiere formalizar en Penpot.

## Observaciones

## Decisiones

## Cambios requeridos

## Observaciones aceptadas

## Revision visual humana
> OBLIGATORIA (v12.60). El validador automatico NO aprueba la UX por si solo.
> Un HUMANO confirma que "parece producto real". Si se ve pobre -> Resultado: blocked.
> Para approved: Revisor humano real (no agente/IA) + Fecha + Evidencia revisada (path/screenshot).

- Revisor:
- Fecha:
- Resultado: pending  <!-- approved | blocked | pending -->
- Comentarios:
- Evidencia revisada:

## Gate
- `gate-prototype-ready`
- `gate-spdd-approved`
- `gate-prototype-human-visual-review`
