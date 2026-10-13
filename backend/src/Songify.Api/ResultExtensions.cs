using Microsoft.AspNetCore.Mvc;
using Songify.Application.Abstractions;

namespace Songify.Api.Extensions;

public static class ResultExtensions
{
    public static ObjectResult ToProblem(this Result result)
    {
        if (result.IsSuccess)
            throw new InvalidOperationException("Cannot convert success result to a problem");

        var problem = Results.Problem(statusCode: result.Error.StatusCode);
        var problemDetails = problem.GetType().GetProperty(nameof(ProblemDetails))!.GetValue(problem) as ProblemDetails;

        problemDetails!.Extensions["errors"] = new
        {
            code = result.Error.Code,
            message = result.Error.Description
        };

        return new ObjectResult(problemDetails)
        {
            StatusCode = result.Error.StatusCode
        };
    }
}