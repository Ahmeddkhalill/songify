using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Songify.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace Songify.Api.IntegrationTests.Infrastructure;

public sealed class SongifyApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }

    public async Task ResetAsync()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await context.Database.ExecuteSqlRawAsync(
            "TRUNCATE \"PlaylistSongs\", \"Playlists\", \"Songs\", \"Users\" RESTART IDENTITY CASCADE");

        await ApplicationDbSeeder.SeedAsync(context);
    }

    async Task IAsyncLifetime.InitializeAsync()
    {
        await _container.StartAsync();

        Environment.SetEnvironmentVariable("ConnectionStrings__Default", _container.GetConnectionString());
        Environment.SetEnvironmentVariable("Jwt__Issuer", "Songify.Api");
        Environment.SetEnvironmentVariable("Jwt__Audience", "Songify.Client");
        Environment.SetEnvironmentVariable("Jwt__Key", "integration-tests-signing-key-value-0123456789");
        Environment.SetEnvironmentVariable("Jwt__ExpiryMinutes", "120");

        _ = Services;
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        await _container.DisposeAsync();

        Environment.SetEnvironmentVariable("ConnectionStrings__Default", null);
        Environment.SetEnvironmentVariable("Jwt__Issuer", null);
        Environment.SetEnvironmentVariable("Jwt__Audience", null);
        Environment.SetEnvironmentVariable("Jwt__Key", null);
        Environment.SetEnvironmentVariable("Jwt__ExpiryMinutes", null);
    }
}
