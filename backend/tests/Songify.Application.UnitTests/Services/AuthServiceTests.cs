namespace Songify.Application.UnitTests.Services;

public class AuthServiceTests
{
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtTokenGenerator _tokenGenerator = Substitute.For<IJwtTokenGenerator>();
    private readonly TestDatabase _database = new();

    public AuthServiceTests()
    {
        _passwordHasher.Hash(Arg.Any<string>()).Returns("hashed-password");
        _tokenGenerator.Generate(Arg.Any<User>()).Returns(("jwt-token", 3600));
    }

    private AuthService CreateSut() => new(_database.NewContext(), _passwordHasher, _tokenGenerator);

    [Fact]
    public async Task RegisterAsync_WithFreshEmailAndUsername_ReturnsToken()
    {
        var result = await CreateSut().RegisterAsync(new RegisterRequest("new@songify.test", "newcomer", "Pa$$w0rd"));

        result.Value.Token.Should().Be("jwt-token");
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ReturnsDuplicateEmail()
    {
        await _database.SeedAsync(Entities.User(email: "taken@songify.test", username: "existing"));

        var result = await CreateSut().RegisterAsync(new RegisterRequest("taken@songify.test", "fresh", "Pa$$w0rd"));

        result.Error.Should().Be(UserErrors.DuplicateEmail);
    }

    [Fact]
    public async Task RegisterAsync_WhenUsernameExistsDifferingOnlyInCase_ReturnsDuplicateUsername()
    {
        await _database.SeedAsync(Entities.User(email: "alice@songify.test", username: "Alice"));

        var result = await CreateSut().RegisterAsync(new RegisterRequest("new@songify.test", "alice", "Pa$$w0rd"));

        result.Error.Should().Be(UserErrors.DuplicateUsername);
    }

    [Fact]
    public async Task RegisterAsync_StoresHashedPassword_NeverThePlainOne()
    {
        await CreateSut().RegisterAsync(new RegisterRequest("new@songify.test", "newcomer", "Pa$$w0rd"));

        await using var context = _database.NewContext();
        var stored = await context.Users.SingleAsync();

        stored.PasswordHash.Should().Be("hashed-password").And.NotBe("Pa$$w0rd");
    }

    [Fact]
    public async Task RegisterAsync_NormalisesEmailToTrimmedLowercase()
    {
        await CreateSut().RegisterAsync(new RegisterRequest("  Mixed@Songify.TEST  ", "newcomer", "Pa$$w0rd"));

        await using var context = _database.NewContext();
        var stored = await context.Users.SingleAsync();

        stored.Email.Should().Be("mixed@songify.test");
    }

    [Fact]
    public async Task LoginAsync_WithCorrectCredentials_ReturnsToken()
    {
        await _database.SeedAsync(Entities.User(email: "member@songify.test", passwordHash: "stored-hash"));
        _passwordHasher.Verify("Pa$$w0rd", "stored-hash").Returns(true);

        var result = await CreateSut().LoginAsync(new LoginRequest("member@songify.test", "Pa$$w0rd"));

        result.Value.Token.Should().Be("jwt-token");
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ReturnsInvalidCredentials()
    {
        await _database.SeedAsync(Entities.User(email: "member@songify.test", passwordHash: "stored-hash"));
        _passwordHasher.Verify(Arg.Any<string>(), Arg.Any<string>()).Returns(false);

        var result = await CreateSut().LoginAsync(new LoginRequest("member@songify.test", "wrong"));

        result.Error.Should().Be(UserErrors.InvalidCredentials);
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_ReturnsTheSameInvalidCredentials()
    {
        var result = await CreateSut().LoginAsync(new LoginRequest("stranger@songify.test", "Pa$$w0rd"));

        result.Error.Should().Be(UserErrors.InvalidCredentials);
    }
}
