# Prompt Generar C4

## Objetivo
Pedir la traduccion de la arquitectura en vistas C4 consistentes con LikeC4.

## Usalo cuando
- la arquitectura ya tiene componentes y relaciones,
- necesitas contexto y contenedores claros,
- quieres mantener vista visual y documento tecnico alineados.

## No lo uses cuando
- aun no hay arquitectura base aprobada o propuesta,
- el cambio solo requiere texto en un ADR,
- no se conocen actores, sistemas externos o limites.

## Entradas minimas
- documento de arquitectura,
- decisiones de tecnologia,
- limites del sistema y dependencias externas.

## Salida esperada
- definicion de contexto,
- definicion de contenedores,
- relaciones principales y notas de interes.

## Rutas destino
- `likec4/`
- `docs/fase-3-arquitectura/03.00-arquitectura.md`

## Verificacion minima
- Las vistas reflejan actores, sistema, contenedores e integraciones.
- Los nombres coinciden con arquitectura y ADR.
- El modelo LikeC4 puede navegarse sin relaciones huerfanas.

## Pedido base
```
Lee la arquitectura aprobada del proyecto.
Genera una vista C4 de contexto y contenedores alineada con LikeC4.
Refleja limites del sistema, actores, integraciones y decisiones estructurales principales.
```

