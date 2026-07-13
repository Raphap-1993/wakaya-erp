# API Contract - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Endpoint
POST /api/public/complaints

## Auth
Acceso público con validación de input.

## Body minimo
- entryType
- fullName
- documentType
- documentNumber
- email
- phone
- address
- contractedService
- complaintDetail
- consumerRequest
- acceptedTerms

## Response
- complaint.id
- complaint.publicCode
- complaint.status

## Errores
- 400 por payload inválido
- 500 por error controlado

## Endpoint
GET /api/admin/complaints

## Auth
`reservation:read`

## Response
- items[]
- id
- publicCode
- entryType
- fullName
- email
- status
- createdAt

## Endpoint
GET /api/admin/complaints/{id}

## Auth
`reservation:read`

## Response
- complaint completo
