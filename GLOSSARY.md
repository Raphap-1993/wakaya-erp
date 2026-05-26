# GLOSSARY

> Glosario unico del proyecto: terminos del framework AI-first y terminos del
> dominio de negocio. Evita que un agente IA interprete mal un termino.

## Terminos del framework
| Termino | Definicion |
|---|---|
| RF | Requerimiento funcional. Capacidad observable que el sistema debe ofrecer. |
| RNF | Requerimiento no funcional. Restriccion de calidad: performance, seguridad. |
| HU | Historia de usuario. Necesidad expresada desde el actor. |
| Fase 0-8 | Etapas del ciclo: iniciacion, analisis, UX/UI, arquitectura, SDD, construccion, QA, deploy, operacion. |
| SDD | Spec-Driven Development. Construir desde spec funcional + tecnica + tareas. |
| SPDD | Spec-Prototype-Driven Development. Validar UX con prototipo antes de SDD. |
| ADR | Architecture Decision Record. Decision tecnica con contexto y consecuencias. |
| Gate | Quality gate. Punto de control que bloquea avanzar si no se cumple. |
| Trazabilidad | Cadena RF -> HU -> diseno -> prototipo -> API -> BD -> codigo -> test -> evidencia. |
| Memoria del agente | BD SQLite reconstruible que indexa Markdown y trazabilidad. |
| Fuente de verdad | Los Markdown del repo. La BD es indice; si contradice un Markdown, gana el Markdown. |

## Terminos del dominio
| Termino | Definicion |
|---|---|
| reservation | Recurso principal del dominio (reservations). Completar con la definicion de negocio. |

## Sinonimos y formas no permitidas
| No usar | Usar |
|---|---|
| <sinonimo informal> | <termino canonico> |
