const BLOCK_OPEN: string = "[";
const BLOCK_CLOSE: string = "]";

function IsAlpha(char: string): boolean {
    return ("a" <= char && char <= "z") || ("A" <= char && char <= "Z");
}

function IsNumeric(char: string): boolean {
    return ("0" <= char && char <= "9");
}
function IsValidConfigValueChar(char: string) {
    return IsAlphaNum(char) || char === "-" || char === "," || char === "%" || char === "." || char === "/";
}

function IsAlphaNum(char: string): boolean {
    return IsAlpha(char) || IsNumeric(char);
}

function IsWhitespace(char: string): boolean {
    return char === " " || char == "\t";
}

function IsLineCommentMarker(char: string)
{
    return char === "#";
}

function IsLineEnding(char: string): boolean {
    return char === "\r" || char === "\n";
}

function IsEOF(char: string | undefined): boolean {
    return char === undefined;
}

function log(...args: any[]): void {
    if (false) {
        console.log(...args);
    }
}

const lexer = function (str: string) {
    let line: number = 1;
    let column: number = 1;
    let i: number = 0;
    let char: string = str[i];

    function next(): void {
        i++;
        column++;
        char = str[i];
    }

    function peekNext(): string {
        return str[i + 1];
    }

    function position(): TokenLocation {
        return { i, line, column };
    }

    function whitespace(): null {
        log("Checking char for whitespace, Char", char, "i", i);
        while (IsWhitespace(char)) next();
        log("Discarded whitespace. Char:", char, "i:", i)
        return null;
    }
    
    function lineComment(): null {
        if (!IsLineCommentMarker(char)) return null;
        while (!IsLineEnding(char)) next(); // Ignore line comments
        while (IsLineEnding(char)) next(); // Seek to start of next line
        line++;
        column =1;
        if (IsLineCommentMarker(char)) return lineComment(); // If the next line is a comment too, recurse
        return null;
    }

    function endOfLine(): EOLToken {
        log("Checking for endOfLine char: ", char, "IsLineEnding", IsLineEnding(char));
        if (!IsLineEnding(char)) return null;
        log("CRLF detected i", i, "char: ", char);
        const start = position();
        if (char === "\r") next();
        if (char === "\n") {
            const end = position();
            next();
            line++;
            column = 1;
            return {
                type: "EOL",
                start,
                end
            };

        }

    }


    function endOfFile(): EOFToken | null {
        if (char === undefined) {
            next();
            const start = position();
            const end = position();
            return {
                type: "EOF",
                start,
                end
            };
        }

        return null;
    }

    function configKey(): ConfigKeyValueToken {
        let value = ""
        const start = position();
        while (char !== "=") {
            value += char;
            next();
        }
        const end = position();
        return {
            type: "ConfigKey",
            value,
            start,
            end
        };


    }

    function configValue(): ConfigKeyValueToken {
        if (char !== "=") return null;
        let value = "";
        let quoteOpen = false;
        const start = position();
        //@ts-expect-error
        while (char !== `]`) {
            //@ts-expect-error
            if (char === `"`) {
                quoteOpen = !quoteOpen;
            }
            else {

                log(`configValue char: '${char}`, "isWhitespace", IsWhitespace(char), "isAlphaNum", IsAlphaNum(char))
                if ((IsWhitespace(char) && quoteOpen) ||
                    (IsValidConfigValueChar(char))) {
                    value += char
                }

                if (IsWhitespace(char) && !quoteOpen) {
                    break;
                }
            }

            next();

        }
        const end = position();

        return {
            type: "ConfigValue",
            value,
            start,
            end
        }
    }

    function configValueSlide(): ConfigKeyValueToken {
        if (char !== "=") return null;
        let value = "";
        let quoteOpen = false;
        const start = position();
        while (!IsLineEnding(char)) {
            // @ts-expect-error
            if (char === "#") {
                // Ignore extranous hash for hex colors
                next();
            }
            else 
            {
                if ((IsWhitespace(char) && quoteOpen) || IsValidConfigValueChar(char)) {
                    value += char
                    next();
                    continue;
                }

                if (IsWhitespace(char) && !quoteOpen) {
                    break;
                }
            }

            next();
        }
        const end = position();

        return {
            type: "ConfigValue",
            value,
            start,
            end
        }
    }

    function block(): BlockToken | null {
        if (char !== BLOCK_OPEN) return null;
        let blockType = "";
        next();
        // 1. Discard leading ws after open brace and Determine the block type by first word e.g. [slide background=FFFFFF] yields slide as block type
        while (IsWhitespace(char)) next();
        while (IsAlpha(char)) {
            blockType += char;
            next();
        }
        switch (blockType.toLowerCase()) {
            case "slide":
                return slideProperties();
            case "style":
                return styleBlock();
            case "image":
                return imageBlock();
            case "video":
                return videoBlock();
            default:
                return null;
        }

    }

    function styleBlock(): StyleBlockToken | null {
        const start = position();
        const block: StyleBlockToken = {
            type: "StyleBlock",
            properties: [],
            start,
            end: { i: 0, line: 0, column: 0 }
        };

        // The block() routine iterates until it gets to the first whitespace character (not including any ws between open brace and first word)
        // So the cursor is guaranteed to be on whitespace if this gets called
        while (IsWhitespace(char)) next();
        while (char !== BLOCK_CLOSE) {
            if (char === undefined) throw new SyntaxError(`Unclosed configuration block starting at L${start.line} character ${start.column}`);
            const configToken = configValue() || whitespace() || configKey();
            if (configToken) {
                block.properties.push(configToken);
            } else {
                next();
            }

        }
        next();
        block.start = start;
        block.end = position();
        return block;
    }

    function videoBlock(): VideoBlockToken {
        const start = position();
        const block: VideoBlockToken = {
            type: "VideoBlock",
            properties: [],
            start
        }
        while (IsWhitespace(char)) next();
        while (char !== BLOCK_CLOSE) {
            if (char === undefined) throw new SyntaxError(`Unclosed configuration block starting at L${start.line} character ${start.column}`);
            const configToken = configValue() || whitespace() || configKey();
            if (configToken) {
                block.properties.push(configToken);
            }
            else {
                next();
            }
        }
        next();
        block.end = position();
        return block;
    }

    function imageBlock(): ImageBlockToken {
        const start = position();
        const block: ImageBlockToken = {
            type: "ImageBlock",
            properties: [],
            start
        };
        while (IsWhitespace(char)) next();
        while (char !== BLOCK_CLOSE) {
            if (char === undefined) throw new SyntaxError(`Unclosed configuration block starting at L${start.line} character ${start.column}`);
            const configToken = configValue() || whitespace() || configKey();
            if (configToken) {
                block.properties.push(configToken);
            }
            else {
                next();
            }
        }
        next();
        block.end = position();
        return block;


    }

    function contentString(): ContentStringToken {
        if (!IsAlpha(char)) return null;
        let value = "";
        const start = position();
        while (!IsLineEnding(char) && !IsEOF(char)) {
            value += char;
            next();
        }
        const end = position();

        return {
            type: "ContentString",
            value,
            start,
            end
        };
    }

    function slideProperties(): SlidePropertiesToken {
        next();
        while (IsWhitespace(char)) next();
        const start = position();
        const properties: ConfigKeyValueToken[] = [];


        while (!IsLineEnding(char) && !IsEOF(char)) {
            if (IsWhitespace(char)) next();
            const configToken = configValueSlide() || configKey();
            if (configToken) {
                properties.push(configToken)
            }
            else {
                next();
            }

        }
        const end = position();

        return {
            type: "SlideProperties",
            properties,
            start,
            end
        };
    }
    const tokens: KPToken[] = [];
    for (; i <= str.length;) {
        const token: KPToken = whitespace() ||
            lineComment() ||
            endOfLine() ||
            contentString() ||
            block() ||
            endOfFile();

        if (token) {

            tokens.push(token);
        }
        else {
            const pos = position();
            throw new SyntaxError(`Unrecognized character "${char}" at L${pos.line} column ${pos.column}`);
        }
    }
    return tokens;

}


export { lexer };