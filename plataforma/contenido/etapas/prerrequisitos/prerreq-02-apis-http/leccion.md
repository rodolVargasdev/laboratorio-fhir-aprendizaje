# Que es una API y HTTP

> **En simple:** una API es un mesero. Tu (el cliente) pides algo; la cocina (el
> servidor) lo prepara y te lo trae. HTTP es el idioma en que haces el pedido.

## Cliente y servidor

- **Cliente**: quien pide (tu navegador, una app, un script).
- **Servidor**: quien responde (guarda los datos y los entrega).
- **API**: el menu de cosas que puedes pedir y como pedirlas.

## Metodos HTTP (los verbos del pedido)

| Verbo | Significa | Ejemplo |
|-------|-----------|---------|
| GET | dame / lee | traer un paciente |
| POST | crea | registrar un paciente nuevo |
| PUT | actualiza | corregir un dato |
| DELETE | borra | eliminar un registro |

## Codigos de respuesta

- **200** todo bien. **404** no existe. **401/403** no autorizado.
- **4xx** = te equivocaste tu; **5xx** = fallo el servidor.

FHIR es exactamente esto: una API web donde pides recursos clinicos por HTTP,
por ejemplo `GET [base]/Patient/123`.
