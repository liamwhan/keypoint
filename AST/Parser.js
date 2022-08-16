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
        userProps[k] = (k === "page-number")
            ? (v) === "true" ? true : false
            : v;
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
            document: ast,
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