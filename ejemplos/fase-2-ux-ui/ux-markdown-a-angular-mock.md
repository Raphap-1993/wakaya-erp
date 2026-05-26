# Ejemplo: UX Markdown -> IA -> Penpot -> Angular Mock

## 1. Product Owner (Markdown)
Entrada base:

```md
## Objetivo
Permitir que un operador encuentre un caso en menos de 2 minutos y pueda cambiar su estado sin perder trazabilidad.

## Usuarios
- Operador
- Supervisor

## Flujo principal
1. El operador entra a la bandeja.
2. Filtra por numero, estado o fecha.
3. Abre el detalle del caso.
4. Cambia el estado y registra motivo.

## Estados UX
- Sin resultados
- Error de carga
- Confirmacion exitosa
- Permiso insuficiente
```

## 2. IA (estructura UX)
La IA convierte ese Markdown en una estructura UX mas operable:

- `Pantalla 1`: bandeja con filtros, tabla, paginacion y accesos rapidos.
- `Pantalla 2`: detalle con resumen, historial, evidencia y acciones.
- `Estado vacio`: mensaje, CTA y pistas de filtrado.
- `Estado de error`: reintento, soporte y contexto minimo.
- `Reglas`: solo supervisor puede aprobar; operador puede registrar y enviar a revision.

## 3. Penpot (mockup + prototipo clickable)
Artefacto esperado en Penpot:

- flujo clickable `Bandeja -> Detalle -> Cambio de estado -> Confirmacion`,
- variantes por rol,
- vista desktop y mobile,
- estados vacios y error,
- notas de contenido y componentes reutilizables.

Referencia documental sugerida (en `specs/<feature>/prototype.md`):

```md
## Enlace o evidencia
- Archivo Penpot: https://penpot.example/proyecto-casos
- Cobertura: bandeja, detalle, cambio de estado, historial
- Validado con: Product Owner + Operaciones
```

## 4. Angular Mock en Nx (prototipo real)
El mock ejecutable transforma el prototipo en una app de exploracion:

- workspace Nx con `apps/web` y librerias `libs/ui`, `libs/feature-cases`, `libs/data-access-cases`,
- rutas: `/bandeja`, `/casos/:id`, `/casos/:id/cambio-estado`,
- componentes: `CaseListPage`, `CaseDetailPage`, `ChangeStateDialog`,
- estado UI con `signals`,
- datos mock desde JSON o handlers fake,
- guards simples por rol para validar permisos y navegacion.

## Resultado esperado
- negocio valida experiencia en Markdown,
- UX aterriza la navegacion en Penpot,
- frontend explora interaccion real en Angular Mock sobre Nx,
- arquitectura y SDD reciben insumos mas claros para contratos, DTOs y features.
