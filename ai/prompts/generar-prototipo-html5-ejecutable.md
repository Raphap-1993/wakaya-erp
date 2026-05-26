# Prompt ejecutable: HTML5 Product Prototype

> Versión compacta y cerrada para ejecución directa por agente de IA.
> Para el estándar completo ver `docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`.

---

## Paso 1 — Lee estos archivos antes de escribir una sola línea de HTML

```
specs/<feature>/product-design.md
specs/<feature>/spdd-frontend.md
specs/<feature>/ui-test-cases.md                                   (si existe)
docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md
docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md
ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md             (índice)
ejemplos/fase-2-ux-ui/prototype-html5-golden/<dominio-más-cercano> (LEER COMPLETO)
ejemplos/fase-2-ux-ui/prototype-html5-anti-ejemplo/README.md       (qué NO hacer)
```

**Regla dura sobre el golden**: no puedes empezar a escribir HTML hasta haber leído íntegramente el `index.html` del golden del dominio más cercano y haber tomado nota de:
- Cuántas custom properties tiene su `:root`.
- Cuántas vistas/secciones distinguibles ofrece.
- Cómo estructura los datos mock (cantidad y campos).
- Qué patrón de feedback usa (toast, modal, inline).
- Cómo trata responsive.

Estas observaciones se citan en `decisiones-ux.md` (Paso 2). Sin cita verificable, el gate queda bloqueado.

---

## Paso 2 — Declara el plan visual ANTES de escribir HTML

Responde estas preguntas en `specs/<feature>/prototype-html5/decisiones-ux.md`. Los seis primeros campos son obligatorios y son verificados por `ci/scripts/check-html5-prototype-quality.mjs` mediante regex sobre los labels exactos.

```md
## Decisión de patrón de producto
- Dominio del spec:
- Actor principal:
- Tarea principal navegable de inicio a fin:
- Patrón visual elegido (streaming / operativo / ecommerce / educación / otro):
- Por qué NO se usa una shell genérica sidenav+tabla:
- Interacciones del prototipo (mínimo 3, expresadas como acciones reales del producto):
- Limitaciones conocidas:

## Golden de referencia
- Path: `ejemplos/fase-2-ux-ui/prototype-html5-golden/<elegido>/index.html`
- Por qué este golden: <razón en una frase>
- Patrones estructurales que voy a replicar (cita o anclaje):
  - <patrón 1, ej. "topbar fija con búsqueda y avatar — líneas 50-95">
  - <patrón 2>
  - <patrón 3>
- Tokens base reutilizados de `:root` (≥ 8): <lista>
```

Si no puedes responder estas preguntas, no puedes generar el prototipo. Marca como `BLOQUEADO — información insuficiente`.

---

## Paso 3 — Crea estos archivos

```
prototype/index.html                              ← hub end-to-end (crear o actualizar)
specs/<feature>/prototype-html5/index.html        ← experiencia de la feature
specs/<feature>/prototype-html5/flujo.md          ← pantallas, transiciones, estados
specs/<feature>/prototype-html5/decisiones-ux.md  ← del paso 2
specs/<feature>/prototype.md                      ← actualizar con ruta y cobertura
specs/<feature>/prototype-validation.md           ← crear como PENDIENTE
```

---

## Paso 4 — Reglas absolutas (no negociables)

### Lo que NUNCA debe aparecer como texto visible en pantalla

```
RF-          gate-         Contrato mock      Formulario-spec
Actividad de ejemplo       Recorrido simulado  Permiso activo
Ruta interna               Componente:         Spec técnica
Angular futuro:            Login OIDC simulado  Proceso asincrono mock
Resumen (como tab o sección de navegación principal)
```

Si necesitas poner trazabilidad técnica, ponla en `decisiones-ux.md` o como comentario JS `//`, nunca en el HTML visible.

### Separacion entre validacion y UI visible

El hub y los documentos pueden decir `Cobertura`, `Estado`, RF, gates o checklist. El prototipo por spec no. No agregues tabs ni botones visibles como `Simular loading`, `Simular empty`, `Simular error`, `Simular success`, `Acceso denegado`, `Estados UI` o `Cobertura` para cumplir validadores.

Cada estado debe nacer de una accion de producto:
- loading: actualizar datos, abrir catalogo, cargar reporte, preparar player;
- empty: aplicar filtro sin resultados o buscar contenido inexistente;
- error: reintentar una carga, publicacion, reproduccion o guardado;
- success: guardar, aprobar, reproducir, crear o confirmar;
- permission denied: intentar una accion restringida por rol, perfil, edad o PIN.

### Lo que SIEMPRE debe estar presente

| Elemento | Señal mínima |
|---|---|
| Datos mock del dominio | Nombres, fechas, estados propios del producto, no "Lorem ipsum" |
| Link al hub | `← Hub del producto` visible con enlace a `prototype/index.html` |
| Tarea navegable | Click que lleva de pantalla A a pantalla B a pantalla C |
| Estado loading | Spinner o indicador visible |
| Estado empty | Mensaje cuando no hay resultados |
| Estado error | Mensaje con opción de recuperación |
| Estado success | Confirmación cuando la acción se completa |
| Feedback UX | Toast, modal o mensaje inline para acciones importantes |
| Datos mock del dominio | Nombres, fechas, estados propios del producto, no "Lorem ipsum" |

### Patrón visual por dominio

| Si el dominio es... | El prototipo debe parecerse a... |
|---|---|
| Streaming / contenido | Topbar de marca → selector de perfil → hero → catálogo con posters → detalle modal → player |
| Player / reproductor | Video 16:9 → play/pause → seek bar → volumen → calidad/subtítulos → episodios → autoplay |
| Control parental / kids | Shell diferenciada → iconos grandes → restricciones visibles → solicitudes → salida con PIN |
| Backoffice editorial | Cola de trabajo → filtros → ficha → revisión → aprobar/rechazar → historial |
| SaaS operativo | Topbar → filtros → tabla → detalle → acciones → confirmación → auditoría |
| E-commerce | Catálogo visual → ficha producto → carrito → checkout → confirmación |
| Educación | Lección navegable → progreso → evaluación → resultado |

**Regla:** si el dominio tiene un patrón reconocido y usas sidenav+tabla en su lugar, el gate queda BLOQUEADO.

---

## Paso 5 — Checklist de salida (autoevalúa antes de decir "listo")

Marca cada punto. Si alguno es NO, no reportes el prototipo como completado.

- [ ] El primer viewport comunica qué producto es y cuál es la acción principal
- [ ] Hay una tarea principal navegable de inicio a fin
- [ ] El patrón visual corresponde al dominio (no es sidenav+tabla genérico para dominio de consumo)
- [ ] No aparece ningún término prohibido como texto visible en pantalla
- [ ] Hay link discreto de vuelta al hub (no banner)
- [ ] Hay estado loading (o similar)
- [ ] Hay estado empty (o similar)
- [ ] Hay estado error con opción de recuperación
- [ ] Hay estado success o confirmación
- [ ] Hay feedback UX (toast o modal)
- [ ] Los datos mock son del dominio (no genéricos)
- [ ] `flujo.md` y `decisiones-ux.md` están creados
- [ ] `prototype.md` registra ruta y cobertura
- [ ] `prototype-validation.md` existe como PENDIENTE
- [ ] `prototype/index.html` enlaza a esta spec
- [ ] Esta spec enlaza de vuelta a `prototype/index.html`
- [ ] El prototipo abre sin build, backend ni dependencias externas

---

## Paso 5.1 — Ejecuta el validador y reporta el bloque de auto-rating (OBLIGATORIO)

Antes de declarar "listo" debes ejecutar:

```sh
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/<feature> --strict
```

Y reportar **textualmente** este bloque al usuario al final de tu respuesta. Sin este bloque, `/prototype` no se considera cerrado:

```
═══ AUTO-RATING PROTOTIPO HTML5 ═══
Feature              : <feature>
Golden de referencia : ejemplos/fase-2-ux-ui/prototype-html5-golden/<x>/index.html
Dominio declarado    : <dominio>
Patrón elegido       : <patrón>

Métricas:
  Líneas HTML        : <n>      (≥ 250 = nivel 2, ≥ 500 = nivel 3)
  Tokens CSS :root   : <n>      (≥ 6   = nivel 2, ≥ 12  = nivel 3)
  Media queries      : <n>      (≥ 1   = nivel 2, ≥ 2   = nivel 3)
  Vistas distintas   : <n>      (≥ 4   = nivel 2, ≥ 6   = nivel 3)
  Mock records       : <n>      (≥ 6   = nivel 2, ≥ 12  = nivel 3)
  Botones            : <n>      (≥ 5   = nivel 2, ≥ 10  = nivel 3)

NIVEL AUTOEVALUADO   : <0|1|2|3>
Criterios B incumplidos : <lista o "ninguno">
Validador (exit code)   : <0|1|2>
gate-html5-product-quality : <Aprobado|Aprobado con observaciones|Bloqueado>
gate-prototype-ready       : <Listo para validación|Bloqueado — razón>
```

Reglas:
- Si el validador devuelve exit 1 → reportar `Bloqueado` y NO declarar listo. Regenerar.
- Si el nivel autoevaluado es 0 o 1 → `Bloqueado`, regenerar usando el golden como piso.
- Si el nivel es 2 → `Aprobado con observaciones`, anotar las observaciones del validador.
- Si el nivel es 3 sin observaciones → `Aprobado`.

No mientas en este bloque. Las métricas son verificables por el validador. Si reportas un nivel mayor al que arroja el script, el reviewer lo va a contrastar y vas a perder credibilidad para todo el feature.

---

## Paso 6 — Si no puedes cumplir nivel 2 de la rúbrica

Reporta:

```
PROTOTIPO BLOQUEADO
Razón: <criterio específico que no se puede cumplir>
Información faltante: <qué se necesita para continuar>
Gate: gate-prototype-ready NO puede marcarse como Listo
```

No generes un prototipo pobre y lo declares como aprobado. Es mejor bloquearlo con causa que entregar una maqueta que requiere rework.

---

## Lo que este prompt NO autoriza

- Implementar Angular, React ni cualquier framework productivo.
- Conectar APIs reales.
- Marcar `gate-spdd-approved` sin validación humana.
- Crear archivos fuera de las rutas declaradas en el Paso 3.
- Cerrar `gate-prototype-ready` sin pasar el checklist del Paso 5.

---

## No lo uses cuando

- El SPDD aun no esta aprobado: este prompt asume que el SPDD validado existe; sin el, los campos/permisos/estados del prototipo serian invencion del agente.
- El proyecto eligio Penpot como herramienta principal y este HTML5 solo seria duplicacion: usa el flujo Penpot.
- La feature es 100% backend o solo API (sin pantallas): no aplica.
- Estas haciendo un mock de 5 minutos para una demo informal: el ejecutable exige nivel 2-3 con auto-rating y validador strict; para mocks rapidos hay templates mas livianos.

## Verificacion minima

- [ ] Paso 1 cumplido: `specs/<feature>/spdd-frontend.md` existe y esta aprobado.
- [ ] Paso 2 cumplido: golden de referencia leido y citado en `prototype-validation.md`.
- [ ] Paso 3 cumplido: archivos generados solo en las rutas declaradas (`specs/<feature>/prototype/index.html` + assets).
- [ ] Paso 4 cumplido: el prototipo abre sin errores en consola.
- [ ] Paso 5 cumplido: `check-html5-prototype-quality.mjs --spec specs/<feature> --strict` retorna exit 0 con nivel >= 2.
- [ ] Paso 5.1: auto-rating escrito en `prototype-validation.md` con las 3 evidencias requeridas.
- [ ] Paso 6 cumplido: `gate-html5-product-quality` actualizado en `traceability.md` con el nivel obtenido.

---

## Referencias
- `docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`
- `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `ai/quality-gates/gate-html5-product-quality.md`
- `ai/quality-gates/gate-prototype-ready.md`
- `ci/scripts/check-html5-prototype-quality.mjs`
