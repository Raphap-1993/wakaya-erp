# Requerimientos no funcionales

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

## Objetivo
Consolidar restricciones y atributos de calidad que la solucion debe cumplir, aunque no correspondan a una funcion puntual del negocio.

## Regla de uso
- Usa esta plantilla para levantar `RNF` en fase 1.
- Los `RNF` definen condiciones obligatorias de calidad o restriccion del sistema.
- No confundas `RNF` con `riesgos`: un `RNF` dice que debe cumplir la solucion; un `riesgo` dice que podria impedir cumplirlo.

## Categorias sugeridas
## Rendimiento
Tiempo de respuesta, concurrencia, volumen, throughput o tiempos de procesamiento esperados.

## Disponibilidad y continuidad
Disponibilidad objetivo, ventanas operativas, tolerancia a fallas, recuperacion o RTO/RPO cuando aplique.

## Seguridad
Autenticacion, autorizacion, auditoria, cifrado, segregacion de funciones, proteccion de datos o cumplimiento.

## Integracion e interoperabilidad
Restricciones de protocolos, contratos, formatos, IAM corporativo o dependencias externas obligatorias.

## Operacion y observabilidad
Logs, metricas, trazas, alertas y visibilidad operativa minima requerida.

## Cumplimiento y regulacion
Normas, politicas internas o restricciones legales que la solucion debe respetar.

## Mantenibilidad y escalabilidad
Criterios de soporte, modularidad, evolucion, despliegue, crecimiento de carga o facilidad de cambio.

## Formato sugerido
- `RNF-01`: descripcion concreta y verificable.
- `RNF-02`: descripcion concreta y verificable.

## Nota sobre riesgos
Si aparece una amenaza o incertidumbre, no la mezcles dentro del `RNF`.
Ejemplo:
- `RNF`: "La consulta debe responder en menos de 2 segundos."
- `Riesgo`: "La base actual podria no soportar el volumen esperado sin optimizacion."
