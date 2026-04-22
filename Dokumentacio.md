# Webprog Blog

Egyszerű blogplatform: bejegyzések olvasása, kommentelés, regisztráció és bejelentkezés JWT alapon. Szerveroldali render (EJS) + JSON API. Relációs tárolás – lokálisan SQLite, éles környezetben PostgreSQL – Sequelize ORM-mel.

**Élő demo:** <https://webprog-blog.onrender.com> (Render ingyenes tier ; az első kérés kb.50 mp, mert az instance alvó állapotból ébred).
**Github:** <https://github.com/zottyy2/blogplatform>
**Elevator pitch videó link:** https://gdfhu-my.sharepoint.com/:v:/g/personal/qw6jut_neptun_gde_hu/IQC6xyx4xghMS709FsPiAnVkAeCNbvznKRPCKLYCoLsB0tY?e=e181f9&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D

## Funkciók

- Bejegyzések listázása és megtekintése (HTML + JSON API)
- Kommentek hozzáadása bejegyzésekhez (bejelentkezés szükséges)
- Felhasználói regisztráció és bejelentkezés (JWT, HTTP-only cookie)
- Saját bejegyzés létrehozása bejelentkezett felhasználóknak
- Responzív felület (mobile-first CSS, `@media` töréspont)

## Kiegészítő funkciók

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
``

## Konfiguráció

`.env` (`.env.example`):

 Változó  Alapértelmezett  Leírás 

 `PORT`  `3000`  HTTP port 
 `JWT_SECRET`  `dev-secret` JWT aláíró kulcs – éles környezetben kötelező cserélni 
 `DATABASE_URL`  `sqlite:./data/blog.sqlite` SQLite fájl (vagy `sqlite::memory:` teszthez)

## Telepítés és futtatás (Node.js-t szükséges telepíteni)

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

A [`.github/workflows/ci.yml`](.github/workflows/ci.yml) workflow Node 20-on futtatja `npm install` + `npm test` parancsokat minden push és pull request eseményre a `main` ágon

## Deploy

A repo gyökerében található [`render.yaml`](render.yaml) egy **Blueprint**: a Render automatikusan létrehoz egy ingyenes PostgreSQL-t és egy Web Service-t, a `DATABASE_URL`-t pedig automatikusan beköti a web service körynyezetébe

Blueprint részletek:
- **Régió**: mind a web service, mind a Postgres `frankfurt` — azonos régió szükséges, különben a Render belső DB hostneve (`dpg-…-a`) nem oldódik fel
- **Build parancs**: `npm install --omit=dev` (nincs commitolt `package-lock.json`, ezért nem `npm ci`).
- **Start parancs**: `npm start`.
- **Env változók**: `NODE_VERSION=24`, `JWT_SECRET` (auto-generált), `DATABASE_URL` (a Postgres connection stringje `fromDatabase` kötéssel)
- **Auto-deploy**: minden `main`-re történő push automatikusan új deploy-t indít

Telepítés első alkalommal:
1. Push a repót Github-ra
2. Render.com → **New → Blueprint** → select repó → Apply
3. Meg kell várni, amíg a Postgres `Available` állapotba ér, utána a web service magától elindul

A `src/config/db.js` a `DATABASE_URL` alapján dönt a dialektusról:
- `postgres://…` / `postgresql://…` → PostgreSQL, `ssl: { rejectUnauthorized: false }` (Render prod)
- `sqlite::memory:` → in-memory SQLite (tesztek)


Így **nincs két külön konfig** – lokálisan SQLite-tal fejleszthető, Renderen Postgres-sel fut, tesztben memóriában.

## Git előzmények (struktúra)

1. `chore: project scaffolding (package.json, .gitignore, env example)`
2. `feat: Sequelize setup and database models (User, Post, Comment)`
3. `feat: posts and comments routes with responsive EJS views`
4. `feat: JWT-based auth, protected routes, and JSON API`
5. `test: integration tests for posts API and auth flow`
6. `ci: GitHub Actions workflow and project documentation`
7. `feat: Render.com deploy with Postgres + auto-dialect switch in config`
8. `fix: use npm install (no lockfile committed) for Render build and CI`
9. `fix: pin Postgres region to frankfurt to match web service`
