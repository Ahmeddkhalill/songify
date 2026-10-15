namespace Songify.Application.UnitTests.Services;

public class SongServiceTests
{
    private readonly TestDatabase _database = new();

    private static readonly UpdateSongRequest UpdateRequest =
        new("New Title", "New Artist", "New Album", 123, null, null);

    private SongService CreateSut() => new(_database.NewContext());

    [Fact]
    public async Task SearchAsync_MatchesTitle_CaseInsensitively()
    {
        await _database.SeedAsync(
            Entities.Song(id: 1, title: "Bohemian Rhapsody", artist: "Queen"),
            Entities.Song(id: 2, title: "Imagine", artist: "John Lennon"));

        var result = await CreateSut().SearchAsync(new RequestFilters { SearchValue = "bohemian" });

        result.Value.Items.Should().ContainSingle(s => s.Title == "Bohemian Rhapsody");
    }

    [Fact]
    public async Task SearchAsync_MatchesArtist_CaseInsensitively()
    {
        await _database.SeedAsync(
            Entities.Song(id: 1, title: "Bohemian Rhapsody", artist: "Queen"),
            Entities.Song(id: 2, title: "Imagine", artist: "John Lennon"));

        var result = await CreateSut().SearchAsync(new RequestFilters { SearchValue = "QUEEN" });

        result.Value.Items.Should().ContainSingle(s => s.Artist == "Queen");
    }

    [Fact]
    public async Task SearchAsync_WithNoTerm_ReturnsTheWholeCatalog()
    {
        await _database.SeedAsync(
            Entities.Song(id: 1),
            Entities.Song(id: 2),
            Entities.Song(id: 3));

        var result = await CreateSut().SearchAsync(new RequestFilters { SearchValue = null, PageSize = 50 });

        result.Value.Items.Should().HaveCount(3);
    }

    [Fact]
    public async Task SearchAsync_WhenPageSizeExceedsMaximum_ClampsToMaximum()
    {
        var songs = Enumerable.Range(1, 51)
            .Select(i => (object)Entities.Song(id: i, title: $"Song {i:D2}"))
            .ToArray();
        await _database.SeedAsync(songs);

        var result = await CreateSut().SearchAsync(new RequestFilters { PageNumber = 1, PageSize = 100 });

        result.Value.Items.Should().HaveCount(50);
    }

    [Fact]
    public async Task SearchAsync_WhenPageNumberIsBelowOne_TreatsItAsOne()
    {
        await _database.SeedAsync(Entities.Song(id: 1));

        var result = await CreateSut().SearchAsync(new RequestFilters { PageNumber = 0 });

        result.Value.PageNumber.Should().Be(1);
    }

    [Fact]
    public async Task UpdateAsync_WhenSongIsFromCatalog_ReturnsCatalogSongImmutable()
    {
        await _database.SeedAsync(Entities.Song(id: 1, createdByUserId: null));

        var result = await CreateSut().UpdateAsync(1, 1, UpdateRequest);

        result.Error.Should().Be(SongErrors.CatalogSongImmutable);
    }

    [Fact]
    public async Task DeleteAsync_WhenSongIsFromCatalog_ReturnsCatalogSongImmutable()
    {
        await _database.SeedAsync(Entities.Song(id: 1, createdByUserId: null));

        var result = await CreateSut().DeleteAsync(1, 1);

        result.Error.Should().Be(SongErrors.CatalogSongImmutable);
    }

    [Fact]
    public async Task UpdateAsync_WhenSongBelongsToAnotherUser_ReturnsNotOwner()
    {
        await _database.SeedAsync(Entities.Song(id: 1, createdByUserId: 2));

        var result = await CreateSut().UpdateAsync(1, 1, UpdateRequest);

        result.Error.Should().Be(SongErrors.NotOwner);
    }

    [Fact]
    public async Task DeleteAsync_WhenSongBelongsToAnotherUser_ReturnsNotOwner()
    {
        await _database.SeedAsync(Entities.Song(id: 1, createdByUserId: 2));

        var result = await CreateSut().DeleteAsync(1, 1);

        result.Error.Should().Be(SongErrors.NotOwner);
    }

    [Fact]
    public async Task UpdateAsync_WhenCallerCreatedTheSong_AppliesTheChanges()
    {
        await _database.SeedAsync(Entities.Song(id: 1, title: "Old Title", createdByUserId: 1));

        await CreateSut().UpdateAsync(1, 1, UpdateRequest);

        await using var context = _database.NewContext();
        var song = await context.Songs.SingleAsync();

        song.Title.Should().Be("New Title");
    }

    [Fact]
    public async Task DeleteAsync_WhenCallerCreatedTheSong_RemovesIt()
    {
        await _database.SeedAsync(Entities.Song(id: 1, createdByUserId: 1));

        await CreateSut().DeleteAsync(1, 1);

        await using var context = _database.NewContext();
        var exists = await context.Songs.AnyAsync();

        exists.Should().BeFalse();
    }
}
