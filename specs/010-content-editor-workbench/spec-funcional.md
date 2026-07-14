# Spec funcional - Wakaya Content Editor Workbench

## Requerimientos

| ID | Requerimiento | Resultado |
|---|---|---|
| RF-010-01 | Ver módulos editoriales | Home, Páginas, Experiencias, Galería y Bungalows |
| RF-010-02 | Editar un elemento por vez | Lista contextual y formulario enfocado |
| RF-010-03 | Editar ES/EN | Un idioma visible, estructura compartida |
| RF-010-04 | Publicar | Una acción primaria con versión optimista |
| RF-010-05 | Previsualizar bajo demanda | Panel temporal desktop/mobile |
| RF-010-06 | Consultar historial bajo demanda | Panel temporal y restore existente |
| RF-010-07 | Separar estilos globales | Configuración web fuera de las secciones |
| RF-010-08 | Ocultar opciones técnicas | Ajustes avanzados plegados y sin IDs internos |
| RF-010-09 | Preservar dominio | No cambia contenido público ni lógica de reservas |
| RF-010-10 | Localizar errores de publicación | Resumen completo con bloque, idioma, campo y acción `Ir al campo` |

## Reglas

- El editor sigue siendo estructurado y bilingüe.
- Media, orden y visibilidad son compartidos entre idiomas.
- La publicación conserva validación y revisión recuperable.
- Una publicación inválida no envía la mutación; abre y enfoca el primer campo
  inválido y conserva todos los errores navegables en el resumen.
- No se permite HTML, CSS ni composición libre.
