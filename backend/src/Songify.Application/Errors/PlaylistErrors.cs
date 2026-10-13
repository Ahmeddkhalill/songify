namespace Songify.Application.Errors;

public record PlaylistErrors
{
    public static readonly Error NotFound =
        new("Playlist.NotFound", "Playlist not found", StatusCodes.Status404NotFound);

    public static readonly Error DuplicateName =
        new("Playlist.DuplicateName", "You already have a playlist with this name", StatusCodes.Status409Conflict);

    public static readonly Error NotOwner =
        new("Playlist.NotOwner", "You do not have access to this playlist", StatusCodes.Status403Forbidden);

    public static readonly Error SongAlreadyAdded =
        new("Playlist.SongAlreadyAdded", "This song is already in the playlist", StatusCodes.Status409Conflict);

    public static readonly Error SongNotInPlaylist =
        new("Playlist.SongNotInPlaylist", "This song is not in the playlist", StatusCodes.Status404NotFound);

    public static readonly Error InvalidPosition =
        new("Playlist.InvalidPosition", "The requested position is out of range", StatusCodes.Status400BadRequest);
}