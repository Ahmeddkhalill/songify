namespace Songify.Application.Contracts.Songs;

internal static class SongUrl
{
    public static bool IsValid(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
