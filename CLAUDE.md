# Songify

Full-stack playlist manager. .NET 10 backend, React + TypeScript + Vite frontend,
PostgreSQL via Docker. Monorepo: `backend/`, `frontend/`, `docs/`, `tools/`.

## Hard rules

- Never write code comments. The code must read on its own.
- Never add `[ProducesResponseType]` or other documentation attributes.
- Never add a package, library, or pattern that is not already in use without
  asking first.
- Never add features that were not asked for.
- Explain what you changed and why, briefly. Do not narrate every step.

## Backend architecture

Clean Architecture, four projects under `backend/src/`:

```
Songify.Domain          knows nothing
Songify.Application     knows Domain
Songify.Infrastructure  knows Application
Songify.Api             knows Application + Infrastructure
```

The missing arrow is deliberate: Application must never reference Infrastructure.

### Data access

Services take `IApplicationDbContext` (defined in
`Application/Abstractions/IApplicationDbContext.cs`, implemented by
`ApplicationDbContext`). No repository or unit-of-work layer — EF Core already
provides both. Write EF queries directly in services.

### Entities

POCOs in `Domain/Entities/`, `int` primary keys, `{ get; set; }` properties,
no behaviour. All business logic lives in services.

### Error handling

Result pattern, not exceptions, for expected failures.

- `Application/Abstractions/Result.cs` and `Error.cs`
- `Application/Errors/` holds one static catalog per entity
  (`UserErrors`, `PlaylistErrors`, `SongErrors`), each entry carrying an HTTP
  status code
- `Api/Extensions/ResultExtensions.cs` has `ToProblem()`, which converts a
  failed Result into `ProblemDetails`

Services return `Result<T>`. Controllers do:

```csharp
return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
```

### Services

`Application/Services/` — one interface plus implementation per area
(`IAuthService` / `AuthService`). Registered in
`Application/DependencyInjection.cs`.

### Validation

Two kinds, kept apart:

- Structural (format, length, required) → FluentValidation validators next to
  their request record in `Application/Contracts/<Area>/`. Runs automatically
  via SharpGrip auto-validation before the action is hit.
- Semantic (uniqueness, ownership, existence) → inside the service, returning
  `Result.Failure(SomeErrors.X)`.

### Controllers

Thin. No logic, no try/catch, no validation. Call the service, translate the
Result. Primary constructors. `[Authorize]` on anything user-scoped, and read
the caller with `User.GetUserId()` from
`Api/Extensions/ClaimsPrincipalExtensions.cs`.

### Conventions

- Primary constructors everywhere: `public class Foo(IBar bar) : IFoo`
- `record` for DTOs, positional parameters
- Request and response records live in `Application/Contracts/<Area>/`
- `CancellationToken` as the last parameter on every async method, passed through
- `GlobalUsings.cs` per project for genuinely repeated usings only
- Service registration split per layer: `AddApplication()`, `AddInfrastructure()`,
  `AddApiServices()`. Middleware stays visible in `Program.cs` because its order
  matters.

### Persistence

- EF Core Code First. One `IEntityTypeConfiguration<T>` per entity in
  `Infrastructure/Persistence/EntitiesConfigurations/`, picked up by
  `ApplyConfigurationsFromAssembly`.
- Migrations go in `Infrastructure/Persistence/Migrations/`.
- Always read a generated migration before applying it. Watch for `DropColumn`
  where a rename was intended.
- Npgsql rejects any `DateTime` whose `Kind` is not `Utc`.

### Ownership

A playlist belongs to one user. Every read and write checks `OwnerId` against
the caller and returns `PlaylistErrors.NotOwner` (403) on mismatch.
Catalog songs (`CreatedByUserId is null`) cannot be edited or deleted by anyone.

## Frontend

React + TypeScript + Vite in `frontend/`.
(Not started yet — ask before choosing libraries.)

## Git

- Conventional Commits: `feat(scope):`, `fix:`, `chore:`, `refactor:`, `test:`,
  `docs:`
- One branch per feature: `feature/playlists`, `feature/tests`
- Merged into `main` through a pull request whose description explains the
  decisions, not just the changes
- Small commits, one concern each
- Never commit directly to `main`

## Running

```
docker compose up -d                      postgres on 5432
cd backend && dotnet run --project src/Songify.Api
```

Swagger is at the API root in development.