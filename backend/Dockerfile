FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/Songify.Api/Songify.Api.csproj src/Songify.Api/
COPY src/Songify.Application/Songify.Application.csproj src/Songify.Application/
COPY src/Songify.Infrastructure/Songify.Infrastructure.csproj src/Songify.Infrastructure/
COPY src/Songify.Domain/Songify.Domain.csproj src/Songify.Domain/
RUN dotnet restore src/Songify.Api/Songify.Api.csproj

COPY . .
RUN dotnet publish src/Songify.Api/Songify.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["sh", "-c", "exec dotnet Songify.Api.dll --urls=http://+:${PORT:-8080}"]
