namespace Songify.Application.UnitTests.Services;

public class PlaylistServiceTests
{
    private readonly TestDatabase _database = new();

    private PlaylistService CreateSut() => new(_database.NewContext());

    [Fact]
    public async Task CreateAsync_WhenCallerAlreadyHasThatName_IgnoringCase_ReturnsDuplicateName()
    {
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1, name: "Road Trip"));

        var result = await CreateSut().CreateAsync(1, new CreatePlaylistRequest("road trip", null));

        result.Error.Should().Be(PlaylistErrors.DuplicateName);
    }

    [Fact]
    public async Task CreateAsync_WhenAnotherUserHasThatName_Succeeds()
    {
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1, name: "Road Trip"));

        var result = await CreateSut().CreateAsync(2, new CreatePlaylistRequest("Road Trip", null));

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task GetByIdAsync_WhenCallerIsNotTheOwner_ReturnsNotOwner()
    {
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1));

        var result = await CreateSut().GetByIdAsync(2, 1);

        result.Error.Should().Be(PlaylistErrors.NotOwner);
    }

    [Fact]
    public async Task UpdateAsync_WhenCallerIsNotTheOwner_ReturnsNotOwner()
    {
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1));

        var result = await CreateSut().UpdateAsync(2, 1, new UpdatePlaylistRequest("Renamed", null));

        result.Error.Should().Be(PlaylistErrors.NotOwner);
    }

    [Fact]
    public async Task DeleteAsync_WhenCallerIsNotTheOwner_ReturnsNotOwner()
    {
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1));

        var result = await CreateSut().DeleteAsync(2, 1);

        result.Error.Should().Be(PlaylistErrors.NotOwner);
    }

    [Fact]
    public async Task GetByIdAsync_WhenPlaylistDoesNotExist_ReturnsNotFound()
    {
        var result = await CreateSut().GetByIdAsync(1, 999);

        result.Error.Should().Be(PlaylistErrors.NotFound);
    }

    [Fact]
    public async Task AddSongAsync_AppendsSongAtPositionEqualToPreviousCount()
    {
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1),
            Entities.Song(id: 10),
            Entities.Song(id: 20),
            Entities.Song(id: 30),
            Entities.Entry(1, 10, 0),
            Entities.Entry(1, 20, 1));

        await CreateSut().AddSongAsync(1, 1, new AddSongToPlaylistRequest(30));

        await using var context = _database.NewContext();
        var added = await context.PlaylistSongs.SingleAsync(ps => ps.PlaylistId == 1 && ps.SongId == 30);

        added.Position.Should().Be(2);
    }

    [Fact]
    public async Task AddSongAsync_WhenSongIsAlreadyInPlaylist_ReturnsSongAlreadyAdded()
    {
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1),
            Entities.Song(id: 10),
            Entities.Entry(1, 10, 0));

        var result = await CreateSut().AddSongAsync(1, 1, new AddSongToPlaylistRequest(10));

        result.Error.Should().Be(PlaylistErrors.SongAlreadyAdded);
    }

    [Fact]
    public async Task AddSongAsync_WhenSongDoesNotExist_ReturnsSongNotFound()
    {
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1));

        var result = await CreateSut().AddSongAsync(1, 1, new AddSongToPlaylistRequest(999));

        result.Error.Should().Be(SongErrors.NotFound);
    }

    [Fact]
    public async Task RemoveSongAsync_RenumbersRemainingPositionsWithoutGaps()
    {
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1),
            Entities.Song(id: 10),
            Entities.Song(id: 20),
            Entities.Song(id: 30),
            Entities.Entry(1, 10, 0),
            Entities.Entry(1, 20, 1),
            Entities.Entry(1, 30, 2));

        await CreateSut().RemoveSongAsync(1, 1, 20);

        await using var context = _database.NewContext();
        var layout = await context.PlaylistSongs
            .Where(ps => ps.PlaylistId == 1)
            .OrderBy(ps => ps.Position)
            .Select(ps => $"{ps.SongId}:{ps.Position}")
            .ToListAsync();

        layout.Should().Equal("10:0", "30:1");
    }

    [Fact]
    public async Task ReorderSongAsync_MovesSongAndRenumbersEverything()
    {
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1),
            Entities.Song(id: 10),
            Entities.Song(id: 20),
            Entities.Song(id: 30),
            Entities.Entry(1, 10, 0),
            Entities.Entry(1, 20, 1),
            Entities.Entry(1, 30, 2));

        await CreateSut().ReorderSongAsync(1, 1, 10, new ReorderSongRequest(2));

        await using var context = _database.NewContext();
        var layout = await context.PlaylistSongs
            .Where(ps => ps.PlaylistId == 1)
            .OrderBy(ps => ps.Position)
            .Select(ps => $"{ps.SongId}:{ps.Position}")
            .ToListAsync();

        layout.Should().Equal("20:0", "30:1", "10:2");
    }

    [Fact]
    public async Task ReorderSongAsync_WhenPositionIsOutOfRange_ReturnsInvalidPosition()
    {
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1),
            Entities.Song(id: 10),
            Entities.Song(id: 20),
            Entities.Entry(1, 10, 0),
            Entities.Entry(1, 20, 1));

        var result = await CreateSut().ReorderSongAsync(1, 1, 10, new ReorderSongRequest(2));

        result.Error.Should().Be(PlaylistErrors.InvalidPosition);
    }

    [Fact]
    public async Task UpdateAsync_MovesUpdatedAtForward()
    {
        var before = DateTime.UtcNow.AddMinutes(-30);
        await _database.SeedAsync(Entities.Playlist(id: 1, ownerId: 1, name: "Old", updatedAt: before));

        await CreateSut().UpdateAsync(1, 1, new UpdatePlaylistRequest("New", null));

        await using var context = _database.NewContext();
        var playlist = await context.Playlists.SingleAsync();

        playlist.UpdatedAt.Should().BeAfter(before);
    }

    [Fact]
    public async Task AddSongAsync_MovesUpdatedAtForward()
    {
        var before = DateTime.UtcNow.AddMinutes(-30);
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1, updatedAt: before),
            Entities.Song(id: 10));

        await CreateSut().AddSongAsync(1, 1, new AddSongToPlaylistRequest(10));

        await using var context = _database.NewContext();
        var playlist = await context.Playlists.SingleAsync();

        playlist.UpdatedAt.Should().BeAfter(before);
    }

    [Fact]
    public async Task RemoveSongAsync_MovesUpdatedAtForward()
    {
        var before = DateTime.UtcNow.AddMinutes(-30);
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1, updatedAt: before),
            Entities.Song(id: 10),
            Entities.Entry(1, 10, 0));

        await CreateSut().RemoveSongAsync(1, 1, 10);

        await using var context = _database.NewContext();
        var playlist = await context.Playlists.SingleAsync();

        playlist.UpdatedAt.Should().BeAfter(before);
    }

    [Fact]
    public async Task ReorderSongAsync_MovesUpdatedAtForward()
    {
        var before = DateTime.UtcNow.AddMinutes(-30);
        await _database.SeedAsync(
            Entities.Playlist(id: 1, ownerId: 1, updatedAt: before),
            Entities.Song(id: 10),
            Entities.Song(id: 20),
            Entities.Entry(1, 10, 0),
            Entities.Entry(1, 20, 1));

        await CreateSut().ReorderSongAsync(1, 1, 10, new ReorderSongRequest(1));

        await using var context = _database.NewContext();
        var playlist = await context.Playlists.SingleAsync();

        playlist.UpdatedAt.Should().BeAfter(before);
    }
}
