export const BLOCK_OPEN: string = "[";
export const BLOCK_CLOSE: string = "]";

export function IsAlpha(char: string): boolean
{
    return ("a" <= char && char <= "z") || ("A" <= char && char <= "Z");
}

export function IsNumeric(char: string): boolean
{
    return ("0" <= char && char <= "9");
}

export function IsValidConfigValueChar(char: string)
{
    return IsAlphaNum(char) || char === "-" || char === "," || char === "%" || char === "." || char === "/";
}

export function IsAlphaNum(char: string): boolean
{
    return IsAlpha(char) || IsNumeric(char);
}

export function IsWhitespace(char: string): boolean
{
    return char === " " || char == "\t";
}

export function IsLineCommentMarker(char: string)
{
    return char === "#";
}

export function IsLineEnding(char: string): boolean
{
    return char === "\r" || char === "\n";
}

export function IsEOF(char: string | undefined): boolean
{
    return char === undefined;
}


export function log(...args: any[]): void
{
    if (false)
    {
        console.log(...args);
    }
}