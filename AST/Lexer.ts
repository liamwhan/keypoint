export interface TokenLocation {
    i: number;
    line: number;
    column: number;
}
export type TokenType = "SlideProperties"|"ConfigKey"|"ConfigValue"|"ConfigBlock"|"ContentString"|"PageBreak"|"EOL"|"EOF";
export interface TokenBase {
    type: TokenType;
    start: TokenLocation;
    end:TokenLocation;
}

export interface TokenSlideProperties extends TokenBase
{
    type: "SlideProperties";
    properties: TokenConfigKeyValue[];
}

export interface TokenContentString extends TokenBase
{
    type: "ContentString";
    value: string;
}

export interface TokenConfigKeyValue extends TokenBase
{
    type: "ConfigKey"|"ConfigValue";
    value: string;
}

export interface TokenConfigBlock extends TokenBase
{
    type: "ConfigBlock";
    properties: TokenConfigKeyValue[];
};

export interface TokenEOL extends TokenBase
{
    type: "EOL";
}

export interface TokenEOF extends TokenBase
{
    type: "EOF";
}

export interface TokenPageBreak extends TokenBase
{
    type: "PageBreak";
}

const BLOCK_OPEN:string = "[";
const BLOCK_CLOSE:string = "]";

function IsAlpha(char: string): boolean {
    return ("a" <= char && char <= "z") || ("A" <= char && char <= "Z");
}

function IsNumeric(char: string): boolean {
    return ("0" <= char && char <= "9");
}

function IsAlphaNum(char: string): boolean {
    return IsAlpha(char) || IsNumeric(char);
}

function IsWhitespace(char: string): boolean {
    return char === " " || char == "\t";
}

function IsLineEnding(char: string): boolean {
    return char === "\r" || char === "\n";
}

function IsEOF(char: string|undefined): boolean {
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

    function endOfLine(): TokenEOL {
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

    function whitespace(): null {
        log("Checking char for whitespace, Char", char, "i", i);
        while (IsWhitespace(char)) next();
        log("Discarded whitespace. Char:", char, "i:", i)
        return null;
    }

    function endOfFile(): TokenEOF|null {
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

    function configKey(): TokenConfigKeyValue {
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

    function configValue(): TokenConfigKeyValue {
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
                    //@ts-expect-error
                    (IsAlphaNum(char) || char === "-" || char === ",")) {
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
        
        function configValueSlide(): TokenConfigKeyValue {
            if (char !== "=") return null;
            let value = "";
            let quoteOpen = false;
            const start = position();
            while (!IsLineEnding(char)) {
            //@ts-expect-error
            if (char === `"`) {
                quoteOpen = !quoteOpen;
            }
            //@ts-expect-error
            else if (char === "#")
            {
                // Ignore extranous hash for hex colors
                next();
            }
            else {
                if ((IsWhitespace(char) && quoteOpen) ||
                //@ts-expect-error
                    (IsAlphaNum(char) || char === "-" || char === ",")) {
                    value += char
                    next();
                    continue
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


    function configBlock(): TokenConfigBlock {
        if (char !== BLOCK_OPEN) return null;
        const start = position();
        const block: TokenConfigBlock = {
            type: "ConfigBlock",
            properties: [],
            start,
            end: {i: 0, line: 0, column: 0}
        };
        next();
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

    function contentString(): TokenContentString {
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

    function pageBreak(): TokenPageBreak {
        if (char !== "\\") return null;
        let start: TokenLocation, end: TokenLocation;
        start = end = position();
        next();
        return {
            type: "PageBreak",
            start,
            end
        }
    }

    function slideProperties(): TokenSlideProperties {
        if (char !== "#" || column !== 1) return null;
        next();
        // Discard leading whitespace after #
        while (IsWhitespace(char)) next();
        const start = position();
        const properties: TokenConfigKeyValue[] = [];
        

        while (!IsLineEnding(char) && !IsEOF(char)) {
            if (IsWhitespace(char)) next();
            const configToken =  configValueSlide() || configKey();
            if (configToken)
            {
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
    const tokens: TokenBase[] = [];
    for (; i <= str.length;) {
        const token: TokenBase = whitespace() ||
            endOfLine() ||
            slideProperties() ||
            contentString() ||
            configBlock() ||
            pageBreak() ||
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


export {lexer};