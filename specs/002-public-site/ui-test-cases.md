# UI Test Cases - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Casos de prueba visual

### TC-PS-01 Home premium
- Dado que un visitante entra a la Home
- Cuando revisa el hero
- Entonces ve una imagen humana dominante y una barra flotante de booking

### TC-PS-02 Jerarquia de hospedaje
- Dado que un visitante navega la Home
- Cuando baja despues del hero
- Entonces encuentra Habitaciones antes que Eventos y Full Day

### TC-PS-03 Catalogo curado
- Dado que un visitante entra a Habitaciones
- Cuando revisa las categorias
- Entonces ve cards grandes con nombre, capacidad, precio desde y CTA

### TC-PS-04 Detalle orientado a decision
- Dado que un visitante abre una habitacion
- Cuando revisa el detalle
- Entonces encuentra galeria, amenidades, reglas y CTA de prereserva

### TC-PS-05 Solicitud publica
- Dado que un visitante inicia una prereserva
- Cuando envia el formulario
- Entonces el estado final dice solicitud recibida y no reserva confirmada

### TC-PS-06 Teasers secundarios
- Dado que un visitante revisa la Home
- Cuando llega a las lineas secundarias
- Entonces Eventos y Full Day aparecen como bloques editoriales y no como ruido
