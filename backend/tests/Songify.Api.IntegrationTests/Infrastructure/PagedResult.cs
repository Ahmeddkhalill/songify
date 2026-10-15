namespace Songify.Api.IntegrationTests.Infrastructure;

public sealed record PagedResult<T>(
    List<T> Items,
    int PageNumber,
    int TotalPages,
    int TotalCount);
