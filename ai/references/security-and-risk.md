# Referencia: Security And Risk

## Usala cuando
- el trabajo toca IAM, datos, integraciones, despliegue o secretos,
- hay decisiones tecnicas con impacto de riesgo,
- estas revisando una salida con foco de compliance u operacion segura.

## Checklist rapido
- Riesgos principales visibles y con contexto.
- Controles de autenticacion, autorizacion y auditoria declarados.
- Datos sensibles y secretos tratados explicitamente.
- Dependencias o proveedores con implicancias de seguridad identificados.
- Si aparece una decision estructural, se documenta en fase 3 o ADR.

## Red flags
- "Seguridad" resuelta con una frase generica.
- Secretos o IAM asumidos como detalle de implementacion menor.
- Riesgos operativos o de cumplimiento sin owner ni ruta documental.

## Rutas relacionadas
- `docs/fase-3-arquitectura/03.05-configuracion-secretos.md`
- `docs/fase-3-arquitectura/03.08-auth-authz.md`
- `docs/transversal/90.15-seguridad-dependencias.md`
- `docs/transversal/90.16-privacidad-compliance.md`
- `docs/transversal/90.25-threat-modeling.md`
