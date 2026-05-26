> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# API Contract - <Titulo de la feature>

## Endpoints

### GET /api/<entidad>

**Trace**: `RF-NN`
**Auth**: requerido (rol <X> o <Y>)
**Query params** (si aplica):
| Param | Tipo | Requerido | Notas |
|---|---|---|---|
| <param_1> | string | no | <descripcion> |
| page | int | no | default 0 |
| size | int | no | default 20, max 100 |

**Request body** (POST/PUT/PATCH):
```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [<campo_1>]
        properties:
          <campo_1>:
            type: string
            example: "valor ejemplo"
          <campo_2>:
            type: integer
            minimum: 0
```

**Response 200**:
```yaml
responses:
  '200':
    description: OK
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/<entidad>'
            page:
              type: integer
            total:
              type: integer
```

**Errores**:
- 400: validacion fallida
- 401: sin autenticacion
- 403: rol sin permiso
- 404: recurso no existe (si aplica)
- 500: error interno (registrado con correlationId)



## Schema OpenAPI (referenciar en `contracts/api/openapi.yaml`)

```yaml
components:
  schemas:
    <entidad>:
      type: object
      required: [id]
      properties:
        id:
          type: string
          format: uuid
        <campo_1>:
          type: string
        <campo_2>:
          type: string
          format: date-time
        estado:
          type: string
          enum: [pendiente, activo, inactivo]
```

## Correlacion
Toda request DEBE llevar header `X-Correlation-Id` (UUID). Si no viene, el backend lo genera.
Se propaga a logs y telemetria.

## Rate limit
- <X> requests por minuto por usuario.
- 429 con header `Retry-After` cuando se excede.
