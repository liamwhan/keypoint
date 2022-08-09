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
    const slideProps = { background: "#FFFFFF", transition: { type: "none", duration: 0 } };
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
function parseContentImage(token) {
    if (token.type != "ImageBlock")
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
    const ast = {
        type: "Document",
        slides: []
    };
    function newSlide() {
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
    let slide;
    for (const token of tokens) {
        console.log("Parsing token type:", token.type);
        switch (token.type) {
            case "SlideProperties":
                slide = newSlide();
                slide.properties = parseSlideProperties(token);
                break;
            case "StyleBlock":
                slide.contents.push(parseStyleBlock(token));
                break;
            case "ContentString":
                {
                    const content = parseContentString(token);
                    const config = seekContentConfig(slide.contents);
                    content.properties = Object.assign({}, config.properties);
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