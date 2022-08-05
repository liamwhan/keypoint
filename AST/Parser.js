

function parseConfigBlock(token) {
    const config = {
        align: "center",
        valign: "top",
        font: "Arial",
        "font-size": "12px",
        "font-color": "#000000",
        "offset": {
            top: 0,
            left: 0
        }
    };
    const userConfigProperties = token.value.split(" ");
    const userConfig = {};
    for (let c of userConfigProperties) {
        const s = c.split("=");
        if (s.length < 2) throw new SyntaxError("Slide configuration mismatched property pair");
        if (s[0] !== "offset") {
            userConfig[s[0]] = s[1].replaceAll("\"", "");
        }
        else {
            const offsetSplit = s[1].split(",");
            const offset = {
                top: 0,
                left: 0
            }
            for (let i = 0, len = offsetSplit.length; i < len; i++) {
                const offsetTerm = offsetSplit[i];
                const operand = offsetTerm.substring(0, 1);
                const operandFull = operand === "t" ? "top" : "left";
                const value = parseInt(offsetTerm.substring(1));
                offset[operandFull] = value;
            }
            userConfig["offset"] = offset;
        }
    }
    return {
        type: "ConfigBlock",
        properties: { ...config, ...userConfig }
    };
}
function parseSlideProperties(token) {
    const props = {
        background: "#FFFFFF"
    }
    if (token.value.length < 1) return props;
    const userProps = token.value.split(" ");
    const userProperties = {};
    for (let p of userProps) {
        const s = p.toLowerCase().split("=");
        if (s.length < 2) throw new SyntaxError("SlideProperties mismatched key value pair")
        userProperties[s[0]] = s[1];
    }
    return {
        type: "SlideProperties",
        ...{ ...props, ...userProperties }
    };
}

function parseContentString(token) {
    if (token.type != "ContentString") throw new Error("Parse Error: parseContentString called on token that is not a ContentString. Token Type: ", token.type);
    return {
        type: "Content",
        contentType: "string",
        value: token.value
    };
}


function parse(tokens) {
    let slideN = 0;
    const ast = {
        type: "Document",
        slides: []
    }

    function newSlide() {
        slideN++;
        const slide = {
            type: "Slide",
            id: slideN,
            properties: {},
            contents: []
        };
        ast.slides.push(slide);
        return slide;
    }

    function seekContentConfig(contents) {
        // Seeks backwards in the AST from a content string at i 
        // to find it's nearest ConfigBlock
        for (let j = contents.length - 1; j >= 0; --j) {
            const node = contents[j];
            if (node.type !== "ConfigBlock") continue;
            return node;
        }
    }

    let slide = newSlide();
    
    for (const token of tokens) {
        switch (token.type) {
            case "SlideProperties":
                slide.properties = parseSlideProperties(token);
                break;
            case "ConfigBlock":
                slide.contents.push(parseConfigBlock(token))
                break;
            case "PageBreak":
                slide = newSlide();
                break;
            case "ContentString":
                const content = parseContentString(token);
                const config = seekContentConfig(slide.contents);
                content.properties = {...config.properties};
                slide.contents.push(content);
                break;
            case "EOL":
                // slide.contents.push({ type: "EOL" });
                break;

        }
    }
    return ast;
}

module.exports = { parse };