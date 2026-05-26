# Catalogo organizacional (CMDB Backstage)

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Stacks de referencia](../docs/transversal/90.04-stacks-de-referencia.md)

## Contenido
- [Objetivo](#objetivo)
- [Estructura](#estructura)
- [Como cargar en Backstage](#como-cargar-en-backstage)
- [Como anadir un servicio nuevo](#como-anadir-un-servicio-nuevo)
- [Trazabilidad con stacks](#trazabilidad-con-stacks)

<a id="objetivo"></a>
## Objetivo
Servir como baseline de CMDB para cualquier organizacion que adopte la plantilla. Contiene los descriptores Backstage organizacionales (dominios, sistemas, grupos, usuarios) y el patron de agregacion raiz (`all.yaml`) que Backstage consume como un unico `catalog-info.yaml`.

Los `catalog-info.yaml` de cada stack en `stacks/<stack>/template/catalog-info.yaml` registran Components y APIs por servicio. Este directorio `catalog/` registra la capa superior: Domain -> System -> Component, ademas de Groups y Users.

<a id="estructura"></a>
## Estructura
```text
catalog/
  README.md          # este archivo
  all.yaml           # punto de entrada para Backstage (Location con sub-refs)
  domains/
    producto.yaml
    plataforma.yaml
  systems/
    expedientes.yaml
    plataforma-core.yaml
  groups/
    team-expedientes.yaml
    team-plataforma.yaml
  users/
    ejemplo.yaml
  templates/
    new-service.yaml # Software Template (scaffolder) que invoca scripts/new-service.mjs
  apis/
    expedientes-rest.yaml      # API kind apuntando a contracts/api/openapi.yaml
    expedientes-events.yaml    # API kind apuntando a contracts/events/asyncapi.yaml
  resources/
    expedientes-db.yaml        # Recurso DB primaria (PostgreSQL)
    expedientes-cache.yaml     # Recurso cache (Redis)
    expedientes-events-bus.yaml # Recurso bus de eventos
```

<a id="como-cargar-en-backstage"></a>
## Como cargar en Backstage
1. Levantar Backstage con la configuracion de tu organizacion (`app-config.yaml`).
2. En `catalog.locations`, anadir una entrada:
   ```yaml
   catalog:
     locations:
       - type: url
         target: https://github.com/<org>/<repo>/blob/main/catalog/all.yaml
         rules:
           - allow: [Location, Domain, System, Group, User, Template, API, Resource, Component]
   ```
3. Backstage procesara `all.yaml` que a su vez referencia los sub-archivos.
4. Los `catalog-info.yaml` por servicio deben ser descubiertos con la integracion `github-discovery` o registrados individualmente en `app-config.yaml`.

<a id="como-anadir-un-servicio-nuevo"></a>
## Como anadir un servicio nuevo
1. Ejecutar `node scripts/new-service.mjs --stack <stack> --config <config.json> --dest <ruta>` para instanciar el scaffolding (incluye `catalog-info.yaml` pre-poblado).
2. Publicar el repo y dejar que github-discovery lo recoja, o anadir manualmente la `Location` apuntando al `catalog-info.yaml` generado.
3. Si el servicio pertenece a un System nuevo, anadir el descriptor correspondiente en `systems/` y referenciarlo en `all.yaml`.
4. Si requiere un Group nuevo, anadir `groups/team-<slug>.yaml` con los miembros.

<a id="trazabilidad-con-stacks"></a>
## Trazabilidad con stacks
- `stacks/node-next/template/catalog-info.yaml` registra el Component web principal.
- `stacks/java-monolith/template/catalog-info.yaml` registra el Component API Java.
- `stacks/quarkus-angular/template/catalog-info.yaml` registra ambos (frontend + backend).
- `stacks/spring-react/template/catalog-info.yaml` registra ambos (frontend + backend).

El `System` que engloba a estos Components se define aqui en `systems/` para que el mapping producto -> servicios sea trazable desde un unico lugar.

Las `API` (REST y eventos) y los `Resource` (DB, cache, bus) del sistema se registran en `apis/` y `resources/`. Esto permite que Backstage muestre el grafo completo Component -> providesApis -> API -> consumesApis y Component -> dependsOn -> Resource. Los `catalog-info.yaml` por stack pueden anadir `providesApis: [expedientes-rest]` y `dependsOn: [resource:expedientes-db]` para activar el grafo.

## Referencias
- [Stacks de referencia](../docs/transversal/90.04-stacks-de-referencia.md)
- [Stacks de referencia](../docs/transversal/90.04-stacks-de-referencia.md)
- [Backstage Software Catalog docs](https://backstage.io/docs/features/software-catalog/)
