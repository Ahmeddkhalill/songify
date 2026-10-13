using Microsoft.EntityFrameworkCore;
using Songify.Application.Abstractions;
using Songify.Application.Contracts.Auth;
using Songify.Application.Errors;

namespace Songify.Application.Services;

public class AuthService(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator tokenGenerator) : IAuthService
{
    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim();

        var emailTaken = await context.Users
            .AnyAsync(u => u.Email == email, cancellationToken);

        if (emailTaken)
            return Result.Failure<AuthResponse>(UserErrors.DuplicateEmail);

        var usernameTaken = await context.Users
            .AnyAsync(u => u.Username.ToLower() == username.ToLower(), cancellationToken);

        if (usernameTaken)
            return Result.Failure<AuthResponse>(UserErrors.DuplicateUsername);

        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = passwordHasher.Hash(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(BuildResponse(user));
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await context.Users
            .SingleOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null)
            return Result.Failure<AuthResponse>(UserErrors.InvalidCredentials);

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
            return Result.Failure<AuthResponse>(UserErrors.InvalidCredentials);

        return Result.Success(BuildResponse(user));
    }

    private AuthResponse BuildResponse(User user)
    {
        var (token, expiresInSeconds) = tokenGenerator.Generate(user);

        return new AuthResponse(user.Id, user.Email, user.Username, token, expiresInSeconds);
    }
}