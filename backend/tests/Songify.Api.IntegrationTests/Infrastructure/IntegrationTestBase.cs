namespace Songify.Api.IntegrationTests.Infrastructure;

[Collection(IntegrationTestCollection.Name)]
public abstract class IntegrationTestBase(SongifyApiFactory factory) : IAsyncLifetime
{
    protected const string ValidPassword = "Pa$$w0rd!";

    protected SongifyApiFactory Factory { get; } = factory;

    public Task InitializeAsync() => Factory.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    protected HttpClient CreateClient() => Factory.CreateClient();

    protected async Task<AuthenticatedUser> RegisterUserAsync()
    {
        var client = CreateClient();

        var request = new RegisterRequest(
            $"user-{Guid.NewGuid():N}@songify.test",
            $"u{Guid.NewGuid():N}"[..20],
            ValidPassword);

        var response = await client.PostAsJsonAsync("/api/auth/register", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);

        return new AuthenticatedUser(client, auth);
    }

    protected static async Task<JsonElement> ReadProblemAsync(HttpResponseMessage response)
    {
        var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        return document.RootElement.Clone();
    }
}

public sealed record AuthenticatedUser(HttpClient Client, AuthResponse Auth);
