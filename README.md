# Webprog Blog

Egyszerű blogplatform: bejegyzések olvasása, kommentelés, regisztráció és bejelentkezés JWT alapon. Szerveroldali render (EJS) + JSON API. Relációs tárolás SQLite-on Sequelize ORM-mel.

## Funkciók

- Bejegyzések listázása és megtekintése (HTML + JSON API)
- Kommentek hozzáadása bejegyzésekhez (bejelentkezés szükséges)
- Felhasználói regisztráció és bejelentkezés (JWT, HTTP-only cookie)
- Saját bejegyzés létrehozása bejelentkezett felhasználóknak
- Responzív felület (mobile-first CSS, `@media` töréspont)

## Kiegészítő funkciók (a specifikációból)

1. **ORM** – Sequelize (`src/models/index.js`).
2. **Autentikáció (JWT)** – `jsonwebtoken` + `bcryptjs` (`src/middleware/auth.js`, `src/routes/auth.js`).
3. **CI/CD** – GitHub Actions workflow (`.github/workflows/ci.yml`) minden push/PR-nál futtatja a teszteket.

## Architektúra

```
Client (böngésző)
    │  HTTP (HTML / JSON)
    ▼
Express alkalmazás (src/app.js)
    ├── src/routes/auth.js    — /auth/register, /auth/login, /auth/logout
    ├── src/routes/posts.js   — HTML nézetek, űrlap-kezelés
    ├── src/routes/api.js     — /api/posts, /api/posts/:id, kommentelés
    ├── src/middleware/auth.js — JWT aláírás / ellenőrzés, requireAuth
    └── src/models/index.js   — Sequelize modellek + asszociációk
            │
            ▼
       SQLite (data/blog.sqlite) – relációs tárolás
```

## Projektszerkezet

```
src/
  app.js, server.js
  config/db.js
  models/index.js          # User, Post, Comment
  middleware/auth.js       # JWT + requireAuth
  routes/                  # auth, posts, api
  views/                   # EJS sablonok + partials
public/styles.css          # reszponzív CSS
tests/                     # Vitest + supertest integrációs tesztek
.github/workflows/ci.yml   # CI
```

## Konfiguráció

`.env` (lásd `.env.example`):

| Változó | Alapértelmezett | Leírás |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `JWT_SECRET` | `dev-secret` | JWT aláíró kulcs – éles környezetben kötelező cserélni |
| `DATABASE_URL` | `sqlite:./data/blog.sqlite` | SQLite fájl (vagy `sqlite::memory:` teszthez) |

## Telepítés és futtatás

```bash
npm install
cp .env.example .env
npm run dev     # http://localhost:3000
```

## Tesztek

```bash
npm test
```

A Vitest + supertest integrációs tesztek memóriabeli SQLite-on futnak (`tests/setup.js`), lefedik a bejegyzés-listázást, kommentelést és az authentikáció folyamatát.

## Adatmodell

- **User**: `id`, `username` (egyedi), `passwordHash`, `role` (`user`/`admin`)
- **Post**: `id`, `title`, `content`, `authorId → User`
- **Comment**: `id`, `body`, `postId → Post`, `authorId → User`

Asszociációk: `User hasMany Post/Comment`, `Post hasMany Comment`, `Post belongsTo User` (`author`), `Comment belongsTo User`/`Post`.

## API végpontok

### HTML (EJS render)

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/` | Bejegyzés lista |
| GET | `/posts/:id` | Bejegyzés + kommentek |
| GET | `/posts/new` | Új bejegyzés űrlap (auth) |
| POST | `/posts` | Új bejegyzés létrehozás (auth) |
| POST | `/posts/:id/comments` | Komment hozzáadása (auth) |
| GET | `/auth/register`, `/auth/login` | Űrlapok |
| POST | `/auth/register` | Regisztráció (`username`, `password`) |
| POST | `/auth/login` | Bejelentkezés |
| POST | `/auth/logout` | Kilépés |

### JSON API

| Metódus | Útvonal | Leírás | Auth |
|---|---|---|---|
| GET | `/api/posts` | Összes bejegyzés | – |
| GET | `/api/posts/:id` | Egy bejegyzés + kommentek | – |
| POST | `/api/posts/:id/comments` | Komment létrehozás | JWT cookie / `Authorization: Bearer <token>` |

Minta kérés:

```http
POST /api/posts/1/comments
Content-Type: application/json
Authorization: Bearer <jwt>

{ "body": "Nagyon jó cikk!" }
```

Minta válasz (`201 Created`):

```json
{ "id": 12, "body": "Nagyon jó cikk!", "postId": 1, "authorId": 3, "createdAt": "...", "updatedAt": "..." }
```

JWT megszerzése:

```http
POST /auth/login
Accept: application/json
Content-Type: application/json

{ "username": "alice", "password": "secret123" }
```

Válasz: `{ "token": "<jwt>" }` és `Set-Cookie: token=<jwt>; HttpOnly`.

## CI

A `.github/workflows/ci.yml` workflow Node 20-on futtatja `npm ci` + `npm test` parancsokat push és pull request eseményre a `main` ágon.

## Deploy (Render.com)

A repo gyökerében található [`render.yaml`](render.yaml) egy **Blueprint**: git pusholás után a Render automatikusan létrehoz egy ingyenes Postgres-t és egy Web Service-t, a `DATABASE_URL`-t pedig automatikusan beköti.

Lépések:
1. Push a repót GitHub-ra (pl. `git remote add origin ... && git push -u origin main`).
2. Render.com → **New → Blueprint** → válaszd ki a repót.
3. Render felolvassa a `render.yaml`-t, létrehozza a Postgres-t + a web service-t, a `JWT_SECRET`-et auto-generálja.
4. Minden `main`-re történő push automatikusan redeploy-t indít (`autoDeploy: true`).

A `src/config/db.js` a `DATABASE_URL` alapján dönt:
- `postgres://...` / `postgresql://...` → Postgres (Render prod)
- `sqlite::memory:` → in-memory (tesztek)
- bármi más / hiányzó → helyi SQLite fájl (`data/blog.sqlite`)

Így **nincs két külön konfig** – lokálisan SQLite-tal fejlesztesz, Rendere Postgres-sel fut.

## Git előzmények (elvárt struktúra)

1. `chore: project scaffolding`
2. `feat: database models and Sequelize setup`
3. `feat: posts and comments routes with EJS views`
4. `feat: JWT-based auth and protected routes`
5. `test: integration tests for posts and auth`
6. `ci: GitHub Actions workflow`
