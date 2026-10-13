using Microsoft.AspNetCore.Identity;
using Songify.Application.Abstractions;

namespace Songify.Infrastructure.Authentication;

public class IdentityPasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) =>
        _hasher.HashPassword(new User(), password);

    public bool Verify(string password, string passwordHash) =>
        _hasher.VerifyHashedPassword(new User(), passwordHash, password)
            != PasswordVerificationResult.Failed;
}