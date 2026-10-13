namespace Songify.Application.Errors;

public record SongErrors
{
    public static readonly Error NotFound =
        new("Song.NotFound", "Song not found", StatusCodes.Status404NotFound);

    public static readonly Error NotOwner =
        new("Song.NotOwner", "You can only modify songs you added", StatusCodes.Status403Forbidden);

    public static readonly Error CatalogSongImmutable =
        new("Song.CatalogImmutable", "Songs from the shared catalog cannot be modified", StatusCodes.Status403Forbidden);

    public static readonly Error InvalidDuration =
        new("Song.InvalidDuration", "Duration must be greater than zero", StatusCodes.Status400BadRequest);
}