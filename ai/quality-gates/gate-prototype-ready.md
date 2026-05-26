# Gate Prototype Ready

## Objetivo
Validar que una feature visual tiene un prototipo revisable y navegable antes de pedir aprobacion SPDD o avanzar a SDD.

## Regla
`gate-prototype-ready` verifica existencia y calidad minima del prototipo. No reemplaza `gate-spdd-approved`, que requiere validacion humana registrada.

## Prototipos aceptados
- HTML5 navegable en `specs/<feature>/prototype-html5/index.html`, autocontenido por defecto.
- Penpot con link/export registrado.
- Wireframe markdown aprobado como excepcion documentada.
- Mockup validado con evidencia trazable.

## Evidencia minima
- `/prototype/index.html` existe como punto de entrada end-to-end del producto cuando el proyecto tiene prototipos HTML5.
- `/prototype/index.html` incluye las secciones minimas: Journey end-to-end, Prototipos por spec, Actores del sistema y Estado del prototipo/Cobertura.
- Cuando el alcance sea producto completo, `/prototype/index.html` incluye journeys por actor, matriz de cobertura RF/RN/SPDD/gates y estado de validacion por vertical.
- `/prototype/index.html` enlaza al prototipo HTML5 de la feature.
- El prototipo HTML5 de la feature enlaza de vuelta a `/prototype/index.html`.
- Los prototipos estan separados por vertical funcional cuando el alcance del producto lo requiere.
- `specs/<feature>/product-design.md`.
- `specs/<feature>/spdd-frontend.md`.
- `specs/<feature>/prototype.md` con herramienta, ruta o link.
- El primer viewport comunica el producto, actor principal y accion principal sin explicacion externa.
- El prototipo usa un patron visual propio del dominio, no una shell generica salvo que el dominio sea realmente operativo.
- El portafolio mantiene sistema visual comun: marca, tipografia, espaciado, botones, paneles, modales, toasts, formularios y estados coherentes entre specs.
- `decisiones-ux.md` registra dominio del spec, actor, tarea principal, patron elegido y razon para no usar shell generica.
- El prototipo visible no expone RF, permisos tecnicos, gates, rutas internas ni nombres de componentes como contenido de pantalla.
- El prototipo visible no usa labels metodologicos como `Recorrido`, `Resumen`, `Actividad de ejemplo`, `Ajustes de la experiencia`, `Formulario-spec` o `Contrato mock`.
- El prototipo visible no usa controles de validacion como `Cobertura`, `Estados UI`, `Simular loading`, `Simular empty`, `Simular error`, `Simular success` o equivalentes. Esos terminos pertenecen al hub, al SPDD, a decisiones UX o al validador, no a la experiencia de producto.
- El prototipo visible no usa timeline generico, pasos numerados ni checklist de proceso como sustituto de una experiencia de producto. Si usa timeline, debe estar justificado por el dominio y funcionar como componente real del producto.
- Las restricciones por rol/perfil aparecen como comportamiento del producto, no como codigos tecnicos.
- El prototipo de la feature se ve como una parte real del producto y no como copia del hub ni de otra spec.
- Existe un corte vertical de producto navegable de principio a fin.
- Navegacion o flujo revisable.
- Estados UI criticos representados como comportamiento natural: loading, empty, error y permission denied cuando aplique.
- Estado success y progreso representados cuando el flujo tenga acciones confirmables, jobs, procesos asincronos, descargas o reproduccion.
- Validaciones visibles para campos obligatorios, fechas, rangos o reglas de negocio.
- Diferencias por rol/perfil visibles cuando la experiencia cambie, expresadas como acciones disponibles, bloqueos o mensajes de producto, no como permisos tecnicos.
- Navegacion estructural visible: menu lateral, tabs, botones, breadcrumb o equivalente segun el flujo.
- Feedback UX visible: toast, modal, confirmacion, progreso o mensaje recuperable.
- Formularios, tablas, modales, toasts o historial representados cuando el flujo los requiere.
- Datos mock claramente identificados.
- Limitaciones del prototipo documentadas.
- `specs/<feature>/prototype-html5/flujo.md` y `decisiones-ux.md` cuando el modo sea HTML5.
- `specs/<feature>/prototype-validation.md` creado, aunque este pendiente de aprobacion.

## Checklist minimo
| Elemento | Criterio |
|---|---|
| Producto | Primer viewport reconocible como el producto real del dominio |
| Hub | `/prototype/index.html` permite navegar el recorrido end-to-end |
| Secciones hub | Journey end-to-end, Prototipos por spec, Actores del sistema y Estado/Cobertura |
| Bidireccionalidad | Hub enlaza a la spec y la spec enlaza al hub |
| Flujo | Journey principal extremo a extremo revisable |
| Corte vertical | Tarea principal recorrible de inicio a fin |
| Patron de dominio | Streaming parece streaming; player parece player; backoffice parece backoffice; seguridad parece consola operativa |
| Sistema visual | Todos los prototipos parecen del mismo producto, con acentos controlados por vertical |
| Lenguaje visible | Labels y encabezados pertenecen al dominio, no a la metodologia |
| Estructura visual | Avance y flujo aparecen como componentes del producto; timeline solo si el dominio lo requiere |
| Estados | Cargando, error, exito, sin resultados y permiso denegado como comportamiento, no como checklist |
| Validaciones | Obligatorios, fechas, rangos invalidos y reglas de negocio visibles |
| Roles | Diferencias para admin, operador, auditor u otros roles del dominio |
| Datos fake | Tablas, formularios, filtros, historial y resultados mock |
| Navegacion | Topbar, player, tabs, menu, breadcrumb o equivalente segun dominio |
| Feedback UX | Toast, modal, confirmacion, progreso y mensajes recuperables |

## Bloqueantes
- No existe `/prototype/index.html` como hub end-to-end en un proyecto con prototipos HTML5.
- Producto completo comprimido en un unico prototipo monolitico sin verticales funcionales.
- Hub reducido a lista de enlaces sin journey, cobertura ni estado de gates.
- No hay navegacion bidireccional entre hub y prototipo de spec.
- El prototipo de la spec es una copia del hub o de otra spec sin foco propio de RF.
- No existe prototipo revisable.
- El prototipo parece una plantilla generica y no el producto real.
- El spec tiene un patron reconocible y el agente eligio una shell comun por rapidez.
- Catalogo/reproduccion no tiene topbar, perfil, busqueda/filtros, posters, detalle y accion de reproduccion.
- Reproductor streaming no tiene player 16:9, play/pause, seek, volumen/calidad/subtitulos, episodios y progreso.
- Estados o RF aparecen como tabs/pantallas de checklist en vez de interacciones naturales.
- Estados criticos se exponen como botones de simulacion (`Simular loading`, `Sin datos`, `Reintentar error`, `Acceso denegado`) en lugar de aparecer al ejecutar acciones reales del producto.
- La navegacion principal o encabezados visibles usan labels de plantilla/metodologia como `Resumen`, `Actividad de ejemplo`, `Recorrido`, `Recorrido simulado`, `Ajustes de la experiencia`, `Formulario-spec` o `Contrato mock`.
- La UI visible usa timeline generico, pasos numerados o checklist de proceso para aparentar flujo sin justificacion de dominio.
- Los prototipos no respetan un sistema visual comun y parecen productos distintos sin decision documentada.
- El prototipo cubre RF con modulos sueltos pero no permite recorrer una tarea principal completa.
- El primer viewport no deja claro marca/producto, actor y accion principal.
- El prototipo no cubre el journey principal.
- No hay estados de error o permisos.
- No hay validaciones visibles para inputs criticos.
- No hay diferencias por rol/perfil ni accesos denegados cuando la feature depende de acceso.
- No hay feedback para acciones importantes.
- No hay ruta, link o evidencia reproducible.
- La feature visual pretende pasar directo a SDD.

## Resultado esperado
- `Listo para validacion`
- `Listo con observaciones`
- `Bloqueado`

## Rutas esperadas por feature
- `prototype/index.html`
- `specs/<feature>/prototype.md`
- `specs/<feature>/prototype-validation.md`
- `specs/<feature>/ui-test-cases.md`
- `specs/<feature>/prototype-html5/index.html` cuando el modo sea HTML5
- `specs/<feature>/prototype-html5/flujo.md` cuando el modo sea HTML5
- `specs/<feature>/prototype-html5/decisiones-ux.md` cuando el modo sea HTML5

## Calidad visual HTML5

Para prototipos en modo HTML5, este gate debe aplicarse **junto con** `gate-html5-product-quality.md`.

`gate-prototype-ready` puede marcarse como `Listo para validacion` unicamente si:
- El prototipo HTML5 alcanza **nivel 2 o nivel 3** segun `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`.
- Ningun criterio de bloqueo (B1-B10) de `gate-html5-product-quality.md` aplica.

Si el agente no ha evaluado `gate-html5-product-quality.md`, este gate no puede cerrarse.

## Referencias
- `../../docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md`
- `../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `../../docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`
- `../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `gate-html5-product-quality.md`
- `../commands/prototype-command.md`
- `../skills/html5-prototyping.skill.md`
- `../skills/penpot-ai-prototyping.skill.md`
- `../../ci/scripts/check-html5-prototype-quality.mjs`
