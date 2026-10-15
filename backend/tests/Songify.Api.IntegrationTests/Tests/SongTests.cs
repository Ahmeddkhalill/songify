namespace Songify.Api.IntegrationTests.Tests;

public class SongTests(SongifyApiFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task Search_ByTitle_IsCaseInsensitive()
    {
        var user = await RegisterUserAsync();

        var page = (await user.Client.GetFromJsonAsync<PagedResult<SongResponse>>("/api/songs?searchValue=BOHEMIAN&pageSize=50"))!;

        page.Items.Should().NotBeEmpty();
        page.Items.Should().OnlyContain(s =>
            s.Title.ToLower().Contains("bohemian") || s.Artist.ToLower().Contains("bohemian"));
        page.Items.Should().Contain(s => s.Title == "Bohemian Rhapsody");
    }

    [Fact]
    public async Task Search_ByArtist_IsCaseInsensitive()
    {
        var user = await RegisterUserAsync();

        var page = (await user.Client.GetFromJsonAsync<PagedResult<SongResponse>>("/api/songs?searchValue=queen&pageSize=50"))!;

        page.Items.Should().NotBeEmpty();
        page.Items.Should().OnlyContain(s =>
            s.Title.ToLower().Contains("queen") || s.Artist.ToLower().Contains("queen"));
        page.Items.Should().Contain(s => s.Artist == "Queen");
    }

    [Fact]
    public async Task Search_Paging_ReturnsPageSizeAndTotals()
    {
        var user = await RegisterUserAsync();

        var firstPage = (await user.Client.GetFromJsonAsync<PagedResult<SongResponse>>("/api/songs?pageNumber=1&pageSize=5"))!;

        firstPage.Items.Should().HaveCount(5);
        firstPage.PageNumber.Should().Be(1);
        firstPage.TotalCount.Should().Be(20);
        firstPage.TotalPages.Should().Be(4);
    }

    [Fact]
    public async Task UpdateCatalogSong_ReturnsForbidden()
    {
        var user = await RegisterUserAsync();

        var response = await user.Client.PutAsJsonAsync("/api/songs/1",
            new UpdateSongRequest("Hacked", "Nobody", null, 123, null, null));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var problem = await ReadProblemAsync(response);
        problem.GetProperty("errors").GetProperty("code").GetString().Should().Be("Song.CatalogImmutable");
    }

    [Fact]
    public async Task DeleteCatalogSong_ReturnsForbidden()
    {
        var user = await RegisterUserAsync();

        var response = await user.Client.DeleteAsync("/api/songs/1");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var problem = await ReadProblemAsync(response);
        problem.GetProperty("errors").GetProperty("code").GetString().Should().Be("Song.CatalogImmutable");
    }

    [Fact]
    public async Task User_CanCreateUpdateAndDeleteOwnSong()
    {
        var user = await RegisterUserAsync();

        var created = await user.Client.PostAsJsonAsync("/api/songs",
            new CreateSongRequest("My Track", "Me", "My Album", 210, null, null));
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var song = (await created.Content.ReadFromJsonAsync<SongResponse>())!;
        song.Id.Should().BeGreaterThan(0);

        var updated = await user.Client.PutAsJsonAsync($"/api/songs/{song.Id}",
            new UpdateSongRequest("My Track v2", "Me", "My Album", 215, null, null));
        updated.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var deleted = await user.Client.DeleteAsync($"/api/songs/{song.Id}");
        deleted.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fetch = await user.Client.GetAsync($"/api/songs/{song.Id}");
        fetch.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task OtherUser_CannotModifyForeignSong()
    {
        var owner = await RegisterUserAsync();
        var intruder = await RegisterUserAsync();

        var created = await owner.Client.PostAsJsonAsync("/api/songs",
            new CreateSongRequest("Owned", "Owner", null, 180, null, null));
        var song = (await created.Content.ReadFromJsonAsync<SongResponse>())!;

        var update = await intruder.Client.PutAsJsonAsync($"/api/songs/{song.Id}",
            new UpdateSongRequest("Stolen", "Thief", null, 180, null, null));
        var delete = await intruder.Client.DeleteAsync($"/api/songs/{song.Id}");

        update.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        delete.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var problem = await ReadProblemAsync(update);
        problem.GetProperty("errors").GetProperty("code").GetString().Should().Be("Song.NotOwner");
    }
}
