"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
function IsLineCommentMarker(char) {
    return char === "#";
}
function IsLineEnding(char) {
    return char === "\r" || char === "\n";
}
function IsEOF(char) {
    return char === undefined;
}
function IsIncludeOp(char) {
    return char === '!';
}
function log(...args) {
    if (false) {
        console.log(...args);
    }
}
const lexer = function (str, isInclude = false) {
    let line = 1;
    let column = 1;
    let i = 0;
    let char = str[i];
    function next() {
        i++;
        column++;
        char = str[i];
    }
    function position() {
        return { i, line, column };
    }
    function whitespace() {
        log("Checking char for whitespace, Char", char, "i", i);
        while (IsWhitespace(char))
            next();
        log("Discarded whitespace. Char:", char, "i:", i);
        return null;
    }
    function lineComment() {
        if (!IsLineCommentMarker(char))
            return null;
        while (!IsLineEnding(char))
            next();
        while (IsLineEnding(char))
            next();
        line++;
        column = 1;
        if (IsLineCommentMarker(char))
            return lineComment();
        return null;
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
            if (char === "#") {
                next();
            }
            else {
                if ((IsWhitespace(char) && quoteOpen) || IsValidConfigValueChar(char)) {
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
            case "video":
                return videoBlock();
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
    function videoBlock() {
        const start = position();
        const block = {
            type: "VideoBlock",
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
    function include(isInclude) {
        if (!IsIncludeOp(char))
            return null;
        const start = position();
        next();
        while (IsAlpha(char))
            next();
        while (IsWhitespace(char))
            next();
        let path = "";
        while (!IsLineEnding(char)) {
            path += char;
            next();
        }
        const end = position();
        while (IsLineEnding(char))
            next();
        if (isInclude)
            throw new SyntaxError("You can only include from your base file. Included files can not contain include expressions");
        return {
            type: "Include",
            path,
            start,
            end
        };
    }
    const tokens = [];
    for (; i <= str.length;) {
        const token = whitespace() ||
            lineComment() ||
            include(isInclude) ||
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
    for (let j = 0; j < tokens.length; j++) {
        const t = tokens[j];
        if (t.type === "Include") {
            let { path: p } = t;
            p = path_1.default.resolve(p);
            p = p.indexOf(".kp") === -1 ? `${p}.kp` : p;
            console.log("Processing include at", p);
            const inc = fs_1.default.readFileSync(p, { encoding: "utf-8" });
            const iTokens = lexer(inc).filter(it => it.type !== "EOF");
            tokens.splice(j, 1, ...iTokens);
        }
    }
    return tokens;
};
exports.lexer = lexer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJMZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLE1BQU0sVUFBVSxHQUFXLEdBQUcsQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBVyxHQUFHLENBQUM7QUFFaEMsU0FBUyxPQUFPLENBQUMsSUFBWTtJQUV6QixPQUFPLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN4RSxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsSUFBWTtJQUUzQixPQUFPLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQUNELFNBQVMsc0JBQXNCLENBQUMsSUFBWTtJQUV4QyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLENBQUM7QUFDNUcsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLElBQVk7SUFFNUIsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFZO0lBRTlCLE9BQU8sSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDO0FBQ3hDLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLElBQVk7SUFFckMsT0FBTyxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQ3hCLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFZO0lBRTlCLE9BQU8sSUFBSSxL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