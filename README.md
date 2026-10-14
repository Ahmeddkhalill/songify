# Songify

Full-stack playlist manager. .NET 10 backend, React + TypeScript + Vite frontend,
PostgreSQL. See [CLAUDE.md](CLAUDE.md) for architecture and conventions.

## Local development

```
docker compose up -d                      postgres on 5432
cd backend && dotnet run --project src/Songify.Api
cd frontend && npm install && npm run dev
```

Swagger is served at the API root.

## Deployment

The API and database run on Render + Neon, the frontend on Vercel.

### Backend (Render)

Deploys from `backend/Dockerfile` (multi-stage build, runs as a non-root user,
listens on the `PORT` Render injects). The following must be set as environment
variables — nothing secret ships in `appsettings.json`, and the app fails at
startup with a named error if either is missing:

| Variable                   | Example                                             |
| -------------------------- | --------------------------------------------------- |
| `ConnectionStrings__Default` | `Host=...neon.tech;Database=songify;Username=...;Password=...;SSL Mode=Require` |
| `Jwt__Key`                 | a long random signing secret                         |
| `Jwt__Issuer`              | `Songify.Api` (optional; defaults from appsettings)  |
| `Jwt__Audience`            | `Songify.Client` (optional)                          |
| `Cors__AllowedOrigins__0`  | the deployed frontend origin, e.g. `https://songify.vercel.app` |

`Cors:AllowedOrigins` is read as an array; add `Cors__AllowedOrigins__1`, etc.
for more origins. Unset, it falls back to `http://localhost:5173`.

Render polls `/health`, which is anonymous.

Build the image locally with:

```
docker build -t songify-api ./backend
```

### Frontend (Vercel)

`frontend/vercel.json` rewrites every path to `index.html` so client-side routes
survive a hard refresh.

### Swagger in production

Swagger is intentionally left enabled in production so the deployed API can be
exercised directly during review. In a real release it would be restricted to
development only (as it originally was in `Program.cs`).
