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
function IsValidConfigValueChar(char) {
    return IsAlphaNum(char) || char === "-" || char === "," || char === "%" || char === "." || char === "/";
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
                    (IsValidConfigValueChar(char))) {
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
                return slideProperties();
            case "style":
                return styleBlock();
            case "image":
                return imageBlock();
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
    function imageBlock() {
        const start = position();
        const block = {
            type: "ImageBlock",
            properties: [],
            start
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJMZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLFVBQVUsR0FBVSxHQUFHLENBQUM7QUFDOUIsTUFBTSxXQUFXLEdBQVUsR0FBRyxDQUFDO0FBRS9CLFNBQVMsT0FBTyxDQUFDLElBQVk7SUFDekIsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLElBQVk7SUFDM0IsT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFDRCxTQUFTLHNCQUFzQixDQUFDLElBQVk7SUFFeEMsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQzVHLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzVCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWTtJQUM5QixPQUFPLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQztBQUN4QyxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWTtJQUM5QixPQUFPLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQztBQUMxQyxDQUFDO0FBRUQsU0FBUyxLQUFLLENBQUMsSUFBc0I7SUFDakMsT0FBTyxJQUFJLEtBQUssU0FBUyxD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