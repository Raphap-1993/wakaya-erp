# Referencia: Spec + Prototype Driven Development Frontend

## Usala cuando
- una feature visual debe validarse antes de SDD final o construccion,
- hay que convertir Product Design en prototipo y criterios UI,
- un proveedor IA necesita instrucciones operativas concretas,
- QA o Tech Lead necesitan evidencia de consistencia.

## Flujo canonico
```text
Product Design + spec funcional inicial
  -> prototipo HTML5 rapido o Penpot formal
  -> gate-prototype-ready
  -> validacion de prototipo
  -> estados UI y criterios UI
  -> gate-spdd-approved
  -> SDD tecnico front/back
```

## Reglas
- No cerrar SDD ni construir desde una pantalla suelta; debe existir trazabilidad a Product Design y SPDD.
- No crear componente sin actualizar criterios UI o sistema de componentes si cambia la interfaz.
- No conectar API real durante prototipado HTML5/Penpot; la API real pertenece a construccion post SDD.
- No pasar a SDD final si el prototipo no esta aprobado o sus observaciones no estan aceptadas.
- No aceptar divergencias del prototipo sin registrarlas.
- No declarar `gate-spdd-approved` solo porque existe un prompt Penpot o una carpeta HTML5.

## Evidencia minima
| Bloque | Evidencia |
|---|---|
| Entrada | Product Design, spec funcional inicial, flujo UX |
| Prototipo | pantallas, estados, componentes, validaciones visibles y ruta/link reproducible |
| Validacion | resultado, observaciones resueltas o aceptadas |
| UI | estados loading, empty, error, success y unauthorized cuando aplique |
| Consistencia | criterios UI y sistema de componentes actualizados |
| SDD input | campos, acciones, permisos, errores, api-contract y criterios UI |

## Red flags
- SDD final sin gate-spdd-approved,
- componente fuera de sistema,
- estado de error no representado,
- prototipo sin validacion de negocio,
- prototipo no navegable o no revisable,
- divergencia entre spec inicial y prototipo.

## Rutas relacionadas
- `../../docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md`
- `../../docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md`
- `../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
- `../commands/prototype-command.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../skills/html5-prototyping.skill.md`
- `../skills/penpot-ai-prototyping.skill.md`
- `../agents/frontend-spdd-agent.md`
- `../quality-gates/gate-prototype-ready.md`
- `../quality-gates/gate-spdd-approved.md`
