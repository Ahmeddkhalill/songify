namespace Songify.Api.IntegrationTests.Tests;

public class ErrorShapeTests(SongifyApiFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task BusinessFailure_ReturnsProblemDetailsWithCodeAndMessage()
    {
        var client = CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("clash@songify.test", "firstclash", ValidPassword));

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("clash@songify.test", "secondclash", ValidPassword));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var problem = await ReadProblemAsync(response);
        problem.GetProperty("status").GetInt32().Should().Be(409);

        var errors = problem.GetProperty("errors");
        errors.GetProperty("code").GetString().Should().Be("User.DuplicateEmail");
        errors.GetProperty("message").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ValidationFailure_ReturnsFieldKeyedShape()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("not-an-email", "x", "weak"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var problem = await ReadProblemAsync(response);
        problem.GetProperty("status").GetInt32().Should().Be(400);

        var errors = problem.GetProperty("errors");
        errors.ValueKind.Should().Be(JsonValueKind.Object);
        errors.EnumerateObject().Should().NotBeEmpty();
        errors.EnumerateObject().Should().OnlyContain(p => p.Value.ValueKind == JsonValueKind.Array);
    }
}
