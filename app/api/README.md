# API Documentation (`/app/api`)

This document describes the HTTP API routes implemented in `app/api` using a practical, production-style format.

## 1) Overview

- **Framework:** Next.js Route Handlers (`app/api/**/route.ts`)
- **Response format:** JSON for successful and most error responses
- **Auth provider:** Supabase Auth (Bearer token for protected endpoints)
- **Base URL (local):** `http://localhost:3000`

---

## 2) Conventions

### Authentication
Protected endpoints require:

```http
Authorization: Bearer <supabase_access_token>
```

If token is missing/invalid, endpoints typically return **401 Unauthorized**.

### Content type
For requests with a body:

```http
Content-Type: application/json
```

### Error shape
Most endpoints return one of the following:

```json
{ "error": "message" }
```

or a plain text body for some legacy handlers.

---

## 3) Endpoint Index

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create a user account |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `POST` | `/api/auth/logout` | Session-based | Logout current session |
| `GET` | `/api/ingredients` | No | List ingredients (optional search) |
| `GET` | `/api/ingredients/user` | Yes | List authenticated user's stored ingredients |
| `POST` | `/api/ingredients/user` | Yes | Add ingredient to authenticated user's inventory |
| `DELETE` | `/api/ingredients/user` | Yes | Remove ingredient from authenticated user's inventory |
| `POST` | `/api/ai/meal-ideas` | Yes | Generate meal ideas from user's ingredients |
| `POST` | `/api/ai/meal-recipe` | Yes | Generate full recipe instructions |

---

## 4) Authentication Endpoints

## `POST /api/auth/register`
Create a new user with email/password.

### Request body

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Success response (`200`)

```json
{
  "user": {},
  "session": {}
}
```

### Common errors
- `400` — missing fields
- `400` — Supabase signup error

---

## `POST /api/auth/login`
Sign in an existing user with email/password.

### Request body

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Success response (`200`)

```json
{
  "user": {},
  "session": {}
}
```

### Common errors
- `400` — missing fields
- `401` — invalid credentials

---

## `POST /api/auth/logout`
Signs out the currently authenticated session.

### Success response (`200`)

```json
{ "success": true }
```

---

## 5) Ingredient Endpoints

## `GET /api/ingredients`
Returns ingredient catalog.

### Query parameters
- `search` *(optional, string)*: filters by normalized ingredient name.

### Example
`GET /api/ingredients?search=egg`

### Success response (`200`)

```json
{
  "ingredients": [
    {
      "id": "uuid",
      "name": "Egg",
      "category": "protein"
    }
  ]
}
```

### Common errors
- `500` — database query error

---

## `GET /api/ingredients/user`
Returns current user's inventory entries.

### Headers
`Authorization: Bearer <token>`

### Success response (`200`)

```json
{
  "recipes": [
    {
      "id": "uuid",
      "quantity": 1,
      "ingredient": {
        "id": "uuid",
        "name": "Egg",
        "category": "protein"
      }
    }
  ]
}
```

> Note: response key is currently `recipes` in implementation.

### Common errors
- `401` — missing/invalid bearer token
- `500` — unexpected server error

---

## `POST /api/ingredients/user`
Adds ingredient to user's inventory (upsert on `user_id + ingredient_id`).

### Headers
`Authorization: Bearer <token>`

### Request body

```json
{
  "ingredient_id": "uuid"
}
```

### Success response (`201`)

```json
{
  "ingredient": {
    "id": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "ingredient": {
      "id": "uuid",
      "name": "Egg",
      "category": "protein"
    }
  }
}
```

### Common errors
- `401` — unauthorized
- `400` — missing/invalid `ingredient_id`
- `500` — insert/update error

---

## `DELETE /api/ingredients/user`
Removes one inventory row for current user.

### Headers
`Authorization: Bearer <token>`

### Request body

```json
{
  "id": "uuid"
}
```

### Success response (`200`)

```json
null
```

### Common errors
- `401` — unauthorized
- `403` — incomplete request body
- `500` — delete error

---

## 6) AI Endpoints

## `POST /api/ai/meal-ideas`
Generates meal idea suggestions from authenticated user's ingredients.

### Headers
`Authorization: Bearer <token>`

### Request body
No body required.

### Success response (`200`)
Returns generated model output as JSON (currently forwarded directly from the AI flow).

### Common errors
- `401` — unauthorized
- `500` — generation error

---

## `POST /api/ai/meal-recipe`
Generates a complete recipe from selected idea + ingredients.

### Headers
`Authorization: Bearer <token>`

### Request body

```json
{
  "recipe_name": "Egg Fried Rice",
  "ingredients": ["Egg", "Rice", "Scallion"]
}
```

### Success response (`200`)
Returns generated full recipe JSON from AI flow, commonly including:
- name
- serving
- cook_time_minutes
- ingredients[]
- steps[]
- tips[]

### Common errors
- `401` — unauthorized
- `400` — invalid body (`recipe_name` missing or `ingredients` not array)
- `500` — generation error

---

## 7) cURL Quickstart

## Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## List ingredients
```bash
curl "http://localhost:3000/api/ingredients?search=egg"
```

## Add user ingredient
```bash
curl -X POST http://localhost:3000/api/ingredients/user \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"ingredient_id":"<INGREDIENT_UUID>"}'
```

## Generate meal recipe
```bash
curl -X POST http://localhost:3000/api/ai/meal-recipe \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"recipe_name":"Egg Omelette","ingredients":["Egg","Cheese"]}'
```

---

## 8) Suggested Next Step (Optional)

For external consumers or frontend SDK generation, you can formalize this into an **OpenAPI 3.1** spec (`openapi.yaml`) while keeping this file as the human-readable guide.
