# Ejemplo: Arranque desde fuente bruta — Plataforma Cristiano Content

[README principal](../../README.md) | [Índice ejemplos](../README.md) | [Prompt fuente](../../ai/prompts/arranque-desde-fuente-bruta.md)

## Qué es este documento

Ejemplo completo y ejecutable del flujo [`arranque-desde-fuente-bruta.md`](../../ai/prompts/arranque-desde-fuente-bruta.md),
usando como caso real el proyecto **Cristiano Content**: una plataforma digital de contenido audiovisual cristiano
(tipo Netflix + app multicontenido) orientada a niños, jóvenes y familias.

Sirve como:
- Guía paso a paso para equipos que arrancan un proyecto desde una idea en bruto.
- Referencia de qué debe producir cada fase (A, B, C) del bootstrap.
- Base para el proveedor IA que continúa el trabajo después del arranque.

---

## 1. Fuente de negocio (idea bruta)

**Archivo**: `C:\template\fuente-peticion-idea-inical\APLICATIVO CRISTIANO MULTICONTENIDO.md`

**Observación clave del autor**: _"al ver esta solicitud parecen el mismo pedido en enfoques diferentes"_

La fuente describe dos proyectos que son en realidad el mismo con distintos énfasis:

| Descripción en la fuente | Lectura correcta |
|---|---|
| Aplicativo Cristiano Multicontenido | Plataforma completa: video, música, Biblia, juegos, gamificación |
| Plataforma de Video Cristiano (tipo Netflix) | Módulo principal de la misma plataforma: catálogo audiovisual |

**Decisión de arranque**: Tratar como un solo proyecto. El módulo de video es el core MVP.
El resto (Biblia, devocionales, juegos, gamificación) son módulos futuros escalables.

---

## 2. Entradas mínimas para el prompt

```
RUTA_AL_ARCHIVO_BRUTO  = C:\template\fuente-peticion-idea-inical\APLICATIVO CRISTIANO MULTICONTENIDO.md
RUTA_DESTINO           = C:\proyectos\cristiano-content
STACK_OBJETIVO         = node-next   (ver justificación en § 4)
RUTA_CONFIG_JSON       = C:\template\fuente-peticion-idea-inical\cristiano-content.config.json
```

---

## 3. Prompt completo para el proveedor IA

Copia este bloque, pégalo al inicio de una sesión nueva con el proveedor IA
(Claude, GPT-4o, Gemini, etc.) y sigue las instrucciones de cada fase.

```md
Actúa como Enterprise AI Framework Agent.

Lee primero en este orden:
- AGENTS.md (del template, no del proyecto destino)
- ai/runbooks/crear-proyecto-real-con-agente.md
- ai/agents/enterprise-ai-framework-agent.md
- template.config.example.json

Fuente de negocio (archivo bruto):
C:\template\fuente-peticion-idea-inical\APLICATIVO CRISTIANO MULTICONTENIDO.md

Ruta destino del proyecto real:
C:\proyectos\cristiano-content

Stack objetivo:
node-next

Ruta donde guardar el config generado:
C:\template\fuente-peticion-idea-inical\cristiano-content.config.json

---

FASE A — Extracción y plan (NO ejecutes nada todavía)

Lee el archivo bruto y extrae:
1. Nombre del proyecto y dominio de negocio.
2. Problema a resolver y objetivo principal.
3. Actores y usuarios del sistema.
4. Requerimientos funcionales visibles (lista preliminar RF-01, RF-02...).
5. Requerimientos no funcionales visibles (seguridad, performance, compliance, disponibilidad).
6. Restricciones técnicas conocidas (stack, integraciones, autenticación, base de datos).
7. Restricciones de negocio (plazos, presupuesto, regulación, privacidad).
8. Supuestos que asumes donde la fuente es ambigua.
9. Preguntas abiertas críticas que deben responderse antes de construir.

Con esa información:
- Genera el contenido completo del archivo config.json basado en template.config.example.json.
- Declara el stack elegido y justifica por qué.
- Declara la ruta destino y confirma que no existe o que está vacía.
- Muestra el plan de archivos que vas a generar en fases 0-8.

Devuelve todo esto y ESPERA mi confirmación antes de continuar.

---

FASE B — Creación y documentación (solo después de mi confirmación)

Una vez confirmado el plan:

1. Guarda el config.json en C:\template\fuente-peticion-idea-inical\cristiano-content.config.json.

2. Ejecuta:
   node scripts/ai-framework-agent.mjs create-project \
     --stack node-next \
     --config C:\template\fuente-peticion-idea-inical\cristiano-content.config.json \
     --dest C:\proyectos\cristiano-content \
     --skip-smoke --no-git

3. Entra a la ruta destino y completa los artefactos iniciales por fase usando
   la información extraída del archivo bruto. Avanza una fase por vez y
   muestra la salida antes de pasar a la siguiente:

   Fase 0 — docs/fase-0-iniciacion/
     - 00.01-vision-proyecto.md
     - 00.02-roadmap.md
     - 00.03-estimacion-tiempo-costo.md
     - 00.04-roles-y-responsabilidades.md

   Fase 1 — docs/fase-1-analisis-requerimientos/
     - 01.00-analisis-requerimientos.md

   Fase 2 — docs/fase-2-ux-ui/
     - 02.09-spec-driven-product-design.md
     - 02.12-checklist-spdd.md (iniciar como pendiente)

   Fase 3 — docs/fase-3-arquitectura/
     - 03.00-arquitectura.md
     - 03.01-decisiones-tecnologia.md
     - 03.03-plan-despliegue.md
     - adr/ADR-001

   Specs — specs/001-catalogo-contenido/
     - product-design.md
     - spec-funcional.md
     - traceability.md

   Fases 4-8 — README con estado inicial y referencia a task packets.

4. Reglas durante la documentación:
   - Usa el prefijo CONTENT_* para permisos de dominio (ej: CONTENT_READ, CONTENT_STREAM).
   - Marca como SUPUESTO todo lo que no está confirmado en la fuente bruta.
   - Marca como PENDIENTE todo lo que requiere validación humana.
   - No inventes decisiones tecnológicas cerradas; usa "propuesta" hasta que haya ADR.

---

FASE C — Validación y entrega (solo después de que completes la documentación)

1. Ejecuta:
   node ci/scripts/check-docs.mjs C:\proyectos\cristiano-content
   node ci/scripts/check-markdown-paths.mjs C:\proyectos\cristiano-content

2. Declara el estado de gates:
   - gate-0-1: pendiente / aprobado / bloqueado (con razón).
   - gate-ux-ready: pendiente hasta validación de product-design.md.
   - gate-spdd-approved: pendiente hasta prototipo validado.

3. Genera el pack de orientación para proveedores IA.

4. Reporta comandos ejecutados, archivos creados, gates, red flags y siguiente paso.
```

---

## 4. Justificación del stack: `node-next`

| Criterio | node-next | quarkus-angular |
|---|---|---|
| SSR / SEO para catálogo público | ✅ Next.js nativo | ⚠ Requiere config extra |
| Streaming de video (manifiestos HLS/DASH) | ✅ Node.js ligero | ⚠ JVM overhead innecesario |
| Tiempo de arranque MVP | ✅ Más rápido | ⚠ Más configuración |
| Escala a microservicios futuros | ✅ Escalable | ✅ Escalable |
| Familia tecnológica del equipo probable | ✅ JS/TS full-stack | ⚠ Java + Angular separado |

**Conclusión**: `node-next` es el stack correcto para una plataforma de contenido streaming
con énfasis en SEO, tiempo al mercado y pila tecnológica unificada.

---

## 5. Config.json esperado (`cristiano-content.config.json`)

El proveedor IA debe generar este archivo en Fase A. Úsalo como referencia para validar
que no haya campos de ejemplo sin reemplazar (red flag: `acme`, `case-management`, `CC-123`).

```json
{
  "$schema": "./scripts/schema/template.config.schema.json",
  "project": {
    "name": "Cristiano Content",
    "slug": "cristiano-content",
    "apiServiceName": "cristiano-content-api",
    "webComponentName": "cristiano-content-web",
    "apiResourceName": "content",
    "apiResourcePlural": "contents",
    "apiResourcePath": "/api/contents",
    "javaBasePackage": "com.example.cristianocontent",
    "databaseName": "cristiano_content",
    "featureFlagPrefix": "cristiano-content",
    "backstageOwner": "team-cristiano-content",
    "backstageSystem": "cristiano-content",
    "databaseResourceName": "cristiano-content-db",
    "costCenter": "PENDIENTE"
  },
  "github": {
    "organization": "PENDIENTE",
    "repository": "cristiano-content"
  },
  "support": {
    "url": "https://PENDIENTE/cristiano-content"
  },
  "runtime": {
    "containerImage": "ghcr.io/PENDIENTE/cristiano-content-api"
  },
  "terraform": {
    "stateBucket": "PENDIENTE-tf-state",
    "lockTable": "PENDIENTE-tf-lock",
    "devDomain": "dev.cristiano-content.example.com",
    "stagingDomain": "staging.cristiano-content.example.com",
    "prodDomain": "cristiano-content.example.com"
  },
  "catalog": {
    "portalUrl": "https://cristiano-content.example.com",
    "apiUrl": "https://api.cristiano-content.example.com"
  },
  "auth": {
    "oidcIssuer": "PENDIENTE",
    "oidcJwksUrl": "PENDIENTE",
    "oidcAudience": "https://api.cristiano-content.example.com",
    "oidcRolesClaim": "roles"
  },
  "observability": {
    "prometheusUrl": "PENDIENTE",
    "grafanaUrl": "PENDIENTE",
    "tempoUrl": "PENDIENTE",
    "lokiUrl": "PENDIENTE",
    "otelCollectorEndpoint": "PENDIENTE:4317"
  },
  "dr": {
    "tier": "tier-2",
    "rto": "4h",
    "rpo": "1h",
    "primaryRegion": "PENDIENTE",
    "secondaryRegion": "PENDIENTE"
  },
  "secrets": {
    "provider": "PENDIENTE",
    "kvPath": "secret/cristiano-content",
    "externalSecretsRefreshInterval": "1h"
  }
}
```

> **Nota**: Los campos marcados `PENDIENTE` deben completarse con el equipo antes de Fase 3.
> No bloquean el bootstrap, pero sí bloquean el despliegue en Fase 7.

---

## 6. Extracción esperada de Fase A

Esta es la extracción que el proveedor IA debe producir al leer el archivo bruto.
Úsala para validar que el análisis fue correcto antes de confirmar Fase B.

### Actores del sistema

| Actor | Descripción |
|---|---|
| Niño (3-12 años) | Usuario principal. Accede con perfil infantil. No administra. |
| Joven (13-25 años) | Usuario secundario. Accede a contenido diferenciado. |
| Adulto / Padre | Usuario y administrador de perfiles familiares. Control parental. |
| Administrador de contenido | Carga, categoriza y modera el catálogo. |
| Administrador de iglesia | (SUPUESTO) Gestiona contenido para escuela dominical. |

### Requerimientos funcionales preliminares

| ID | Descripción |
|---|---|
| RF-01 | El usuario puede registrarse y crear un perfil familiar con perfiles por edad. |
| RF-02 | El usuario puede reproducir videos del catálogo (películas, series, animaciones). |
| RF-03 | El sistema reproduce contenido con continuación automática (continuar viendo). |
| RF-04 | El usuario puede agregar contenido a favoritos. |
| RF-05 | El sistema recomienda contenido según perfil de edad e historial. |
| RF-06 | El administrador puede subir y categorizar contenido por tema bíblico, edad y tipo. |
| RF-07 | El padre puede activar control parental y bloquear contenido inapropiado por edad. |
| RF-08 | El usuario puede descargar contenido para reproducción sin internet. (SUPUESTO: requiere acuerdo de licencia con proveedores) |
| RF-09 | El sistema muestra versículo del día y devocionales en formato video corto. |
| RF-10 | El sistema incluye sección de música cristiana con videos karaoke. |
| RF-11 | (Futuro) El sistema incluye juegos, retos bíblicos y sistema de puntos/ranking. |
| RF-12 | (Futuro) El sistema incluye lectura de Biblia y planes de lectura. |

### Requerimientos no funcionales preliminares

| ID | Descripción |
|---|---|
| RNF-01 | El catálogo es accesible sin login para usuarios visitantes (SEO público). |
| RNF-02 | La reproducción de video debe iniciar en menos de 3 segundos (buena conexión). |
| RNF-03 | El modo infantil debe bloquear completamente contenido no apto para menores. |
| RNF-04 | La interfaz debe ser usable por niños de 4+ años (UX simplificada, iconográfica). |
| RNF-05 | SUPUESTO: El sistema debe soportar contenido de terceros bajo licencia (DRM básico). |
| RNF-06 | SUPUESTO: Disponibilidad 99.5% mensual. |

### Supuestos declarados

1. El contenido audiovisual proviene de terceros bajo licencia o es producido por la organización propietaria.
2. El MVP se enfoca en el catálogo de video; los módulos de Biblia, juegos y gamificación son fase 2.
3. No hay restricciones de compliance regulatorio explícitas (COPPA, GDPR) aunque el público infantil las puede activar.
4. El stack `node-next` es correcto porque no se especifica equipo con expertise Java.
5. El deploy inicial es cloud (proveedor a definir); no hay restricción on-premise.

### Preguntas abiertas críticas

1. ¿Hay proveedor de contenido ya contratado o el catálogo inicial es propio?
2. ¿La plataforma es gratuita, de suscripción o freemium?
3. ¿El público objetivo está en una región específica (latencia, idioma, compliance)?
4. ¿Hay requisito de COPPA (niños menores de 13) que obligue a consentimiento parental explícito?
5. ¿Cuál es el equipo técnico disponible (tamaño, skills)?
6. ¿Hay fechas de lanzamiento comprometidas?
7. ¿La plataforma necesita apps nativas (iOS/Android) desde el MVP o solo web?

---

## 7. Estructura de carpetas que genera `create-project`

Después de ejecutar el comando de Fase B, la ruta destino debe tener:

```
C:\proyectos\cristiano-content\
├── AGENTS.md
├── README.md
├── ai/
│   ├── provider-manifest.json
│   └── tasks/
├── docs/
│   ├── README.md
│   ├── fase-0-iniciacion/
│   │   ├── 00.01-vision-proyecto.md
│   │   ├── 00.02-roadmap.md
│   │   ├── 00.03-estimacion-tiempo-costo.md
│   │   └── 00.04-roles-y-responsabilidades.md
│   ├── fase-1-analisis-requerimientos/
│   │   └── 01.00-analisis-requerimientos.md
│   ├── fase-2-ux-ui/
│   │   ├── 02.09-spec-driven-product-design.md
│   │   └── 02.12-checklist-spdd.md
│   ├── fase-3-arquitectura/
│   │   ├── 03.00-arquitectura.md
│   │   ├── 03.01-decisiones-tecnologia.md
│   │   ├── 03.03-plan-despliegue.md
│   │   └── adr/ADR-001-stack-node-next.md
│   └── transversal/
│       └── (archivos de referencia copiados del template)
└── specs/
    └── 001-catalogo-contenido/
        ├── product-design.md
        ├── spec-funcional.md
        └── traceability.md
```

---

## 8. Pack de orientación para proveedores IA (Fase C)

Cuando el proveedor IA termine la documentación, debe entregar este pack.
Úsalo para iniciar cualquier sesión futura sobre este proyecto.

```
--- INICIO PACK PROVEEDORES ---
Proyecto: Cristiano Content
Ruta: C:\proyectos\cristiano-content
Fase actual: 1 (análisis completado, UX pendiente)
Próximo task packet: ai/tasks/fase-2-ux.task.md

Lee antes de continuar:
- AGENTS.md
- docs/README.md
- docs/transversal/90.33-flujo-delivery-ia-proveedores.md
- ai/tasks/fase-2-ux.task.md

Supuestos abiertos que debes conocer:
- El contenido audiovisual proviene de terceros (acuerdos de licencia no confirmados).
- El MVP es solo web; apps nativas son fase posterior.
- Stack node-next elegido por SSR/SEO y ecosistema JS unificado.
- Compliance COPPA/GDPR no está confirmado aunque el público infantil lo puede activar.

Preguntas abiertas que bloquean avance:
- ¿Modelo de negocio: gratuito, suscripción o freemium? (bloquea RF de pagos y perfiles)
- ¿Proveedor de contenido definido? (bloquea RF-02, RF-08)
- ¿Restricción de región? (bloquea infraestructura y compliance)
- ¿Apps nativas en MVP? (bloquea decisiones de arquitectura frontend)

Gates pendientes:
- gate-ux-ready: requiere validación de product-design.md por negocio o PO.
- gate-spdd-approved: requiere prototipo + validación antes de SDD.
--- FIN PACK PROVEEDORES ---
```

---

## 9. Red flags a vigilar en este proyecto

Además de los red flags genéricos del prompt, presta atención a:

- **Contenido de terceros sin licencia definida**: Si el proveedor IA inventa un CDN o proveedor
  de contenido sin que esté en la fuente bruta, márcalo como SUPUESTO inmediatamente.
- **DRM inventado**: No especificar sistema de DRM real hasta tener acuerdo con proveedor.
- **COPPA sin confirmar**: Si la fuente no confirma usuario menor de 13 años registrado
  con datos propios, no diseñar flujo de consentimiento parental como requisito firme.
- **Módulos futuros mezclados con MVP**: Biblia, juegos y gamificación son fase 2.
  Si aparecen en RF del MVP, marcarlos como FUERA DE ALCANCE MVP.
- **Config con valores de ejemplo sin reemplazar**: Buscar `acme`, `case-management`,
  `CC-123` en el config generado. Su presencia indica que el proveedor IA no personalizó.

---

## 10. Checklist de validación del bootstrap

Antes de dar por completado el arranque, verifica:

- [ ] Archivo bruto leído completo; dos descripciones consolidadas en un solo proyecto.
- [ ] Supuesto de consolidación documentado en `00.01-vision-proyecto.md`.
- [ ] `cristiano-content.config.json` generado sin valores de ejemplo (`acme`, `case-management`).
- [ ] `create-project` ejecutado sin errores (`--stack node-next`).
- [ ] `check-docs` sin hallazgos sobre `C:\proyectos\cristiano-content`.
- [ ] `check-markdown-paths` sin hallazgos sobre `C:\proyectos\cristiano-content`.
- [ ] Fases 0-3 documentadas con SUPUESTO y PENDIENTE marcados.
- [ ] Permisos de dominio usan prefijo `CONTENT_*`, no `RESOURCE_*`.
- [ ] `gate-0-1`, `gate-ux-ready` y `gate-spdd-approved` declarados con estado.
- [ ] Pack de orientación para proveedores generado y entregado.
- [ ] Preguntas abiertas del § 6 registradas en `00.01-vision-proyecto.md` o `01.00-analisis-requerimientos.md`.

---

## Referencias

- [ai/prompts/arranque-desde-fuente-bruta.md](../../ai/prompts/arranque-desde-fuente-bruta.md)
- [ai/prompts/transformar-idea-a-documentacion-inicial.md](../../ai/prompts/transformar-idea-a-documentacion-inicial.md)
- [template.config.example.json](../../template.config.example.json)
- [ejemplos/fase-0-iniciacion/vision-ejemplo.md](../fase-0-iniciacion/vision-ejemplo.md)
- [docs/transversal/90.33-flujo-delivery-ia-proveedores.md](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
- [docs/transversal/90.34-product-design-y-spdd-frontend.md](../../docs/transversal/90.34-product-design-y-spdd-frontend.md)
