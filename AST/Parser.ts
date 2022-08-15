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
const VALID_TRANSISTION_TYPES: SlideTransitionType[] = ["dissolve"];
function parseTransition(transitionValue: string): SlideTransition
{
    const transition: SlideTransition = {
        type: "dissolve",
        duration: 1
    };
    const s = transitionValue.split(",");
    let d: number, type: SlideTransitionType;
    for(const t of s)
    {
        if (/^\d\.{0,1}\d{0,2}m?s?$/.test(t))
        {
            // Duration value
            if (t.indexOf("ms") > -1)
            {
                d = parseInt(t.replace("ms", "")); // NOTE(liam): We just truncate any floating point values passed as ms;
            } 
            else 
            {
                d = Math.round(parseInt(t.replace("s", "s")) * 1000);
            }
            transition.duration = d;
        } else {
            if (!VALID_TRANSISTION_TYPES.includes(t as SlideTransitionType)) throw new Error(`'${t}' is not a valid Slide Transition Type`);
            transition.type = t as SlideTransitionType;
        }
    }

    return transition;
}

function parseStyleBlock(token: StyleBlockToken) : StyleBlockNode {
    let properties: StyleBlockProperties = {
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
    const slideProps: SlideProperties = { 
        background: "#FFFFFF", 
        transition: {
            type: "none", 
            duration: 0
        } 
    };
    const userProps: SlideProperties = {};

    if (token.properties.length < 2) return slideProps;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value.toLocaleLowerCase();
        const v = (k === "transition") ? parseTransition(token.properties[i + 1].value) : token.properties[i + 1].value;
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

function parseHeaderProperties(token: HeaderBlockToken): HeaderFooterProperties
{
    if (token.type !== "HeaderBlock") throw new Error("Parse Error: parseHeaderBlock called on token that is not a HeaderBlock. Token Type: " + token.type);
    const headerProps: HeaderFooterProperties = {
        name: "",
        "page-number": false
    };
    const userProps: HeaderFooterProperties = {};

    if (token.properties.length < 2) return headerProps
    for (let i = 0; i < token.properties.length; i += 2)
    {
        const k = token.properties[i].value.toLocaleLowerCase();
        const v = token.properties[i+1].value;
        userProps[k] = v;
    }

    return { ...headerProps, ...userProps };
}

function parseContentImage(token: ImageBlockToken): ContentNode
{
    if (token.type !== "ImageBlock") throw new Error("Parse Error: parseContentImage called on token that is not an ImageBlock. Token Type: " + token.type);
    const pathIndex = token.properties.findIndex((p) => p.type === "ConfigKey" && p.value === "path") + 1;
    if (pathIndex === 0) throw new SyntaxError("No path provided for image content."); // Note indexOf will return -1 if not found then we add 1 to it.
    const filepath = path.resolve(app.getAppPath(), token.properties[pathIndex].value);
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
function parseContentVideo(token: VideoBlockToken): ContentNode
{
    if (token.type != "VideoBlock") throw new Error("Parse Error: parseContentVideo called on token that is not a VideoBlock. Token Type: " + token.type);
    const pathIndex = token.properties.findIndex((p) => p.type === "ConfigKey" && p.value === "path") + 1;
    if (pathIndex === 0) throw new SyntaxError("No path provided for video content."); // Note indexOf will return -1 if not found then we add 1 to it.
    const filepath = path.resolve(app.getAppPath(), token.properties[pathIndex].value);
    const parsed: ContentNode = {
        type: "Content",
        contentType: "video",
        value: filepath,
        properties: {
            width: "100%",
            height: "100%",
            path: filepath
        }
    };

    const props: MediaProperties = parsed.properties;
    
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
    let contentN = 0;
    let headerN = 0;
    let footerN = 0;
    const ast: DocumentNode = {
        type: "Document",
        slides: [],
        headers: {},
        footers: {}
    }

    function newSlide(): SlideNode {
        contentN = 0;
        const slide: SlideNode = {
            type: "Slide",
            id: slideN++,
            properties: {},
            contents: [],
            prev: null,
            next: null
        };
        console.log("New Slide Id", slide.id);
        if(slide.id > 0) {
            slide.prev = ast.slides[slide.id - 1];
            ast.slides[slide.id-1].next = slide;
        }
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

    function getContentTokensToNextSlide(token: KPToken, tokens: KPToken[]): KPToken[]
    {
        const contentTokens: KPToken[] = [];
        for(let i = tokens.indexOf(token) + 1, len = tokens.length; 
            tokens[i].type !== "SlideProperties" && i<len; 
            i++)
        {
            const t = tokens[i];
            contentTokens.push(t);
        }

        return contentTokens;
    }

    let slide: SlideNode;

    for (let i=0, len=tokens.length; i<len; i++) {
        const token = tokens[i];
        console.log("Parsing token type:", token.type);
        switch (token.type) {
            case "SlideProperties":
                slide = newSlide();
                slide.properties = parseSlideProperties(token as SlidePropertiesToken);
                break;
            case "HeaderBlock":
                headerN++;
                const headerProperties = parseHeaderProperties(token as HeaderBlockToken);
                if (headerProperties.name === "") headerProperties.name = `header-${headerN}`;
                const contents = getContentTokensToNextSlide(token, tokens);
                const lastToken = contents[contents.length - 1];
                const lastIdx = tokens.indexOf(lastToken);
                i = lastIdx;
                
            case "StyleBlock":
                slide.contents.push(parseStyleBlock(token as StyleBlockToken))
                break;
            case "ContentString":
            {
                const content = parseContentString(token as ContentStringToken);
                const config = seekContentConfig(slide.contents);
                content.properties = { ...config.properties };
                content.id = contentN++;
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
            case "VideoBlock":
            {
                const content = parseContentVideo(token as VideoBlockToken);
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