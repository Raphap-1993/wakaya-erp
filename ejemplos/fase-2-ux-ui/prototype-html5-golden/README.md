# Golden Examples — Prototipos HTML5 Nivel 3

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a ejemplos](../README.md)

Esta carpeta contiene prototipos HTML5 de nivel 3 (producto-real) por dominio de negocio.
Son la referencia de aspiracion que el agente debe leer **antes** de generar cualquier prototipo HTML5.

---

## Para el agente: como usar estos ejemplos

1. **Lee el golden example del dominio mas cercano al tuyo** antes de escribir una sola linea de HTML.
2. El objetivo no es copiar; es entender el nivel de calidad esperado y el patron visual por dominio.
3. Compara tu borrador contra el golden example antes de reportar "listo".
4. Si tu prototipo parece mas pobre que el golden example, mejoralo antes de avanzar.

**El golden example es el piso de calidad esperado para features de un producto enterprise.**

---

## Nivel de calidad exigido

| Nivel | Descripcion | Gate |
|---|---|---|
| 0 | Solo estructura documental | Rechazado |
| 1 | Wireframe basico sin flujo | Insuficiente |
| **2** | **Flujo navegable completo con estados** | **Minimo aceptable** |
| **3** | **Producto real navegable, marca propia, journeys completos** | **Recomendado enterprise** |

Los golden examples en esta carpeta son nivel 3. El minimo para pasar `gate-prototype-ready` es nivel 2.

Ver rubrica completa: `../../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`

---

## Ejemplos disponibles

### [streaming-catalogo-player/](streaming-catalogo-player/)
- **Dominio**: Streaming / contenido / entretenimiento familiar
- **Patron visual**: Topbar de marca, selector de perfiles, hero, catalogo con posters, detalle modal, player completo
- **Nivel**: 3 — producto-real
- **Actores**: Perfil adulto, perfil infantil, perfil teen
- **Tarea principal**: Buscar contenido → abrir detalle → reproducir
- **Lo que demuestra**: Control parental, kids mode con PIN, filtros por tema/edad, favoritos, progreso de reproduccion, bloqueo por edad, estados loading/empty/error/success, feedback con toast

### [saas-operativo-bandeja/](saas-operativo-bandeja/)
- **Dominio**: SaaS operativo / backoffice / gestion de trabajo
- **Patron visual**: Topbar + sidebar colapsable, filtros, tabla con acciones, panel de detalle lateral, historial de auditoria
- **Nivel**: 3 — producto-real
- **Actores**: Operador, supervisor, auditor (solo lectura)
- **Tarea principal**: Buscar tarea → revisar detalle → cambiar estado → registrar comentario
- **Lo que demuestra**: Diferencia de permisos por rol, estados del flujo de trabajo, filtros activos, paginacion, acciones en lote, historial de cambios, feedback con toast, empty state, error recuperable

### [dashboard-analytics-kpi/](dashboard-analytics-kpi/)
- **Dominio**: Dashboard / analytics / inteligencia operativa (KPI-focused)
- **Patron visual**: Topbar minimal con secciones, filtros temporales (today/7d/30d/90d/QTD/YTD), KPI cards con sparklines clicables, gráfico de líneas comparativo período anterior, donut de distribución por segmento, tabla drill-down con barras de progreso, panel de detalle lateral con narrativa
- **Nivel**: 3 — producto-real
- **Actores**: Analista de operaciones, Director comercial, Visor externo (banner ámbar de permisos limitados)
- **Tarea principal**: Elegir KPI → ajustar rango temporal → filtrar por segmento/región → drill-down a cuenta → narrativa contextual
- **Lo que demuestra**: KPI con delta y comparación, sparklines SVG inline, gráfico de líneas con período anterior dasheado, donut con leyenda, switch de comparación, drill-down clicable desde tabla, diferencias por rol (export deshabilitado para Visor externo, alertas restringidas), estados loading/empty/error, toast de feedback

### [dashboard-analytics/](dashboard-analytics/) — funnel/conversion focused
- **Dominio**: Marketing analytics / conversión / atribución
- **Patron visual**: Topbar con selector de rango (today/7d/30d/QTD/YTD/custom) y switch comparar, sidebar agrupado (Marketing / Conversión / Ingresos / Sistema), 5 KPIs cliclables, funnel de conversión con 5 pasos y drop-rate, lista de canales con bars, gráfico de tendencia con período anterior dasheado, tabla de top campañas con badges de canal y delta
- **Nivel**: 3 — producto-real
- **Actores**: Analista marketing, Director comercial, Visor externo
- **Tarea principal**: Elegir rango → filtrar por canal/segmento → identificar drop en funnel → drill-down a campaña/canal
- **Lo que demuestra**: Funnel visual con drop-rate visible por paso, channels con barras de % y conteo, drill-down a campañas, comparativa período anterior dasheado, filtros de canal y estado, diferencias por rol

### [ecommerce-checkout/](ecommerce-checkout/)
- **Dominio**: E-commerce / carrito y checkout
- **Patron visual**: Topbar de marca con búsqueda, navegación de tienda, step tracker de 4 pasos (Carrito → Envío → Pago → Confirmar), cart-item con thumbnail, qty stepper, stock badges, sidebar con order summary sticky, panels expandibles de shipping y payment, formularios con validación inline, modal de confirmación
- **Nivel**: 3 — producto-real
- **Actores**: Cliente premium, Cliente recurrente, Visor externo sin sesión
- **Tarea principal**: Revisar carrito → completar envío → seleccionar pago → confirmar compra
- **Lo que demuestra**: Step tracker visual con estados active/done, cart con qty + remove + stock indicator, validación inline de dirección, tres métodos de envío con precios, tabs de método de pago (tarjeta/wallet/efectivo/transferencia), cupón aplicado, totales con descuento y IVA, diferencias por rol (visor externo no puede confirmar), estados loading/empty/error

### [educacion-leccion/](educacion-leccion/)
- **Dominio**: E-learning / curso / lección navegable con quiz
- **Patron visual**: Topbar con progreso del curso (barra visual), sidebar con módulos colapsables y lecciones (completadas/activa/bloqueadas), video player 16:9 con controles (play/pause/seek/velocidad/CC), contenido de lección con tipografía rica y bloques de código, materiales descargables, quiz con 3 preguntas y feedback inline, navegación prev/next, modal de achievement
- **Nivel**: 3 — producto-real
- **Actores**: Estudiante regular, Instructor, Visor sin sesión
- **Tarea principal**: Reproducir lección → estudiar contenido → resolver quiz → desbloquear siguiente lección
- **Lo que demuestra**: Progreso del curso visible, módulos colapsables con conteo de lecciones, estados de lección (done/active/locked), video player con controles realistas, contenido educativo con código, materiales descargables, quiz interactivo con corrección y feedback por pregunta, achievement modal al aprobar, diferencias por rol

### [mobile-first-app/](mobile-first-app/)
- **Dominio**: App móvil / banca / fintech (vertical phone-frame)
- **Patron visual**: Phone-frame centrado en desktop (440px) y full-screen en móvil, status bar mock, hero con gradiente y saldo (toggle ocultar/mostrar), grid 4 quick-actions, cards horizontales scroll-snap (débito/crédito/ahorro), lista de transacciones, bottom nav con 5 items + FAB central, bottom sheet modal, pull-to-refresh, filter chips horizontales
- **Nivel**: 3 — producto-real
- **Actores**: Cliente premium, Cliente plus, Modo invitado/preview
- **Tarea principal**: Ver saldo → quick action (transferir/pagar/QR) → revisar movimientos → detalle de transacción
- **Lo que demuestra**: Layout phone-frame responsive (mobile-first), bottom navigation con FAB elevado, cards horizontales con scroll-snap, hero con saldo toggleable, lista de transacciones con íconos y categorías, bottom sheet con sheet-handle nativa, filter chips, pull-to-refresh hint, 4 panes navegables (home/cards/moves/profile)

### [formulario-complejo/](formulario-complejo/)
- **Dominio**: Wizard multi-step / cotización / onboarding largo
- **Patron visual**: Topbar con save-state + ayuda, step rail de 5 pasos con estados (active/done/pending), panels con form-rows en 2-3 columnas, campos con label/req/help/error, option-cards seleccionables, coverage cards con badge "Recomendado", upload zones drag-and-drop con preview de archivos, conditional fields (visible/hidden según selección), sidebar con cotización viva sticky, modal de éxito al emitir
- **Nivel**: 3 — producto-real
- **Actores**: Cliente nueva, Asesor interno, Visor sin sesión
- **Tarea principal**: Vehículo → Titular → Cobertura → Documentos → Revisar y emitir
- **Lo que demuestra**: Step rail clicable navegable bidireccional, formato automático de placa con validación regex, campos condicionales (uso comercial muestra carga máxima; siniestros muestra detalles), planes en cards con features list y badge "Recomendado", cotización viva que actualiza al cambiar deducible/pago/extras, upload con preview de archivo subido, página de revisión con links "Editar" a cada paso, validación de términos antes de emitir, modal de éxito con número de póliza

---

### [salud-hipaa-clinico/](salud-hipaa-clinico/) — v12.51
- **Dominio**: Sistema de informacion clinica con cumplimiento HIPAA (PHI access controlado)
- **Patron visual**: Banner PHI fijo arriba con dot animado, topbar medico con perfil + rol + acceso, sidebar workflow (Pacientes/Citas/Ordenes/Resultados + Clinico + Compliance), KPI cards (Activos, Citas hoy, Casos criticos en rojo, Accesos PHI), tabla pacientes con priority badge + status (Critico/Monitoreo/Estable/Alta), detail panel con signos vitales en grid + audit trail visible + medicacion activa
- **Nivel**: 3 — producto-real (672 lineas, 26 tokens CSS, 2 media queries)
- **Actores**: Dra. cardiologa (clinico), Tecnico lab, Enfermera, Dr. interconsulta
- **Tarea principal**: Buscar paciente -> abrir expediente -> revisar signos vitales y medicacion -> agregar nota o nueva orden
- **Lo que demuestra**: cumplimiento HIPAA inline (audit trail por cada acceso), badges criticos con animacion pulse, tag PHI por columna, modal de "crear con auditoria", vitales con color-coding (warning/danger)

### [erp-multimodulo-financiero/](erp-multimodulo-financiero/) — v12.51
- **Dominio**: ERP empresarial multi-modulo enfocado en modulo Financiero (libro diario contable)
- **Patron visual**: Topbar oscuro empresarial + selector organizacion (RUC, FY) + selector periodo + modulebar fija de 8 modulos (Dashboard/Financiero/Inventarios/Ventas/Compras/RRHH/Manufactura/Admin), sidebar de Contabilidad/Cuentas/Reportes con badges, KPIs con sparklines y borde lateral color-coded (Debe/Haber/Pendientes/Cierre), tabs internos por estado de asiento, tabla de asientos con # asiento + fecha + glosa + cuenta + CC + debe/haber/balance + estado, detail con cabecera + lineas en grid (Cuenta/Desc/Debe/Haber) con total resaltado + historial de cambios
- **Nivel**: 3 — producto-real (718 lineas, 34 tokens CSS, 3 media queries)
- **Actores**: CFO (admin), Maria S. (revisora), Ana R. (registro), Luis V. (postear)
- **Tarea principal**: Filtrar por periodo+CC -> revisar asientos pendientes -> abrir detalle -> aprobar o postear
- **Lo que demuestra**: navegacion multi-modulo, KPIs con sparkline + delta vs periodo anterior, partida doble visible en detail, workflow de aprobacion (Borrador -> Pendiente -> Posteado/Reversado), historial de cambios por asiento

### [logistica-tracking-flota/](logistica-tracking-flota/) — v12.51
- **Dominio**: Plataforma de control de flota y tracking de envios en tiempo real
- **Patron visual**: Topbar con live-pill "LIVE 84 vehiculos", split-view (mapa | lista derecha), mapa mock con SVG carreteras + pines de vehiculos posicionados con estado (in-route/delayed/delivered) + warehouses, controles de zoom, legend, stats flotantes sobre mapa (SLA cumplido, tiempo promedio, capacidad, incidentes), right-panel con tabs (En ruta/Retraso/Pendientes) y cards de envio con # + ETA + origen->destino + progress bar color-coded, detail con estado actual + ETA original vs actualizado + linea de tiempo de eventos con dots done/current/pending
- **Nivel**: 3 — producto-real (674 lineas, 34 tokens CSS, 3 media queries)
- **Actores**: Dispatcher Lima Sur (operacional), conductor (visible en cards), tecnico mantenimiento (sidebar)
- **Tarea principal**: Ver flota en mapa -> click pin de vehiculo retrasado -> abrir detalle envio -> contactar conductor o reportar incidente
- **Lo que demuestra**: visualizacion geografica con SVG inline (sin Google Maps), animacion pulse en retrasos, progress bars color-coded por estado, linea de tiempo de eventos GPS con check-in en puntos clave, badges de incidente, layout split que aprovecha pantalla ancha (mapa + lista simultaneos)

### [educacion-colegio-sis/](educacion-colegio-sis/) — v12.52
- **Dominio**: SIS (Student Information System) para colegios — modulos admision, matricula, notas, plan estudios, malla curricular, docentes, familias, apoderados, planilla
- **Patron visual**: banner periodo academico (año + bimestre) + role switch (Admin/Docente/Apoderado) en topbar, tabs de modulos del SIS, sidebar por nivel (Inicial/Primaria/Secundaria) + por grado, tabla estudiantes con apoderado titular + estado matricula + pension + ultima nota, detail panel con gradebook por bimestre + apoderados cards + plan estudios
- **Nivel**: 3 — producto-real (781 lineas, 34 tokens CSS, 3 media queries)
- **Actores**: Subdirector (admin), Docente, Apoderado (3 vistas distintas via role switch)
- **Tarea principal**: Buscar estudiante por filtros nivel/grado → abrir detalle → revisar notas o contactar apoderado → matricular o cerrar bimestre
- **Lo que demuestra**: multi-role UI con CSS data-attribute hooks (apoderado oculta acciones admin), gradebook con AD/A/B/C escala competencias, family cards con titular destacado + emergencias, badges admision (Pdte/Reviewing/Accepted/Waitlist/Rejected/Enrolled), pension al dia/atraso color-coded

### [educacion-superior-lms/](educacion-superior-lms/) — v12.52
- **Dominio**: LMS (Learning Management System) universitario — gestion de cursos online, gradebook con pesos por evaluacion, deteccion de estudiantes en riesgo de dropout
- **Patron visual**: topbar academico con term pill (Semestre + Semana N de M), sidebar con cards de cursos del docente (codigo+nombre+seccion+aula+alumnos), course-hero con gradient brand y stats (avance silabo/promedio/aprobacion), tabs (Gradebook/Modulos/Evaluaciones/Asistencia/Recursos/Foro), gradebook con pesos por evaluacion (PC1 10% + PC2 10% + EP 20% + Lab 25% + Proy 15% + EF 20%) + score color-coded high/mid/low/pending
- **Nivel**: 3 — producto-real (568 lineas, 31 tokens CSS, 3 media queries)
- **Actores**: Dr. Catedratico (vista principal), Estudiante (en detail panel)
- **Tarea principal**: Elegir curso → revisar gradebook → identificar estudiantes en riesgo → crear nueva evaluacion o calificar
- **Lo que demuestra**: pesos por evaluacion explicitos en column header, riesgo de dropout calculado (badge dropout-risk con animacion), promedio dinamico, comparativa con cursos del mismo estudiante en detail, beca/financiamiento

### [retail-pos-terminal/](retail-pos-terminal/) — v12.52
- **Dominio**: Terminal POS de retail (punto de venta presencial)
- **Patron visual**: topbar negro con info tienda+caja+turno+cajero+ticket actual, split-view 2 columnas (catalogo izq | cart oscuro derecha), barcode input grande con focus 2px border brand + boton search, chips de categorias horizontal scrollable, product grid con imagenes mock + SKU + precio + stock color-coded (ok/low/out) + badges promo 2x1, cart oscuro con qty controls + items con precio, summary con subtotal/desc/IGV/total destacado, payment options grid (Efectivo/Tarjeta/Yape/Mixto), boton COBRAR grande verde, modal ticket exitoso con receipt preview en font-mono
- **Nivel**: 3 — producto-real (441 lineas, 30 tokens CSS, 3 media queries)
- **Actores**: Cajero (vista unica), supervisor (modal cierre caja)
- **Tarea principal**: Escanear/buscar producto → agregar al cart → seleccionar payment → cobrar → imprimir ticket → nueva venta
- **Lo que demuestra**: workflow POS real (no admin), keyboard shortcuts F1/F5, focus en barcode siempre activo, productos sin stock deshabilitados, descuentos visibles en cart (2x1 promo), receipt preview formato ticket termico

### [iot-industrial-sensores/](iot-industrial-sensores/) — v12.52
- **Dominio**: SCADA / IoT industrial — monitoreo de sensores en planta de manufactura
- **Patron visual**: tema oscuro empresarial (--bg #020617), topbar con LIVE pill + plant selector, sidebar (Monitoreo/Assets/Operacion), KPIs OEE Linea A+B con sparklines + alarmas criticas con borde rojo animado pulse, dashboard split (assets criticos con valor+umbral color-coded | alarmas activas + chart trend SVG con threshold line al 85°C max), modal alarma con metadata + acknowledgement + crear OT mantenimiento
- **Nivel**: 3 — producto-real (622 lineas, 35 tokens CSS, 3 media queries)
- **Actores**: Ingeniero de operaciones (turno T2), tecnico de mantenimiento (recibe OT)
- **Tarea principal**: Ver dashboard → identificar alarma critica → click alarma → ACK + accion + crear OT
- **Lo que demuestra**: tema oscuro para sala de control 24/7, animacion pulse en valores criticos, SVG chart inline con threshold line dashed roja, multi-status assets (ok/warn/crit/off), alarm severity icons con color, drill-down asset → alarma

### [insurtech-polizas-claims/](insurtech-polizas-claims/) — v12.52
- **Dominio**: Insurtech — gestion de polizas, suscripcion y claims (auto/hogar/salud/vida)
- **Patron visual**: topbar suscriptor + sidebar (Polizas/Claims/Suscripciones/Renovaciones/Productos), KPIs negocio (vigentes/renovaciones <30d/claims abiertos/loss ratio) con borde lateral color-coded por severidad, tabs estado, tabla polizas con # poliza monospace + cliente + product pill diferenciado (auto/home/health/life) + cobertura + prima + vigencia + estado (Vigente/Por renovar/Claim abierto/En suscripcion), detail con coberturas grid + claim activo con timeline (FNOL/asignacion/docs/auditoria medica/pago) + historial cliente, modal suscripcion con wizard 4 pasos
- **Nivel**: 3 — producto-real (606 lineas, 31 tokens CSS, 3 media queries)
- **Actores**: Sandra Vargas (suscriptora auto), Dr. Aliaga (auditor medico en timeline), cliente (en historial)
- **Tarea principal**: Filtrar polizas con claim abierto → click → revisar timeline + coberturas + historial → aprobar pago o crear endoso
- **Lo que demuestra**: 4 productos con visual diferenciado, claim timeline con dots done/current con SLA visible, loss ratio cliente individual, wizard de suscripcion en 4 pasos con step pills, integracion clinica San Pablo (red preferente) visible

---

## Cross-spec navigation via URL params (v12.52)

Los goldens v12.52+ soportan navegacion entre prototipos via URL params canonicos.
El helper `shared-prototype-helpers.js` se inyecta automaticamente por
`npm run scaffold:prototype` y tambien viene inline en todos los goldens nuevos.

### Parametros canonicos

| Param | Tipo | Ejemplo | Significado |
|---|---|---|---|
| `from` | string | `hub`, `spec-001` | Origen de navegacion |
| `role` | string | `operador`, `apoderado`, `docente` | Rol activo del usuario simulado |
| `id` | string | `EXP-2026-001`, `EST-2026-0042` | Recurso especifico (se highlightea fila con `[data-resource-id="X"]`) |
| `demo-mode` | bool | `true` | Vino del hub (muestra link "← Hub") |
| `spec` | string | `001` | Spec origen del cross-link (genera banner "← Volver a spec NNN") |

### Como abrir otro prototipo desde tu prototipo

```javascript
// Cualquier prototipo con shared-prototype-helpers tiene esta funcion global.
openPrototypeBySpec('002', { id: 'EXP-2026-001', role: 'supervisor' });
// Abre specs/002-*/prototype-html5/index.html?from=spec-001&role=supervisor&id=EXP-2026-001
```

### Como el hub pasa contexto

`prototype/index.html` (autogenerado v12.52+) ahora pasa `?from=hub&demo-mode=true&role=<actor>` a cada prototipo que abre. Esto permite:
- El prototipo sabe que viene del hub → muestra link "← Hub" discreto.
- Sincroniza switches de rol con el actor del journey.
- Pre-selecciona vista por rol (CSS `body[data-active-role="apoderado"]` oculta botones admin).

### Validador

```bash
npm run check:prototype-cross-links
```

Valida que todos los hrefs `../specs/NNN-slug/prototype-html5/...` apunten a features
existentes, que `openPrototypeBySpec('NNN')` no referencie specs inexistentes, y
detecta loops circulares evidentes (a → b → a).

### Atributos HTML que el helper reconoce

| Atributo | Donde poner | Efecto |
|---|---|---|
| `data-hub-link` | en el `<a>` que vuelve al hub | Se muestra si `demoMode=true` |
| `data-role-switch data-role="X"` | en `<button>`/`<select>` de role switch | Se activa el que coincida con `?role=X` |
| `data-resource-id="X"` | en `<tr>`/`<div>` de una fila | Se highlightea + scroll si `?id=X` coincide |
| `data-cross-spec-return` | en banner generado | Marcador del link de retorno cross-spec |

## Patron visual por dominio

| Dominio | Golden de referencia | Patron | Red flag si no se aplica |
|---|---|---|---|
| Streaming / entretenimiento | [streaming-catalogo-player](streaming-catalogo-player/) | Topbar, selector perfil, hero, catalogo visual, player | Sidenav + tabla (B9) |
| SaaS operativo / backoffice | [saas-operativo-bandeja](saas-operativo-bandeja/) | Topbar, sidebar, filtros, tabla, detalle, historial | Hero visual para herramienta de trabajo |
| Ecommerce / carrito-checkout | [ecommerce-checkout](ecommerce-checkout/) | Topbar busqueda, step tracker, cart-items, order summary sticky | Tabla sin visual de producto / sin step tracker |
| Educacion / leccion + quiz | [educacion-leccion](educacion-leccion/) | Topbar con progreso, sidebar de modulos, player, quiz | Sidenav + tabla / leccion sin video ni quiz |
| Dashboard KPI / monitoreo | [dashboard-analytics-kpi](dashboard-analytics-kpi/) | KPI cards con sparklines, charts, drill-down, filtros temporales | Solo tabla sin visualizacion |
| Dashboard funnel / marketing | [dashboard-analytics](dashboard-analytics/) | Funnel con drop-rate, canales con bars, atribucion, comparativa | KPI-only sin funnel / sin canales |
| Mobile-first / banca movil | [mobile-first-app](mobile-first-app/) | Phone-frame, bottom nav + FAB, cards scroll-snap, bottom sheet | Layout desktop forzado / sin bottom nav |
| Wizard multi-step / cotizacion | [formulario-complejo](formulario-complejo/) | Step rail, panels por paso, conditional fields, cotizacion sticky | Form de una sola pagina con 30 campos / sin step indicator |
| Salud / HIPAA / EHR clinico (v12.51) | [salud-hipaa-clinico](salud-hipaa-clinico/) | Banner PHI permanente, topbar medico, sidebar workflow, tabla pacientes con badges criticos, audit trail visible, panel signos vitales | Sin banner PHI / sin audit trail / sin diferenciacion estados criticos |
| ERP / multi-modulo / contable (v12.51) | [erp-multimodulo-financiero](erp-multimodulo-financiero/) | Topbar oscuro + modulebar (Financiero/Inventarios/Ventas/RRHH), KPIs financieros con sparklines, libro diario con cuentas + CC + debe/haber balanceado | Sin modulebar / sin partida doble visible / sin contexto de organizacion+periodo |
| Logistica / tracking / flota (v12.51) | [logistica-tracking-flota](logistica-tracking-flota/) | Mapa con pines de vehiculos, legend, stats sobre mapa, list-panel derecho con envios+progress, detail con timeline | Sin mapa visual / sin posiciones GPS mock / sin diferenciacion estado por color |
| **Educacion colegio / SIS** (v12.52) | [educacion-colegio-sis](educacion-colegio-sis/) | Banner periodo academico + role switch (admin/docente/apoderado), tabs modulos (Admision/Matricula/Notas/Curriculo/Docentes/Familias/Planilla), sidebar por nivel+grado, tabla estudiantes con apoderado titular + estado pension + nota ultima, detail con gradebook + apoderados card + plan estudios | Sin role switch · sin modulos diferenciados · matricula y notas en una sola tabla · sin badges de estado |
| **LMS universitario** (v12.52) | [educacion-superior-lms](educacion-superior-lms/) | Topbar academico + term pill, sidebar con cursos del docente (codigo+nombre+seccion+aula), course-hero con stats avance/promedio/aprobacion, tabs (Gradebook/Modulos/Evaluaciones/Asistencia/Recursos/Foro), gradebook con pesos por evaluacion + score color-coded + riesgo + asistencia | Sin term/semester pill · sin curso-hero · sin pesos por evaluacion · sin riesgo de dropout |
| **Retail POS / terminal** (v12.52) | [retail-pos-terminal](retail-pos-terminal/) | Topbar negro con info tienda/caja/turno/cajero, split-view (catalogo productos | cart derecha), barcode input + categorias chips + product grid con SKU+precio+stock, cart oscuro con qty controls + payment options (efectivo/tarjeta/yape/mixto), boton COBRAR grande verde, modal ticket con receipt preview | Layout no split · sin barcode input · sin payment options · sin keyboard shortcuts F1/F5 |
| **IoT industrial / SCADA** (v12.52) | [iot-industrial-sensores](iot-industrial-sensores/) | Tema oscuro empresarial, topbar con LIVE pill + plant selector, KPIs OEE con sparklines + alarmas criticas animadas pulse, dashboard split (assets criticos con valor+umbral | alarmas+chart trend SVG con threshold line), modal alarma con metadata + acknowledgement + crear OT | Tema claro · sin valores en tiempo real · sin umbrales visibles · sin animacion pulse en criticos |
| **Insurtech / polizas + claims** (v12.52) | [insurtech-polizas-claims](insurtech-polizas-claims/) | Topbar suscriptora + sidebar (Polizas/Claims/Suscripciones/Renovaciones/Productos), KPIs negocio (vigentes/renovaciones/claims abiertos/loss ratio), tabs estado, tabla polizas con product pill + cobertura + prima + vigencia + estado, detail con coberturas grid + claim timeline + historial | Sin loss ratio · sin product pills diferenciados · sin claim timeline · suscripcion sin wizard step pills |

---

## Flujo OBLIGATORIO al generar un prototipo HTML5 (v12.46+)

> Verificado contra 3 instanciaciones reales (opencode, codex, gemini) donde 2/3
> prototipos quedaron esqueleticos o minificados con Tailwind CDN. Este flujo
> elimina ese problema.

### Paso 1 — Elegir golden segun dominio

Usa la tabla "Patron visual por dominio" abajo para encontrar el golden mas
cercano. Si tu dominio no esta listado, elige el mas afin y registralo en
`prototype.md > Patron visual elegido`.

### Paso 2 — Copiar el golden como base

```bash
# Reemplaza <slug> con tu feature.
cp ejemplos/fase-2-ux-ui/prototype-html5-golden/<golden>/index.html \
   specs/<slug>/prototype-html5/index.html
```

### Paso 3 — Adaptar el contenido (no la estructura)

1. `<title>` y `.brand` → nombre de tu feature.
2. Tokens `:root` → adapta `--brand` a tu marca. Manten la escala neutral, los 4 estados
   semaforo, los 3 niveles de shadow.
3. Mock data → reemplaza nombres/IDs/registros con datos de tu dominio (ej. en streaming:
   peliculas en vez de expedientes; en educacion: cursos en vez de tareas).
4. Roles visibles → reemplaza Operador/Supervisor por los roles de tu dominio.
5. **NO elimines** sistemas que ya estan en el golden: estados loading/empty/error,
   responsive, microinteracciones, focus rings, hover reveal, toast/modal.

### Paso 4 — Auto-auditoria visual antes de cerrar

```bash
# Cuenta tokens CSS (debe ser >=12 para nivel 3, >=6 para nivel 2).
grep -oE '^\s*--[a-z][a-z0-9-]*:' specs/<slug>/prototype-html5/index.html | sort -u | wc -l

# Cuenta media queries (debe ser >=2 para nivel 3, >=1 para nivel 2).
grep -c '@media' specs/<slug>/prototype-html5/index.html

# Cuenta clases CSS (debe ser >=40 para indicar modularidad).
grep -oE 'class="[^"]*"' specs/<slug>/prototype-html5/index.html | sort -u | wc -l

# Tamano del archivo (>=500 lineas para nivel 3, >=250 para nivel 2).
wc -l specs/<slug>/prototype-html5/index.html

# Validador automatico nivel/bloqueantes.
node ci/scripts/check-html5-prototype-quality.mjs --feature specs/<slug>
```

### Metricas esperadas por nivel

| Metrica | Nivel 2 (minimo) | Nivel 3 (recomendado) | Goldens |
|---|---:|---:|---:|
| Lineas totales | >=250 | >=500 | 639-1309 |
| Tokens CSS (`--xxx:`) | >=6 | >=12 | 14-31 |
| Media queries | >=1 | >=2 | 2-4 |
| Classes CSS unicas | >=20 | >=40 | 50-80+ |
| Estados UI cubiertos | 3 (loading/empty/error) | 5 (+success+permission-denied) | 5+ |
| Microinteracciones | 1 (hover) | 4+ (hover+focus+reveal+scale) | 5+ |

### Antipatrones (rechazan automatico el prototipo)

- ❌ `<script src="https://cdn.tailwindcss.com">` o cualquier CDN de framework (sin frameworks externos).
- ❌ HTML minificado en una sola linea sin formato.
- ❌ Todo el CSS inline con `style="..."` sin clases nombradas.
- ❌ Solo 1 estado UI presente (ej. solo "success", sin loading/empty/error).
- ❌ Mismo prototipo copiado a varias features con solo nombre cambiado.
- ❌ Tipografia default del browser sin escala (h1 solo)
- ❌ Sin `--brand` propio o paleta plana sin tokens.

---

## Que NO hacer (errores comunes que estos ejemplos evitan)

- Usar sidenav + tabla para streaming, ecommerce o educacion (bloqueante B9)
- Mostrar "RF-001", "gate-prototype-ready" o etiquetas metodológicas como texto visible (bloqueante B3)
- Mostrar estados (loading, empty, error) como tabs del sidebar en vez de comportamiento natural
- Comprimir todo el producto en un solo HTML sin verticales diferenciadas
- Copiar la misma shell para todos los dominios cambiando solo colores
- **Poner banners "Prototipo de validación / datos de demostración"** dentro de cada prototipo (v12.20): el aviso de simulación vive solo en el hub. Cada prototipo debe verse como producto real con un link discreto `← Hub` en el topbar.

---

## Como crear un nuevo golden example

1. Elegir dominio que aun no tiene golden example.
2. Crear carpeta `<dominio-patron>/`.
3. Crear `index.html` autocontenido (HTML + CSS vanilla + JS vanilla en un solo archivo).
4. El archivo debe: demostrar tarea principal de inicio a fin, mostrar estados naturales, diferencias por rol, datos mock del dominio, feedback UX, navegacion bidireccional con hub.
5. Evaluar con `gate-html5-product-quality.md`: debe pasar todos los criterios B sin bloqueantes.
6. Agregar entrada en este README.

---

## Referencias

- `../../../docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`
- `../../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `../../../ai/quality-gates/gate-html5-product-quality.md`
- `../../../ai/prompts/generar-prototipo-html5-ejecutable.md`
- `../../../ai/commands/prototype-command.md`
- `../../../ci/scripts/check-html5-prototype-quality.mjs`
