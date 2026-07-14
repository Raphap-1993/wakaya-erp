# Wakaya Guided Home Validation Design

<!-- nav-guided:start -->
## Navegación guiada
- Anterior: [Content Workbench aprobado](2026-07-13-wakaya-content-workbench-capacity-simplification-design.md)
- Siguiente: [Plan de implementación](../plans/2026-07-14-wakaya-guided-home-validation.md)
<!-- nav-guided:end -->

## Problema

Al intentar publicar un documento inválido, el editor del Home muestra un aviso
general que obliga al operador a revisar manualmente todos los slides, secciones,
idiomas, CTA y opciones avanzadas. La API ya entrega las rutas de validación de
Zod en `issues`, pero la interfaz descarta ese detalle y conserva únicamente el
código `invalid_home_content_payload`.

## Decisión aprobada

El Product Owner aprobó el 2026-07-14 el flujo guiado completo:

1. validar localmente antes de enviar la publicación;
2. mostrar todos los errores con bloque, idioma y campo;
3. incluir una acción `Ir al campo` por error;
4. seleccionar y enfocar automáticamente el primer error;
5. indicar `Revisar · N campos` en el bloque afectado;
6. abrir `Opciones avanzadas` cuando el error pertenezca a estilos;
7. marcar el control enfocado con estado inválido accesible.

## Interacción

Al pulsar `Publicar cambios`, el editor ejecuta el mismo schema del documento
antes del `PUT`. Si hay errores, no envía la mutación y presenta:

```text
No se puede publicar. Corrige 3 campos.

Historia · Español · Título              [Ir al campo]
Slider · English · Destino del CTA       [Ir al campo]
Configuración web · Peso exacto heading  [Ir al campo]
```

La primera incidencia abre su slide o sección, cambia a ES/EN si corresponde,
desplaza el formulario y enfoca el control. Cada acción posterior repite ese
comportamiento para la incidencia elegida.

Mientras el resumen está visible, los conteos se recalculan al editar. Un error
corregido desaparece del resumen sin necesidad de intentar publicar otra vez.
Los mensajes no exponen rutas técnicas, índices, IDs ni códigos de Zod.

## Estados y accesibilidad

- El resumen usa `role="alert"` y un encabezado operativo breve.
- Cada incidencia tiene texto comprensible y botón con nombre explícito.
- El control elegido recibe `aria-invalid="true"` y referencia al mensaje.
- El foco no se mueve durante la escritura; solo cambia al publicar con errores
  o al activar `Ir al campo`.
- Los errores de versión, red y media mantienen sus mensajes actuales.
- Si el servidor devuelve `issues`, la UI conserva y traduce esas rutas como
  respaldo en lugar de descartarlas.

## Alcance técnico

- Reutilizar `homeContentV2Schema`; no duplicar reglas de validación.
- Agregar un adaptador puro entre rutas Zod y destinos del editor.
- Mantener sin cambios el contrato público, el schema persistido y la API.
- No agregar dependencias ni construir un motor genérico de formularios.

## Evidencia esperada

- Unit tests del adaptador para slide, sección, idioma, CTA y estilo.
- Test del editor para el resumen y estados iniciales.
- Playwright autenticado que vacía un campo, intenta publicar, comprueba que no
  hay `PUT`, navega al bloque y verifica foco/`aria-invalid`.
- Typecheck, lint focalizado y build local.

## Gates

- `gate-ux-ready`: APROBADO por el Product Owner el 2026-07-14.
- `gate-prototype-ready`: cubierto por el wireframe textual aprobado de la
  feature 010 y la interacción textual anterior.
- `gate-spdd-approved`: APROBADO por instrucción `haz el recomendado`.
- `gate-4-6`: abierto para TDD y QA local.
- Producción: fuera de alcance hasta aprobación explícita posterior.
