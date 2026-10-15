namespace Songify.Api.IntegrationTests.Tests;

public class AuthTests(SongifyApiFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task Register_WithValidBody_ReturnsOkAndUsableToken()
    {
        var client = CreateClient();
        var request = new RegisterRequest("newcomer@songify.test", "newcomer", ValidPassword);

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
        auth.Token.Should().NotBeNullOrWhiteSpace();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        var authorized = await client.GetAsync("/api/playlists");

        authorized.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("taken@songify.test", "firstone", ValidPassword));

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("taken@songify.test", "secondone", ValidPassword));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var problem = await ReadProblemAsync(response);
        problem.GetProperty("errors").GetProperty("code").GetString().Should().Be("User.DuplicateEmail");
    }

    [Fact]
    public async Task Register_WithWeakPassword_ReturnsBadRequestWithFieldErrors()
    {
        var client = CreateClient();
        var request = new RegisterRequest("weakpass@songify.test", "weakling", "weak");

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problem = await ReadProblemAsync(response);
        var errors = problem.GetProperty("errors");

        errors.EnumerateObject()
            .Select(p => p.Name.ToLowerInvariant())
            .Should().Contain("password");
    }

    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsToken()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("member@songify.test", "memberone", ValidPassword));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("member@songify.test", ValidPassword));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
        auth.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("member@songify.test", "memberone", ValidPassword));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("member@songify.test", "Wr0ng$pass!"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
