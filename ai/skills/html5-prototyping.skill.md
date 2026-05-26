# Skill: HTML5 Prototyping

## Objetivo
Generar prototipos HTML5 navegables desde SPDD para validar UX rapidamente antes de construir frontend real o formalizar diseno en Penpot.

## Regla producto-real
Cobertura documental no equivale a prototipo. El prototipo debe permitir recorrer una tarea real de inicio a fin y debe parecer una porcion reconocible del producto.

**Calidad minima exigida: nivel 2 o nivel 3 segun la rubrica.**
Ver `../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md` para clasificacion completa.
Antes de reportar como "listo", evaluar `../../ai/quality-gates/gate-html5-product-quality.md`.
Golden example de referencia nivel 3: `../../ejemplos/fase-2-ux-ui/prototype-html5-golden/streaming-catalogo-player/index.html`.
Prompt ejecutable compacto con checklist de salida: `../prompts/generar-prototipo-html5-ejecutable.md`.

Cuando el alcance sea un producto completo, genera o propone un portafolio de prototipos por vertical funcional. No comprimas un dominio amplio en una sola shell generica.

## Aplicala cuando
- existe `spdd-frontend.md`,
- se necesita validar flujo UX rapido,
- se quiere mostrar una experiencia navegable,
- todavia no se requiere diseno visual formal en Penpot,
- se quiere trabajar con IA/Codex y versionar el prototipo en Git.
- se necesita validar formularios, tablas, modales, toasts o procesos asincronos con datos mock.

## No la apliques cuando
- la feature no tiene superficie visual,
- no existe Product Design minimo,
- el proyecto exige diseno visual final antes de cualquier prototipo,
- ya existe prototipo Penpot aprobado y vigente.

## Entradas minimas
- `product-design.md`,
- `spdd-frontend.md`,
- `ui-test-cases.md` si existe,
- reglas de negocio visibles,
- permisos,
- roles de usuario,
- estados UI esperados.

## Flujo recomendado
1. Leer Product Design.
2. Leer SPDD.
3. Decidir el patron visual del dominio antes de escribir HTML. Ejemplos: streaming = topbar, perfiles, hero, catalogo visual, detalle y player; herramienta operativa = toolbar, filtros, tabla, detalle, acciones e historial.
4. Registrar una decision previa: dominio del spec, actor principal, tarea recorrible, patron elegido, por que no aplica shell generica e interacciones del prototipo expresadas como acciones reales del producto.
5. Si el alcance es producto completo, descomponer en verticales funcionales antes de escribir HTML.
6. Identificar el corte vertical de producto: una tarea real que el stakeholder pueda recorrer de principio a fin.
7. Identificar pantallas, roles y journey principal extremo a extremo.
8. Crear o actualizar `/prototype/index.html` como hub/guia end-to-end del producto, con journeys por actor, prototipos por spec, cobertura y estado de gates.
9. Crear estructura `prototype-html5/`.
10. Crear `index.html` autocontenido por defecto para la spec.
11. Asegurar navegacion bidireccional: hub -> spec y spec -> hub.
12. Hacer que el prototipo de la spec sea propio de sus RF y parezca una feature real del producto, no una copia del hub.
13. Crear HTML5 semantico, CSS responsive y JavaScript vanilla en el mismo archivo.
14. Simular navegacion, datos mock, formularios, modales, toasts, progreso, tablas e historial segun el flujo y el dominio.
15. Simular estados UI como comportamiento natural: loading al cargar, empty por filtros, error recuperable, success por accion, progress en player/job y permission denied por perfil. No mostrarlos como checklist.
16. Simular diferencias por rol o perfil: admin, operador, auditor, adulto, nino u otros roles del dominio, pero en lenguaje de producto. No mostrar permisos tecnicos, RF, gates, rutas o componentes como texto visible del HTML.
17. Incluir la navegacion propia del producto: topbar, selector, catalogo, tabs, menu, breadcrumb o patron equivalente segun dominio.
18. Evitar shells genericas que solo demuestran RF; el primer viewport debe comunicar que producto es y que accion principal permite.
19. Mantener un sistema visual compartido entre prototipos del mismo producto: tokens base de marca, tipografia, espaciado, botones, paneles, modales, toasts, formularios y estados. El acento por vertical no debe romper la identidad comun.
20. Eliminar labels visibles de metodologia. No usar `Recorrido`, `Resumen`, `Actividad de ejemplo`, `Ajustes de la experiencia`, `Formulario-spec` o `Contrato mock` como UI; traducirlos a lenguaje del dominio.
21. Decidir si timeline pertenece al dominio. Usarlo solo cuando sea patron natural del producto, por ejemplo tracking de pedido, historia clinica, auditoria, seguimiento de caso, expediente, ticket, roadmap, despliegue o actividad operacional. Si no aplica, convertir el avance en producto: player con progreso, resultados, solicitudes, cola, historial, actividad reciente, vista previa o seguimiento.
22. Documentar el mapeo futuro hacia Angular en `decisiones-ux.md` o `spdd-frontend.md`; mantener el HTML visible centrado en producto.
23. Crear `flujo.md` con pantallas, transiciones, roles, estados y feedback.
24. Crear `decisiones-ux.md` con supuestos, decisiones y limitaciones, incluyendo el patron de producto elegido y la relacion con `/prototype/index.html`.
25. Registrar el prototipo en `prototype.md`.
26. Preparar `prototype-validation.md`.
27. Aplicar `gate-prototype-ready`.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es solo un mock rapido | Aun asi debe cubrir journey, estados y permisos |
| Angular lo resolvera despues | El prototipo existe para descubrir problemas antes de Angular |
| Los errores no importan en UX | Los estados de error son parte del flujo del usuario |
| Los roles se validan en backend | La UX tambien debe mostrar diferencias por perfil y accesos denegados, pero sin exponer permisos tecnicos |
| Separar CSS y JS siempre es mas ordenado | Para validacion rapida se privilegia portabilidad: un `index.html` autocontenido |
| Cubri todos los RF en una shell generica | Cobertura no equivale a producto; debe existir un corte vertical reconocible y recorrible |
| Luego UX lo hara bonito | HTML5-first debe permitir validar experiencia, no solo estructura documental |
| Un prototipo monolitico basta para todo el producto | Para productos amplios se requiere portafolio por vertical funcional |
| Ya tengo loading, empty, error y permisos como tabs | Los estados deben sentirse como comportamiento del producto, no como una lista de checklist |
| Reutilizo la misma shell para acelerar | Si el dominio tiene patron reconocible, la shell compartida es un defecto de metodologia |
| Pongo "Recorrido" porque describe el flujo | En el HTML5 visible debe decir algo del producto, por ejemplo Reproduccion, Resultados, Solicitudes o Seguimiento |
| Cambio colores por spec para diferenciarlos | Los acentos son validos, pero el sistema visual base debe seguir siendo el mismo producto |
| Quito "Recorrido" pero dejo pasos numerados | Si no es un timeline propio del dominio, sigue siendo metodologico; debe convertirse en player, resultados, cola, actividad, historial o seguimiento |
| Prohibo todo timeline | Tambien es un error; tracking, auditoria, historia clinica o seguimiento de caso pueden necesitar timeline real |

## Ejemplo de decision correcta
Para `catalogo-y-reproduccion` en una app cristiana de streaming:
- dominio: streaming/contenido;
- actor: perfil familiar o infantil;
- tarea principal: buscar contenido, abrir detalle, reproducir o guardar;
- patron: topbar de marca, selector de perfil, hero, filtros por edad/tema, posters, detalle modal y player;
- interacciones: filtrar catalogo, abrir detalle, cambiar perfil, reproducir, favorito, permiso denegado por edad.

Para `reproductor-streaming`:
- dominio: player;
- actor: perfil reproduciendo contenido;
- tarea principal: reproducir un episodio y controlar playback;
- patron: video 16:9, controles play/pause, seek, volumen, calidad, subtitulos, episodios, autoplay;
- interacciones: play/pause, seek, cambiar calidad, alternar subtitulos, seleccionar episodio, finalizar/autoplay.

## Red flags
- No existe `/prototype/index.html` como hub end-to-end.
- El prototipo por spec no tiene enlace visible para volver al hub.
- El hub no enlaza al prototipo por spec.
- Los prototipos por spec son copias del hub o entre si.
- El prototipo se ve como una plantilla generica y no como el producto real del dominio.
- El agente eligio un dashboard lateral por comodidad aunque el dominio exigia otro patron, por ejemplo streaming, marketplace o educacion.
- No hay corte vertical claro; hay muchos modulos sueltos pero ninguna tarea principal recorrible.
- Producto completo comprimido en un unico prototipo sin verticales diferenciadas.
- Hub sin journeys por actor ni matriz de cobertura.
- HTML5 no cubre estados UI.
- No existe navegacion entre pantallas.
- No se simulan errores.
- No se simulan diferencias por rol/perfil o acceso denegado cuando el dominio los requiere.
- El HTML visible contiene RF, permisos tecnicos, gates, rutas internas o nombres de componentes como si fueran contenido del producto.
- El HTML visible usa labels de metodologia como `Recorrido`, `Resumen`, `Actividad de ejemplo`, `Ajustes de la experiencia`, `Formulario-spec` o `Contrato mock`.
- El HTML visible usa timeline generico, pasos numerados o checklist de proceso para demostrar flujo, sin que sea un patron natural del dominio.
- Cada prototipo parece pertenecer a una marca distinta por cambios de color, espaciado o componentes sin sistema comun.
- Faltan validaciones, modal, toast o historial cuando el flujo los necesita.
- Falta indicador de progreso en procesos asincronos.
- Depende de backend, build o paquetes externos no aprobados.
- No se documentan limitaciones.
- Se confunde prototipo HTML5 con frontend productivo.

## Verification evidence
- `/prototype/index.html` existe como hub/guia end-to-end,
- el hub incluye Journey end-to-end, Prototipos por spec, Actores del sistema y Estado del prototipo/Cobertura,
- navegacion bidireccional hub <-> spec,
- `prototype-html5/index.html` autocontenido creado,
- el prototipo por spec es propio de la feature y se ve como producto real,
- primer viewport comunica marca/producto, actor y accion principal,
- existe un corte vertical de producto navegable de principio a fin,
- el patron visual elegido corresponde al dominio y queda registrado en `decisiones-ux.md`,
- el sistema visual compartido se respeta entre prototipos,
- no hay labels metodologicos visibles en el HTML5 de la spec,
- no hay timeline generico, pasos numerados ni checklist de proceso; si hay timeline, esta justificado por dominio y funciona con datos/eventos del producto,
- archivo de flujo creado dentro de `specs/<feature>/prototype-html5/`,
- archivo de decisiones UX creado dentro de `specs/<feature>/prototype-html5/`,
- navegacion funcional,
- estados UI visibles,
- validaciones/interacciones clave visibles,
- diferencias por rol/perfil y feedback UX visibles cuando aplican,
- link o ruta registrada en `prototype.md`,
- validacion preparada en `prototype-validation.md`.

## Referencias
- `../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `../../docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`
- `../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `../prompts/generar-prototipo-html5-ejecutable.md`
- `../quality-gates/gate-html5-product-quality.md`
- `../quality-gates/gate-prototype-ready.md`
- `../commands/prototype-command.md`
- `../../ejemplos/fase-2-ux-ui/prototype-html5-golden/streaming-catalogo-player/index.html`
- `../../ci/scripts/check-html5-prototype-quality.mjs`
