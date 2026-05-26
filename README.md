# Wakaya ERP

Proyecto real Wakaya ERP con stack node-next, autenticacion OIDC, autorizacion RBAC y trazabilidad operacional.

## Estado inicial
- Stack: node-next.
- Backend: wakaya-erp-api.
- Frontend: wakaya-erp-web.
- API principal: /api/reservations.
- Paquete Java: com.wakaya.erp.
- Sistema Backstage: wakaya-erp.
- Owner: team-wakaya.

## Primeros comandos
```powershell
cd backend
mvn quarkus:dev

cd ..\frontend
npm install
npm run start
```

## Documentacion
- [Indice de documentacion](docs/README.md)
- [Vision del proyecto](docs/fase-0-iniciacion/00.01-vision-proyecto.md)
- [Analisis y requerimientos](docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [Arquitectura](docs/fase-3-arquitectura/03.00-arquitectura.md)
- [Spec inicial](specs/001-reservations/spec-funcional.md)
