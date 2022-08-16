export function IsNullOrWhitespace(input?: string)
{
    if (input === undefined || input === null) return true;
    return !(/[^\s]+/.test(input));
}