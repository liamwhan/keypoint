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
                headerN++;
                const headerProperties = parseHeaderProperties(token);
                if (headerProperties.name === "")
                    headerProperties.name = `header-${headerN}`;
                const contents = getContentTokensToNextSlide(token, tokens);
                const lastToken = contents[contents.length - 1];
                const lastIdx = tokens.indexOf(lastToken);
                i = lastIdx;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4Qix1Q0FBNkI7QUFFN0IsU0FBUyxXQUFXLENBQUMsWUFBb0I7SUFDckMsTUFBTSxNQUFNLEdBQVc7UUFDbkIsR0FBRyxFQUFFLENBQUM7UUFDTixJQUFJLEVBQUUsQ0FBQztLQUNWLENBQUM7SUFDRixNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ2YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDckMsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQUNELE1BQU0sdUJBQXVCLEdBQTBCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDcEUsU0FBUyxlQUFlLENBQUMsZUFBdUI7SUFFNUMsTUFBTSxVQUFVLEdBQW9CO1FBQ2hDLElBQUksRUFBRSxVQUFVO1FBQ2hCLFFBQVEsRUFBRSxDQUFDO0tBQ2QsQ0FBQztJQUNGLE1BQU0sQ0FBQyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckMsSUFBSSxDQUFTLEVBQUUsSUFBeUIsQ0FBQztJQUN6QyxLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDaEI7UUFDSSxJQUFJLHdCQUF3QixDQUFD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