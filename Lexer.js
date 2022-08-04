const BLOCK_OPEN = "[";
const BLOCK_CLOSE = "]";

function IsAlpha(char)
{
    return ("a" <= char && char <= "z") || ("A" <= char && char <= "Z");
}

function IsWhitespace(char)
{
    return char === " " || char == "\t";
}

function IsLineEnding(char)
{
    return char === "\r" || char === "\n";
}

function IsEOF(char)
{
    return char === undefined;
}

function log() {
    if (false) {
        console.log(...arguments);
    }
}

const lexer = function* (str)
{
    let line = 1;
    let column = 1;
    let i = 0;
    let char = str[i];

    function next() {
        i++;
        column++;
        char = str[i];
    }

    function peekNext()
    {
        return str[i+1];
    }

    function position()
    {
        return {i, line, column};
    }

    function endOfLine()
    {
        log("Checking for endOfLine char: ", char, "IsLineEnding", IsLineEnding(char));
        if (!IsLineEnding(char)) return null;
        log("CRLF detected i", i, "char: ", char);
        const start = position();
        while (IsLineEnding(char)) next();
        const end = position();
        line++;
        column = 1;
        return {
            type: "EOL",
            start,
            end
        };
    
    }

    function whitespace()
    {
        log("Checking char for whitespace, Char", char, "i", i);
        while(IsWhitespace(char)) next();
        log("Discarded whitespace. Char:", char, "i:", i)
        return null;

    }

    function endOfFile()
    {
        if (char === undefined) {
            next();
            return {
                type: "EOF",

            }; 
        }

        return null;
    } 

    function configBlock()
    {
        if (char != BLOCK_OPEN) return null;
        const start = position();
        let value = "";
        next();
        while(char !== BLOCK_CLOSE)
        {
            if (char === undefined) throw new SyntaxError(`Unclosed configuration block starting at L${start.line} character ${start.column}`);
            value += char;
            next();
        }
        const end = position();
        next();
        return {
            type: "ConfigBlock",
            value,
            start,
            end
        };
    }

    function contentString()
    {
        if (!IsAlpha(char)) return null;
        let value = "";
        while (!IsLineEnding(char) && !IsEOF(char))
        {
            value += char;
            next();
        }

        return {
            type: "ContentString",
            value
        };
    }

    function pageBreak()
    {
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

    function slideProperties()
    {
        if (char !== "#" || column !== 1) return null;
        next();
        let value = "";
        // Discard leading whitespace after #
        while(IsWhitespace(char)) next();
        const start = position();
        while (!IsLineEnding(char) && !IsEOF(char))
        {
            if (!IsWhitespace(char)) 
            {
                value += char;
            }
            next();
        }
        const end = position();
        next();
        return {
            type: "SlideProperties",
            value,
            start,
            end
        };
    }

    for(; i <= str.length;)
    {
        const token = whitespace() || 
                      endOfLine() || 
                      slideProperties() ||
                      contentString() ||
                      configBlock() || 
                      pageBreak() ||
                      endOfFile();

        if (token)
        {
            yield token;
        } 
        else 
        {
            const pos = position();
            throw new SyntaxError(`Unrecognized character "${char}" at L${pos.line} column ${pos.column}`);
        }

    }

}

module.exports = {lexer};
