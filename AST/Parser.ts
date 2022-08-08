

function parseOffset(offsetString: string): Offset {
    const offset: Offset = {
        top: 0,
        left: 0
    };
    const s = offsetString.split(",");
    for (const o of s) {
        const e = o.substring(0, 1);
        const k = e === "t" ? "top" : "left";
        const v = parseInt(o.substring(1));
        offset[k] = v;
    }
    return offset;
}


function parseConfigBlock(token: ConfigBlockToken) : ConfigBlockNode {
    
    let properties: ConfigBlockProperties = {
        align: "center",
        valign: "top",
        font: "Arial",
        "font-size": "12px",
        "font-color": "000000",
        offset: {
            top: 0,
            left: 0
        }
    };
    const parsed: ConfigBlockNode = {
        type: "ConfigBlock",
        properties
    };

    if (token.properties.length < 2) return parsed;
    for (let i = 0, len = token.properties.length; i < len; i += 2) {
        const k = token.properties[i].value;
        const v = (k === "offset") ? parseOffset(token.properties[i + 1].value) : token.properties[i + 1].value;
        properties[k] = v;
    }
    return parsed;
}
function parseSlideProperties(token: SlidePropertiesToken): SlideProperties {
    const slideProps: SlideProperties = { background: "#FFFFFF" };
    const userProps: SlideProperties = {};

    if (token.properties.length < 2) return slideProps;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value;
        const v = token.properties[i + 1].value;
        userProps[k] = v;
    }

    return { ...slideProps, ...userProps };
}

function parseContentString(token: ContentStringToken): ContentNode {
    if (token.type != "ContentString") throw new Error("Parse Error: parseContentString called on token that is not a ContentString. Token Type: " + token.type);
    return {
        type: "Content",
        contentType: "string",
        value: token.value
    };
}

function defaultConfigBlock(): ConfigBlockNode {
    return {
        type: "ConfigBlock",
        properties: {
            align: "center",
            valign: "center",
            font: "Helvectica",
            "font-color": "000000",
            "font-size": "30px",
            offset: {
                top: 0,
                left: 0
            }
        }
    };
}

export function parse(tokens: KPToken[]): DocumentNode {
    let slideN = 0;
    const ast: DocumentNode = {
        type: "Document",
        slides: []
    }

    function newSlide(): SlideNode {
        const slide: SlideNode = {
            type: "Slide",
            id: slideN++,
            properties: {},
            contents: []
        };
        ast.slides.push(slide);
        return slide;
    }



    function seekContentConfig(contents): ConfigBlockNode {
        let config: ConfigBlockNode;
        // Seeks backwards in the AST from a content string at i 
        // to find it's nearest ConfigBlock
        for (let j = contents.length - 1; j >= 0; --j) {
            const node = contents[j];
            if (node.type !== "ConfigBlock") continue;
            config = node;
        }

        if (!config) {
            config = defaultConfigBlock();
        }

        return config;
    }

    let slide = newSlide();

    for (const token of tokens) {
        switch (token.type) {
            case "SlideProperties":
                slide.properties = parseSlideProperties(token as SlidePropertiesToken);
                break;
            case "ConfigBlock":
                slide.contents.push(parseConfigBlock(token as ConfigBlockToken))
                break;
            case "PageBreak":
                slide = newSlide();
                break;
            case "ContentString":
                const content = parseContentString(token as ContentStringToken);
                const config = seekContentConfig(slide.contents);
                content.properties = { ...config.properties };
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