# Plantilla de runbook

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

## Objetivo
Describir los pasos operativos para desplegar, verificar y recuperar el sistema.

## Servicio o componente
Indica que servicio, modulo o conjunto de componentes cubre este runbook y en que entorno aplica.

## Responsables y contactos
Lista responsables operativos, soporte tecnico y contactos de escalamiento con el nivel de detalle necesario para actuar durante la ventana de despliegue.

## Preconditions
Documenta condiciones previas obligatorias, por ejemplo aprobacion de release, backups verificados, accesos y coordinacion de ventana.

## Despliegue paso a paso
Describe la secuencia operativa exacta que debe ejecutar el equipo, idealmente en orden numerado y sin asumir conocimiento implicito.

## Verificaciones posteriores
Incluye checks funcionales y tecnicos minimos para confirmar que la salida fue estable y que no hay alertas criticas.

## Rollback o recuperacion
Explica como revertir la salida o recuperar el servicio si falla el despliegue. Revisa `../../ejemplos/fase-7-deploy/runbook-ejemplo.md` como referencia aplicada.
