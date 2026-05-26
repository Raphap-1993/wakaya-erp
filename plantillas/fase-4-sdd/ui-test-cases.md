> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# UI Test Cases - <Titulo de la feature>

## Casos manuales por estado

### Loading
- [ ] Al entrar a la vista, se muestra spinner centrado mientras carga.
- [ ] Si la carga tarda >500ms, aparece skeleton de filas.

### Empty
- [ ] Si el backend devuelve `[]`, se muestra mensaje "Aun no hay <entidad>s" + CTA primaria.
- [ ] El CTA lleva al flujo de creacion.

### Error
- [ ] Si el backend devuelve 500, se muestra mensaje "Algo salio mal" + boton "Reintentar".
- [ ] El boton dispara nueva request.

### Success
- [ ] Render correcto de N filas con datos del mock.
- [ ] Las acciones por fila aparecen al hacer hover.

### Permission denied
- [ ] Si el rol no autoriza la accion, el boton aparece deshabilitado con tooltip.
- [ ] Si el rol no autoriza la vista, redirige a /forbidden con mensaje.

### Validation
- [ ] Campo requerido vacio: mensaje inline en rojo bajo el input.
- [ ] Email mal formado: mensaje "Email invalido" tras blur.

## Casos por rol

| Rol | Caso | Resultado esperado |
|---|---|---|
| <Rol-A> | crea <entidad> | exito + toast |
| <Rol-A> | intenta borrar | accion denegada |
| <Rol-B> | borra <entidad> | exito tras confirmacion |

## Casos automatizables (e2e)
Trace: `RF-NN`

```ts
// tests/e2e/<entidad>.spec.ts
// @trace RF-NN
test("usuario puede listar <entidad>s", async ({ page }) => {
  await page.goto("/<entidad>");
  await expect(page.locator("[data-testid='<entidad>-list']")).toBeVisible();
});
```
