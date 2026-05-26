# Prompt Generar Arquitectura

## Objetivo
Pedir una propuesta de arquitectura base alineada a requerimientos, RNF y restricciones del entorno.

## Usalo cuando
- el proyecto entra en fase 3,
- hace falta bajar requerimientos a componentes, integraciones y decisiones estructurales,
- necesitas una primera version de arquitectura o una actualizacion relevante.

## No lo uses cuando
- los requerimientos aun no estan minimamente estructurados,
- solo se necesita documentar una decision puntual en ADR,
- la salida no tendra revision humana de arquitectura.

## Entradas minimas
- vision y requerimientos,
- RNF,
- integraciones y restricciones,
- escenario y stack tentativo si ya existen.

## Salida esperada
- arquitectura base,
- componentes y relaciones,
- decisiones relevantes y riesgos,
- insumos para ADR y C4.

## Rutas destino
- `docs/fase-3-arquitectura/03.00-arquitectura.md`
- `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`
- `likec4/`

## Verificacion minima
- La arquitectura queda trazada a requerimientos y RNF.
- Las decisiones importantes quedan marcadas para ADR.
- Los limites, integraciones y riesgos operativos quedan visibles.

## Pedido base
```
Lee vision, requerimientos, RNF e integraciones.
Propone arquitectura base, componentes principales, contratos relevantes y riesgos.
Identifica decisiones que deben reflejarse en tecnologia, ADR y C4.
Entrega una salida que pueda actualizar la documentacion oficial de fase 3.
```

