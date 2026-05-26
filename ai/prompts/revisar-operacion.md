# Prompt Revisar Operacion

## Objetivo
Evaluar la operacion continua del proyecto con foco en metricas, alertas, riesgos y backlog evolutivo.

## Usalo cuando
- el sistema ya esta operando,
- se quiere revisar la salud posterior a un release,
- hace falta convertir observaciones operativas en trabajo concreto.

## No lo uses cuando
- el cambio aun no salio a produccion,
- solo necesitas validar QA o release readiness.

## Entradas minimas
- metricas o dashboards,
- alertas activas o historial de incidentes,
- backlog operativo o deuda conocida.

## Salida esperada
- resumen operativo actual,
- hallazgos y riesgos,
- metricas o alertas a mejorar,
- backlog evolutivo recomendado.

## Rutas destino
- `docs/fase-8-operacion/08.00-operacion-continua.md`
- `ops/fase-8-operacion/operacion.md`
- `ops/fase-8-operacion/metricas.md`

## Verificacion minima
- Se distinguen sintomas, impacto y accion recomendada.
- La salida termina en artefactos operativos y no solo narrativos.
- Los hallazgos pueden priorizarse como backlog.

## Pedido base
```md
Actua como SRE o responsable de operacion continua.

Revisa el estado operativo actual del proyecto y convierte la observacion en hallazgos accionables.

Obligatorio:
- resume metricas, alertas, incidentes recientes y deuda operativa,
- distingue sintomas de causas probables,
- propone backlog evolutivo priorizable,
- no declares estabilidad si no hay evidencia suficiente.

Entrega:
1. resumen operativo,
2. hallazgos,
3. riesgos y deuda,
4. acciones recomendadas,
5. proxima revision sugerida.
```
