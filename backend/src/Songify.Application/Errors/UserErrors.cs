namespace Songify.Application.Errors;

public record UserErrors
{
    public static readonly Error DuplicateEmail =
        new("User.DuplicateEmail", "This email is already registered", StatusCodes.Status409Conflict);

    public static readonly Error InvalidCredentials =
        new("User.InvalidCredentials", "Invalid email or password", StatusCodes.Status401Unauthorized);

    public static readonly Error NotFound =
        new("User.NotFound", "User not found", StatusCodes.Status404NotFound);

    public static readonly Error Unauthorized =
        new("User.Unauthorized", "You must be signed in to perform this action", StatusCodes.Status401Unauthorized);

    public static readonly Error DuplicateUsername =
        new("User.DuplicateUsername", "This username is already taken", StatusCodes.Status409Conflict);
}