import path from "path";
import {app} from "electron";

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

function parseStyleBlock(token: StyleBlockToken) : StyleBlockNode {
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
    const parsed: StyleBlockNode = {
        type: "StyleBlock",
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

function parseContentImage(token: ImageBlockToken): ContentNode
{
    if (token.type != "ImageBlock") throw new Error("Parse Error: parseContentImage called on token that is not an ImageBlock. Token Type: " + token.type);
    const pathIndex = token.properties.findIndex((p) => p.type === "ConfigKey" && p.value === "path") + 1;
    if (pathIndex === 0) throw new SyntaxError("No path provided for image content."); // Note indexOf will return -1 if not found then we add 1 to it.
    const filepath = path.resolve(app.getAppPath(), token.properties[pathIndex].value);
    console.log("Image file path resolved", filepath);
    const parsed: ContentNode = {
        type: "Content",
        contentType: "image",
        value: filepath,
        properties: {
            width: "100%",
            height: "100%",
            path: filepath
        }
    };

    const props: ImageProperties = parsed.properties;
    
    if (token.properties.length < 2) return ;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value;
        if (k === "path") continue; // We've already parsed the path above
        const v = token.properties[i + 1].value;
        props[k] = v;
    }


    return parsed;
}

function defaultStyleBlock(): StyleBlockNode {
    return {
        type: "StyleBlock",
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



    function seekContentConfig(contents: KPNode[]): StyleBlockNode {
        let config: StyleBlockNode;
        // Seeks backwards in the AST from a content string at i 
        // to find it's nearest ConfigBlock
        for (let j = contents.length - 1; j >= 0; j--) {
            const node = contents[j];
            if (node.type !== "StyleBlock") continue;
            config = node as StyleBlockNode;
            break;
        }

        if (!config) {
            config = defaultStyleBlock();
        }

        return config;
    }

    let slide: SlideNode;

    for (const token of tokens) {
        console.log("Parsing token type:", token.type);
        switch (token.type) {
            case "SlideProperties":
                slide = newSlide();
                slide.properties = parseSlideProperties(token as SlidePropertiesToken);
                break;
            case "StyleBlock":
                slide.contents.push(parseStyleBlock(token as StyleBlockToken))
                break;
            case "ContentString":
            {
                const content = parseContentString(token as ContentStringToken);
                const config = seekContentConfig(slide.contents);
                content.properties = { ...config.properties };
                slide.contents.push(content);
                break;
            }
            case "ImageBlock":
            { 
                const content = parseContentImage(token as ImageBlockToken);
                const config = seekContentConfig(slide.contents);
                content.properties = {...content.properties, ...config.properties};
                slide.contents.push(content);
                break;
            }
                
            case "EOL":
                // slide.contents.push({ type: "EOL" });
                break;

        }
    }
    return ast;
}

module.exports = { parse };