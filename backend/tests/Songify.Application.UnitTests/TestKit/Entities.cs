namespace Songify.Application.UnitTests.TestKit;

public static class Entities
{
    public static User User(
        int id = 0,
        string email = "owner@songify.test",
        string username = "owner",
        string passwordHash = "stored-hash") =>
        new()
        {
            Id = id,
            Email = email,
            Username = username,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

    public static Song Song(
        int id = 0,
        string title = "Song",
        string artist = "Artist",
        string? album = null,
        int durationInSeconds = 200,
        int? createdByUserId = null) =>
        new()
        {
            Id = id,
            Title = title,
            Artist = artist,
            Album = album,
            DurationInSeconds = durationInSeconds,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

    public static Playlist Playlist(
        int id = 0,
        string name = "Playlist",
        int ownerId = 1,
        DateTime? updatedAt = null) =>
        new()
        {
            Id = id,
            Name = name,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = updatedAt ?? DateTime.UtcNow
        };

    public static PlaylistSong Entry(int playlistId, int songId, int position) =>
        new()
        {
            PlaylistId = playlistId,
            SongId = songId,
            Position = position,
            AddedAt = DateTime.UtcNow
        };
}
