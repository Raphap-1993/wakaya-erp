# Spec funcional - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Permitir que backoffice administre bungalows con una experiencia más ordenada,
una zona de imágenes fácil de reemplazar y una optimización automática de media
apta para la web pública.

## Requerimientos funcionales

| ID | Actor | Requerimiento | Resultado esperado |
|---|---|---|---|
| RF-01 | Admin | Ver la edición de bungalow organizada por superficies | Tabs `Operación`, `Ficha web` y `Textos web` |
| RF-02 | Admin | Editar operación básica sin depender del contenido editorial | Cambios de código, capacidad y estado guardan sin bloqueo por copy |
| RF-03 | Admin | Reemplazar la portada con subida real de archivo | El sistema guarda la nueva portada optimizada |
| RF-04 | Admin | Agregar, eliminar y reordenar imágenes de galería | La galería refleja el orden operativo guardado |
| RF-05 | Admin | Ver previews de portada y galería en el editor | La media se valida visualmente antes de salir |
| RF-06 | Admin | Mantener un modo avanzado para URLs manuales | Compatibilidad operativa sin exponerlo como flujo principal |
| RF-07 | Admin | Editar textos ES y EN por separado | La edición editorial se hace por idioma |
| RF-08 | Sistema | Optimizar cada imagen subida a WebP | La web no recibe JPGs crudos de 4 a 8 MB |
| RF-09 | Sistema | Generar variantes para detalle, card y miniatura | La web y el backoffice consumen la variante correcta |
| RF-10 | Sistema | Validar tipo, tamaño y dimensiones del archivo | Se rechazan cargas inválidas con mensaje claro |

## Requerimientos no funcionales
- RNF-01 Performance: las imágenes públicas se sirven en WebP optimizado.
- RNF-02 UX: el editor reduce scroll y lectura lateral respecto a la pantalla
  actual.
- RNF-03 Seguridad: solo roles con `reservation:write` pueden mutar media.
- RNF-04 Persistencia: la relación bungalow-media queda trazable en la BD.
- RNF-05 Compatibilidad: el sistema conserva un camino de fallback para media
  manual mientras migra el contenido existente.

## Criterios de aceptación
- La pantalla muestra tabs de trabajo y una cabecera sticky compacta.
- El tab `Ficha web` permite reemplazar portada y gestionar galería visualmente.
- La subida de una foto JPG pesada devuelve una variante WebP optimizada.
- La ficha pública deja de depender únicamente de `heroImageUrl` y `galleryUrls`
  crudos.
- Los textos ES/EN quedan fuera del flujo principal de operación.
