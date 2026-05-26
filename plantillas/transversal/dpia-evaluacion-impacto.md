# Evaluacion de impacto en proteccion de datos (DPIA)

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a plantillas transversales](README.md)

Plantilla DPIA conforme GDPR art. 35. Obligatoria cuando el tratamiento implica alto riesgo: datos a gran escala, categorias especiales, decisiones automatizadas, monitorizacion sistematica, etc.

> Completa cada seccion. Si algo "no aplica", escribe el motivo. Un DPIA incompleto no tiene valor probatorio.

## 1. Descripcion sistematica
- **Actividad**: [[ROPA-xxx asociado]]
- **Contexto del negocio**: [[por que, a quien impacta]]
- **Naturaleza**: [[que datos, de donde, a donde]]
- **Alcance**: [[volumen, geografia, frecuencia]]
- **Actores**: [[responsable, encargados, desarrolladores]]

## 2. Finalidades y necesidad
- **Finalidades**: [[justificadas y proporcionales]]
- **Necesidad y proporcionalidad**: [[por que los datos son imprescindibles]]
- **Alternativas descartadas**: [[y por que]]

## 3. Consulta a interesados
- **Canales consultados**: [[encuestas, delegados, usuarios piloto]]
- **Resultados**: [[resumen]]
- **Decisiones incorporadas**: [[como se ajusto el tratamiento]]

## 4. Evaluacion de riesgos para los interesados

| Riesgo | Origen | Impacto (1-5) | Probabilidad (1-5) | Nivel (I*P) | Controles mitigadores |
|--------|--------|---------------|---------------------|-------------|-----------------------|
| [[perdida de confidencialidad]] | [[filtracion cuentas]] | [[ ]] | [[ ]] | [[ ]] | [[MFA, cifrado, alertas]] |
| [[decision automatizada injusta]] | [[modelo sesgado]] | [[ ]] | [[ ]] | [[ ]] | [[revision humana, explicabilidad]] |
| [[uso no autorizado]] | [[actor interno]] | [[ ]] | [[ ]] | [[ ]] | [[RBAC, audit log, revisiones]] |

## 5. Medidas previstas
- **Tecnicas**: [[cifrado, tokenizacion, seudonimizacion, backups, logging inmutable]]
- **Organizativas**: [[politicas, formacion, RACI]]
- **Procedimientos de derechos**: [[acceso, rectificacion, oposicion, portabilidad, supresion]]
- **Monitoreo continuo**: [[SIEM, audit trail, indicadores]]

## 6. Opinion del DPO
- [[Aprobado / Aprobado con condiciones / Bloqueado]]
- [[Comentarios]]
- [[Fecha y firma]]

## 7. Decision
- [[Tratamiento autorizado? Bajo que condiciones?]]
- [[Fecha de proxima revision (<=12 meses o al cambiar el tratamiento)]]

## Historial
- [[YYYY-MM-DD]] - [[cambio]] - [[responsable]]
