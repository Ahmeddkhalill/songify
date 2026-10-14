using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Songify.Application.Services;

namespace Songify.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPlaylistService, PlaylistService>();
        services.AddScoped<ISongService, SongService>();

        return services;
    }
}