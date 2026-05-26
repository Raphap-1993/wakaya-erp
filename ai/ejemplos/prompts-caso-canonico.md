# Ejemplos de prompts sobre el caso canonico

## Prompt 1 - Generar spec funcional para 001
Usa `../prompts/generar-spec-funcional.md`.

### Ejemplo de uso
```
Usa generar-spec-funcional.
Toma HU-02 Consulta por bandeja de trabajo.
Contexto: sistema de expedientes on-premise con IAM corporativo.
Genera una spec funcional para la feature 001-bandeja-trabajo-expedientes.
Incluye actores, flujo principal, criterios de aceptacion, fuera de alcance y casos borde.
```

## Prompt 2 - Generar spec tecnica para 002
Usa `../prompts/generar-spec-tecnica.md`.

### Ejemplo de uso
```
Usa generar-spec-tecnica.
Toma la spec funcional de 002-cambio-estado-expediente.
Deriva contrato tecnico, reglas, errores, seguridad, observabilidad y estrategia de pruebas.
```

## Prompt 3 - Generar arquitectura del slice canonico
Usa `../prompts/generar-arquitectura.md`.

### Ejemplo de uso
```
Usa generar-arquitectura.
Lee vision, requerimientos y backlog del caso canonico.
Propone arquitectura para bandeja, cambio de estado e historial visible.
Incluye contratos principales y dependencias de IAM y auditoria.
```

## Prompt 4 - Generar backend para 003
Usa `../prompts/generar-backend.md`.

### Ejemplo de uso
```
Usa generar-backend.
Parte de la spec tecnica de 003-historial-auditoria-expediente.
Define componentes backend, contratos y pruebas de integracion.
```

## Prompt 5 - Generar tests del slice canonico
Usa `../prompts/generar-tests.md`.

### Ejemplo de uso
```
Usa generar-tests.
Toma 001, 002 y 003.
Propone pruebas unitarias, de integracion y e2e alineadas al caso canonico.
```
