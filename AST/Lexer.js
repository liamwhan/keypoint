const BLOCK_OPEN = "[";
const BLOCK_CLOSE = "]";

function IsAlpha(char) {
    return ("a" <= char && char <= "z") || ("A" <= char && char <= "Z");
}

function IsNumeric(char) {
    return ("0" <= char && char <= "9");
}

function IsAlphaNum(char) {
    return IsAlpha(char) || IsNumeric(char);
}

function IsWhitespace(char) {
    return char === " " || char == "\t";
}

function IsLineEnding(char) {
    return char === "\r" || char === "\n";
}

function IsEOF(char) {
    return char === undefined;
}

function log() {
    if (false) {
        console.log(...arguments);
    }
}

const lexer = function (str) {
    let line = 1;
    let column = 1;
    let i = 0;
    let char = str[i];

    function next() {
        i++;
        column++;
        char = str[i];
    }

    function peekNext() {
        return str[i + 1];
    }

    function position() {
        return { i, line, column };
    }

    function endOfLine() {
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

    function whitespace() {
        log("Checking char for whitespace, Char", char, "i", i);
        while (IsWhitespace(char)) next();
        log("Discarded whitespace. Char:", char, "i:", i)
        return null;
    }

    function endOfFile() {
        if (char === undefined) {
            next();
            return {
                type: "EOF",

            };
        }

        return null;
    }

    function configKey() {
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

    function configValue() {
        if (char !== "=") return null;
        let value = "";
        let quoteOpen = false;
        const start = position();
        while (char !== ']') {
            if (char === `"`) {
                quoteOpen = !quoteOpen;
            }
            else {
                log(`configValue char: '${char}`, "isWhitespace", IsWhitespace(char), "isAlphaNum", IsAlphaNum(char))
                if ((IsWhitespace(char) && quoteOpen) ||
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

    function configValueSlide() {
        if (char !== "=") return null;
        let value = "";
        let quoteOpen = false;
        const start = position();
        while (!IsLineEnding(char)) {
            if (char === `"`) {
                quoteOpen = !quoteOpen;
            }
            else if (char === "#")
            {
                // Ignore extranous hash for hex colors
                next();
            }
            else {
                log(`configValue char: '${char}`, "isWhitespace", IsWhitespace(char), "isAlphaNum", IsAlphaNum(char))
                if ((IsWhitespace(char) && quoteOpen) ||
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


    function configBlock() {
        if (char !== BLOCK_OPEN) return null;
        const start = position();
        const block = {
            type: "ConfigBlock",
            properties: [],
            start,
            end: 0
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
        block.end = position();
        return block;
    }

    function contentString() {
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

    function pageBreak() {
        if (char !== "\\") return null;
        let start, end;
        start = end = position();
        next();
        return {
            type: "PageBreak",
            start,
            end
        }
    }

    function slideProperties() {
        log("Checking for Slide properties")
        if (char !== "#" || column !== 1) return null;
        next();
        // Discard leading whitespace after #
        while (IsWhitespace(char)) next();
        const start = position();
        const slideProps = {
            type: "SlideProperties",
            properties: [],
            start,
        };

        log("Token is SlideProperties, lexing...")
           
        while (!IsLineEnding(char) && !IsEOF(char)) {
            if (IsWhitespace(char)) next();
            const configToken =  configValueSlide() || configKey();
            if (configToken)
            {
                slideProps.properties.push(configToken)
            }
            else {
                next();
            }
            
        }
        const end = position();
        slideProps.end = end;
        log(slideProps)
        return slideProps;
    }
    const tokens = [];
    for (; i <= str.length;) {
        const token = whitespace() ||
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

module.exports = { lexer };
