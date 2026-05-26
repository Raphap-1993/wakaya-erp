# Skill Brainstorming

## Objetivo
Reducir ambiguedad antes de escribir specs o codigo, explorando alternativas y aterrizando una opcion ejecutable.

## Aplicala cuando
- la necesidad aun es una idea, problema o requerimiento incompleto,
- hay mas de una forma razonable de resolver la feature,
- el proveedor IA podria saltar a implementacion sin entender trade-offs,
- falta decidir alcance minimo para una spec.

## No la apliques cuando
- ya existe spec aprobada y tareas verificables,
- el usuario pidio una correccion puntual sin cambio de alcance,
- la decision requiere aprobacion humana inmediata y no hay datos suficientes.

## Entradas minimas
- idea, RF, HU, incidente o problema,
- restricciones conocidas,
- artefactos existentes de fase 0-3 si aplican.

## Flujo recomendado
1. Resume el problema en una frase.
2. Declara supuestos y preguntas bloqueantes.
3. Propone dos alternativas reales, no variantes cosmeticas.
4. Compara trade-offs: alcance, riesgo, costo, operacion, UX y pruebas.
5. Recomienda una alternativa con razon.
6. Convierte la recomendacion en spec o pregunta abierta.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es obvio que solucion usar | Si hay ambiguedad, compara al menos dos caminos |
| Ya lo vemos al codificar | La incertidumbre debe quedar como supuesto, pregunta o decision |
| La IA puede escoger sola | La IA recomienda; decisiones relevantes requieren validacion humana |

## Red flags
- Solo hay una alternativa sin justificar.
- La recomendacion no menciona riesgos.
- Se decide tecnologia sin ADR.
- Se transforma un supuesto en decision aprobada.

## Verification evidence
- problema resumido,
- dos alternativas comparadas,
- recomendacion declarada,
- preguntas abiertas registradas,
- ruta destino de spec, ADR o documento de fase.

## Referencias
- `../references/requirements-and-discovery.md`
- `../references/documentation-and-traceability.md`
