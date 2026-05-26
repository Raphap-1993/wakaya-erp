# Ejemplo: idea -> IA -> documentacion inicial por fases

Usa como base `../prompts/transformar-idea-a-documentacion-inicial.md`.

Para el flujo completo (config + create-project + docs 0-8 + pack proveedores), usa:
`../prompts/arranque-desde-fuente-bruta.md`.

## Idea bruta
> "Necesitamos una plataforma para registrar casos internos, dar seguimiento, controlar permisos y tener auditoria porque hoy todo esta en correo y Excel."

## Transformacion con IA
La IA toma esa idea y la separa en piezas iniciales:

- problema: trazabilidad manual y riesgo operativo,
- actores: operador, supervisor, auditor, admin,
- objetivos: registrar, consultar, cambiar estado, auditar,
- riesgos: accesos indebidos, baja trazabilidad, tiempos altos de respuesta,
- huecos: volumen esperado, canales de ingreso, integraciones, SLA, IAM corporativo.

## Ejemplo de pedido
```md
Usa transformar-idea-a-documentacion-inicial.
Toma esta idea como entrada:

"Necesitamos una plataforma para registrar casos internos, dar seguimiento, controlar permisos y tener auditoria porque hoy todo esta en correo y Excel."

Genera borradores iniciales por fases 0, 1, 2 y 3 usando las rutas canonicas del repositorio.
Marca supuestos, preguntas abiertas y decisiones que todavia requieren validacion humana.
```

## Documentacion inicial por fases

### Fase 0
La IA propone primeros borradores para:
- vision del proyecto,
- roadmap inicial,
- estimacion gruesa,
- roles base.

### Fase 1
La IA propone primeros borradores para:
- requerimientos funcionales,
- RNF,
- reglas de negocio,
- modulos,
- backlog inicial.

### Fase 2
La IA propone primeros borradores para:
- Product Design: problema, actores, journey, hipotesis, alcance, metricas -> `specs/<feature>/product-design.md`.
- UX base: journeys, pantallas, estados UX, validaciones de flujo -> `docs/fase-2-ux-ui/02.00-ux-ui.md`.
- SPDD: si la feature tiene superficie visual, spec inicial + prototipo + validacion (pendiente hasta iteracion con negocio).
- Gate: `gate-ux-ready` como pendiente hasta validacion humana del Product Design.

### Fase 3
La IA propone primeros borradores para:
- arquitectura inicial,
- decisiones tecnologicas candidatas,
- plan de despliegue,
- riesgos tecnicos a validar.

## Resultado esperado
La idea deja de ser una nota aislada y se convierte en una base documental inicial para que negocio, UX y arquitectura puedan revisar el mismo contexto antes de entrar a refinement formal.
