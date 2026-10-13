namespace Songify.Application.Contracts.Auth;

public record RegisterRequest(string Email, string Username, string Password);