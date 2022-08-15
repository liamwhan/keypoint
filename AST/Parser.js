"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
function parseOffset(offsetString) {
    const offset = {
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
const VALID_TRANSISTION_TYPES = ["dissolve"];
function parseTransition(transitionValue) {
    const transition = {
        type: "dissolve",
        duration: 1
    };
    const s = transitionValue.split(",");
    let d, type;
    for (const t of s) {
        if (/^\d\.{0,1}\d{0,2}m?s?$/.test(t)) {
            if (t.indexOf("ms") > -1) {
                d = parseInt(t.replace("ms", ""));
            }
            else {
                d = Math.round(parseInt(t.replace("s", "s")) * 1000);
            }
            transition.duration = d;
        }
        else {
            if (!VALID_TRANSISTION_TYPES.includes(t))
                throw new Error(`'${t}' is not a valid Slide Transition Type`);
            transition.type = t;
        }
    }
    return transition;
}
function parseStyleBlock(token) {
    let properties = {
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
    const parsed = {
        type: "StyleBlock",
        properties
    };
    if (token.properties.length < 2)
        return parsed;
    for (let i = 0, len = token.properties.length; i < len; i += 2) {
        const k = token.properties[i].value;
        const v = (k === "offset") ? parseOffset(token.properties[i + 1].value) : token.properties[i + 1].value;
        properties[k] = v;
    }
    return parsed;
}
function parseSlideProperties(token) {
    const slideProps = {
        background: "#FFFFFF",
        transition: {
            type: "none",
            duration: 0
        }
    };
    const userProps = {};
    if (token.properties.length < 2)
        return slideProps;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value.toLocaleLowerCase();
        const v = (k === "transition") ? parseTransition(token.properties[i + 1].value) : token.properties[i + 1].value;
        userProps[k] = v;
    }
    return Object.assign(Object.assign({}, slideProps), userProps);
}
function parseContentString(token) {
    if (token.type != "ContentString")
        throw new Error("Parse Error: parseContentString called on token that is not a ContentString. Token Type: " + token.type);
    return {
        type: "Content",
        contentType: "string",
        value: token.value
    };
}
function parseHeaderProperties(token) {
    if (token.type !== "HeaderBlock")
        throw new Error("Parse Error: parseHeaderBlock called on token that is not a HeaderBlock. Token Type: " + token.type);
    const headerProps = {
        name: "",
        "page-number": false
    };
    const userProps = {};
    if (token.properties.length < 2)
        return headerProps;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value.toLocaleLowerCase();
        const v = token.properties[i + 1].value;
        userProps[k] = v;
    }
    return Object.assign(Object.assign({}, headerProps), userProps);
}
function parseContentImage(token) {
    if (token.type !== "ImageBlock")
        throw new Error("Parse Error: parseContentImage called on token that is not an ImageBlock. Token Type: " + token.type);
    const pathIndex = token.properties.findIndex((p) => p.type === "ConfigKey" && p.value === "path") + 1;
    if (pathIndex === 0)
        throw new SyntaxError("No path provided for image content.");
    const filepath = path_1.default.resolve(electron_1.app.getAppPath(), token.properties[pathIndex].value);
    const parsed = {
        type: "Content",
        contentType: "image",
        value: filepath,
        properties: {
            width: "100%",
            height: "100%",
            path: filepath
        }
    };
    const props = parsed.properties;
    if (token.properties.length < 2)
        return;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value;
        if (k === "path")
            continue;
        const v = token.properties[i + 1].value;
        props[k] = v;
    }
    return parsed;
}
function parseContentVideo(token) {
    if (token.type != "VideoBlock")
        throw new Error("Parse Error: parseContentVideo called on token that is not a VideoBlock. Token Type: " + token.type);
    const pathIndex = token.properties.findIndex((p) => p.type === "ConfigKey" && p.value === "path") + 1;
    if (pathIndex === 0)
        throw new SyntaxError("No path provided for video content.");
    const filepath = path_1.default.resolve(electron_1.app.getAppPath(), token.properties[pathIndex].value);
    const parsed = {
        type: "Content",
        contentType: "video",
        value: filepath,
        properties: {
            width: "100%",
            height: "100%",
            path: filepath
        }
    };
    const props = parsed.properties;
    if (token.properties.length < 2)
        return;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value;
        if (k === "path")
            continue;
        const v = token.properties[i + 1].value;
        props[k] = v;
    }
    return parsed;
}
function defaultStyleBlock() {
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
function parseHeaderFooterContents(tokens) {
    const nodes = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        switch (token.type) {
            case "StyleBlock":
                nodes.push(parseStyleBlock(token));
                break;
            case "ContentString":
                {
                    const content = parseContentString(token);
                    nodes.push(content);
                    break;
                }
        }
    }
    return nodes;
}
function parse(tokens) {
    let slideN = 0;
    let contentN = 0;
    let headerN = 0;
    let footerN = 0;
    const ast = {
        type: "Document",
        slides: [],
        headers: {},
        footers: {}
    };
    function newSlide() {
        contentN = 0;
        const slide = {
            type: "Slide",
            id: slideN++,
            properties: {},
            contents: [],
            prev: null,
            next: null
        };
        console.log("New Slide Id", slide.id);
        if (slide.id > 0) {
            slide.prev = ast.slides[slide.id - 1];
            ast.slides[slide.id - 1].next = slide;
        }
        ast.slides.push(slide);
        return slide;
    }
    function seekContentConfig(contents) {
        let config;
        for (let j = contents.length - 1; j >= 0; j--) {
            const node = contents[j];
            if (node.type !== "StyleBlock")
                continue;
            config = node;
            break;
        }
        if (!config) {
            config = defaultStyleBlock();
        }
        return config;
    }
    function getContentTokensToNextSlide(token, tokens) {
        const contentTokens = [];
        for (let i = tokens.indexOf(token) + 1, len = tokens.length; tokens[i].type !== "SlideProperties" && i < len; i++) {
            const t = tokens[i];
            contentTokens.push(t);
        }
        return contentTokens;
    }
    let slide;
    for (let i = 0, len = tokens.length; i < len; i++) {
        const token = tokens[i];
        console.log("Parsing token type:", token.type);
        switch (token.type) {
            case "SlideProperties":
                slide = newSlide();
                slide.properties = parseSlideProperties(token);
                break;
            case "HeaderBlock":
                {
                    headerN++;
                    const properties = parseHeaderProperties(token);
                    if (properties.name === "")
                        properties.name = `header-${headerN}`;
                    const contentTokens = getContentTokensToNextSlide(token, tokens);
                    const lastToken = contentTokens[contentTokens.length - 1];
                    const lastIdx = tokens.indexOf(lastToken);
                    i = lastIdx;
                    const contents = parseHeaderFooterContents(contentTokens);
                    ast.headers[properties.name] = {
                        type: "Header",
                        properties: properties,
                        contents
                    };
                    break;
                }
            case "StyleBlock":
                slide.contents.push(parseStyleBlock(token));
                break;
            case "ContentString":
                {
                    const content = parseContentString(token);
                    const config = seekContentConfig(slide.contents);
                    content.properties = Object.assign({}, config.properties);
                    content.id = contentN++;
                    slide.contents.push(content);
                    break;
                }
            case "ImageBlock":
                {
                    const content = parseContentImage(token);
                    const config = seekContentConfig(slide.contents);
                    content.properties = Object.assign(Object.assign({}, content.properties), config.properties);
                    slide.contents.push(content);
                    break;
                }
            case "VideoBlock":
                {
                    const content = parseContentVideo(token);
                    const config = seekContentConfig(slide.contents);
                    content.properties = Object.assign(Object.assign({}, content.properties), config.properties);
                    slide.contents.push(content);
                    break;
                }
            case "EOL":
                break;
        }
    }
    return ast;
}
exports.parse = parse;
module.exports = { parse };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4Qix1Q0FBK0I7QUFFL0IsU0FBUyxXQUFXLENBQUMsWUFBb0I7SUFFckMsTUFBTSxNQUFNLEdBQVc7UUFDbkIsR0FBRyxFQUFFLENBQUM7UUFDTixJQUFJLEVBQUUsQ0FBQztLQUNWLENBQUM7SUFDRixNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUNqQjtRQUNJLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFDRCxNQUFNLHVCQUF1QixHQUEwQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BFLFNBQVMsZUFBZSxDQUFDLGVBQXVCO0lBRTVDLE1BQU0sVUFBVSxHQUFvQjtRQUNoQyxJQUFJLEVBQUUsVUFBVTtRQUNoQixRQUFRLEVBQUUsQ0FBQztLQUNkLENBQUM7SUFDRixNQUFNLENBQUMsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLElBQUksQ0FBUyxFQUFFLElBQXlCLENBQUM7SUFDekMsS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ2pCO1FBQ0ksSUFBSSx3QkFBd0IsQ0FB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