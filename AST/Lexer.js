"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = void 0;
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
function log(...args) {
    if (false) {
        console.log(...args);
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
        if (!IsLineEnding(char))
            return null;
        log("CRLF detected i", i, "char: ", char);
        const start = position();
        if (char === "\r")
            next();
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
        while (IsWhitespace(char))
            next();
        log("Discarded whitespace. Char:", char, "i:", i);
        return null;
    }
    function endOfFile() {
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
    function configKey() {
        let value = "";
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
        if (char !== "=")
            return null;
        let value = "";
        let quoteOpen = false;
        const start = position();
        while (char !== `]`) {
            if (char === `"`) {
                quoteOpen = !quoteOpen;
            }
            else {
                log(`configValue char: '${char}`, "isWhitespace", IsWhitespace(char), "isAlphaNum", IsAlphaNum(char));
                if ((IsWhitespace(char) && quoteOpen) ||
                    (IsAlphaNum(char) || char === "-" || char === ",")) {
                    value += char;
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
        };
    }
    function configValueSlide() {
        if (char !== "=")
            return null;
        let value = "";
        let quoteOpen = false;
        const start = position();
        while (!IsLineEnding(char)) {
            if (char === `"`) {
                quoteOpen = !quoteOpen;
            }
            else if (char === "#") {
                next();
            }
            else {
                if ((IsWhitespace(char) && quoteOpen) ||
                    (IsAlphaNum(char) || char === "-" || char === ",")) {
                    value += char;
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
        };
    }
    function block() {
        if (char !== BLOCK_OPEN)
            return null;
        const start = position();
        let blockType = "";
        next();
        while (IsWhitespace(char))
            next();
        while (IsAlpha(char)) {
            blockType += char;
            next();
        }
        switch (blockType.toLowerCase()) {
            case "slide":
            case "new_slide":
            case "new.slide":
                return slideProperties();
            case "style":
                return styleBlock();
            default:
                return null;
        }
    }
    function styleBlock() {
        const start = position();
        const block = {
            type: "StyleBlock",
            properties: [],
            start,
            end: { i: 0, line: 0, column: 0 }
        };
        while (IsWhitespace(char))
            next();
        while (char !== BLOCK_CLOSE) {
            if (char === undefined)
                throw new SyntaxError(`Unclosed configuration block starting at L${start.line} character ${start.column}`);
            const configToken = configValue() || whitespace() || configKey();
            if (configToken) {
                block.properties.push(configToken);
            }
            else {
                next();
            }
        }
        next();
        block.start = start;
        block.end = position();
        return block;
    }
    function contentString() {
        if (!IsAlpha(char))
            return null;
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
    function slideProperties() {
        next();
        while (IsWhitespace(char))
            next();
        const start = position();
        const properties = [];
        while (!IsLineEnding(char) && !IsEOF(char)) {
            if (IsWhitespace(char))
                next();
            const configToken = configValueSlide() || configKey();
            if (configToken) {
                properties.push(configToken);
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
    const tokens = [];
    for (; i <= str.length;) {
        const token = whitespace() ||
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
};
exports.lexer = lexer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJMZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLFVBQVUsR0FBVSxHQUFHLENBQUM7QUFDOUIsTUFBTSxXQUFXLEdBQVUsR0FBRyxDQUFDO0FBRS9CLFNBQVMsT0FBTyxDQUFDLElBQVk7SUFDekIsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLElBQVk7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzVCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWTtJQUM5QixPQUFPLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQztBQUN4QyxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWTtJQUM5QixPQUFPLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQztBQUMxQyxDQUFDO0FBRUQsU0FBUyxLQUFLLENBQUMsSUFBc0I7SUFDakMsT0FBTyxJQUFJLEtBQUssU0FBUyxDQUFDO0FBQzlCLENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBQyxHQUFHLElBQVc7SUFDdkIsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDeEI7QUFDTCxDQUFDO0FBRUQsTUFBTSxLQUFLLEdBQUcsVUFBVSxHQUFXO0lBQy9CLElBQUksSUFBSSxH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