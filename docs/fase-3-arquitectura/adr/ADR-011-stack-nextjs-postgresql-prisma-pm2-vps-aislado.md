# ADR-011 - Stack Next.js, PostgreSQL, Prisma y despliegue aislado con PM2 en VPS compartido

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-010 - Memoria local AI-first](ADR-010-memoria-local-ai-first-sqlite-sqlite-vec-duckdb.md)
- Siguiente: [ADR-012 - Centro de contenido, media e inventario por unidades](ADR-012-centro-contenido-media-inventario-unidades.md)
<!-- nav-guided:end -->

## Estado
Propuesto.

## Contexto

Wakaya es una empresa pequena con una necesidad concreta:

- un sitio publico premium para reservas
- un mini monitor interno de reservas
- despliegue rapido, seguro y mantenible
- operacion en una VPS compartida con otros clientes
- usuarios reales en produccion que no deben verse afectados

La prioridad no es construir una plataforma compleja, sino resolver bien el problema actual con buenas practicas, baja friccion operativa y riesgo controlado.

## Decision

La base tecnologica de Wakaya sera:

- Frontend y backend en una sola aplicacion `Next.js + TypeScript`
- Persistencia con `PostgreSQL`
- Acceso a datos con `Prisma`
- Proceso de aplicacion en produccion con `PM2`
- Proxy inverso, TLS y virtual hosts con `Hestia` / `Nginx`
- Despliegue en una unica VPS con aislamiento por usuario Unix

La aplicacion sera un monolito modular pequeno, con dos superficies:

- sitio publico de reservas
- mini monitor interno de reservas

## Alcance funcional

### Superficie publica

- Home
- Habitaciones
- Detalle de habitacion
- Eventos
- Full Day
- Prereserva manual

### Superficie interna

- Lista de reservas
- Detalle de reserva
- Filtros por estado, fecha y responsable
- Cambio de estado con auditoria
- Visibilidad de historial

## Razon de la decision

### 1. El negocio es pequeno y no requiere arquitectura pesada
Wakaya no necesita microservicios, orquestacion dura ni dos frontends separados para cumplir su objetivo actual.

### 2. La VPS es compartida
La plataforma debe minimizar superficie de fallo y evitar interferencias con otros clientes alojados en la misma maquina.

### 3. Hay usuarios reales en produccion
El despliegue debe priorizar rollback rapido, estabilidad y cambios controlados.

### 4. Next.js cubre la superficie publica y la interna
Con `App Router`, `Server Components`, `Route Handlers` y `Server Actions`, la aplicacion puede servir tanto la web publica como el panel interno sin separar el stack en dos proyectos.

### 5. Prisma simplifica el acceso a datos y migraciones
Wakaya necesita un modelo de datos claro, migraciones ordenadas y consultas mantenibles.

### 6. PM2 encaja con la operacion actual de la VPS
Permite gestionar el proceso de Node de forma simple, con reinicio, monitoreo basico y despliegue por release.

## Consecuencias

### Positivas

- despliegue mas rapido
- menos piezas que operar
- menor curva de aprendizaje
- una sola base tecnica
- menos puntos de falla
- mejor velocidad para iterar sobre la experiencia publica y el mini monitor

### Negativas

- se renuncia a separar frontend y backend en servicios distintos
- se depende de un unico deployable
- el crecimiento futuro debera re-evaluar el stack si aumenta mucho la complejidad

## Implicaciones de implementacion

- La aplicacion vivira bajo un usuario Unix dedicado, por ejemplo `wakaya`.
- Wakaya tendra su propio directorio de deploy, variables de entorno, logs y backup.
- PM2 correra unicamente el proceso de Wakaya.
- Hestia/Nginx publicara Wakaya mediante su propio vhost o subdominio.
- La base de datos y el usuario de base de datos seran propios.
- Las migraciones se ejecutaran antes de activar el release en produccion.
- El rollback debe existir antes de cualquier cambio productivo.

## Reglas de seguridad y resiliencia

- No ejecutar Wakaya como root.
- No compartir carpeta de despliegue con otros clientes.
- No reutilizar procesos PM2 ajenos.
- No tocar configuracion global del VPS fuera de lo necesario para Wakaya.
- No hacer cambios destructivos sin backup previo.
- No desplegar sin healthcheck posterior.
- No mezclar experimentos con la version en produccion.

## No objetivos

- No microservicios.
- No Angular.
- No Quarkus.
- No Temporal.
- No arquitectura distribuida compleja.
- No segundo frontend separado.

## Resultado esperado

Este stack debe permitir:

- salir rapido a produccion
- mantener estable la experiencia publica
- operar un mini monitor interno util
- proteger a los demas clientes del VPS
- simplificar mantenimiento y soporte

