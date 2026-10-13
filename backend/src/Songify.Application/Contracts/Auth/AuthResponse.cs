namespace Songify.Application.Contracts.Auth;

public record AuthResponse(
    int UserId,
    string Email,
    string Username,
    string Token,
    int ExpiresInSeconds);