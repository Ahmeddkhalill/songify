namespace Songify.Application.Abstractions;

public interface IJwtTokenGenerator
{
    (string Token, int ExpiresInSeconds) Generate(User user);
}