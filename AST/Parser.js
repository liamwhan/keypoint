"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const path_1 = __importDefault(require("path"));
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
    const slideProps = { background: "#FFFFFF" };
    const userProps = {};
    if (token.properties.length < 2)
        return slideProps;
    for (let i = 0; i < token.properties.length; i += 2) {
        const k = token.properties[i].value;
        const v = token.properties[i + 1].value;
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
    const filepath = path_1.default.resolve(__dirname, token.properties[pathIndex].value);
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
            contents: []
        };
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
            case "EOL":
                break;
        }
    }
    return ast;
}
exports.parse = parse;
module.exports = { parse };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUV4QixTQUFTLFdBQVcsQ0FBQyxZQUFvQjtJQUNyQyxNQUFNLE1BQU0sR0FBVztRQUNuQixHQUFHLEVBQUUsQ0FBQztRQUNOLElBQUksRUFBRSxDQUFDO0tBQ1YsQ0FBQztJQUNGLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEMsS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDZixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNyQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsS0FBc0I7SUFDM0MsSUFBSSxVQUFVLEdBQTBCO1FBQ3BDLEtBQUssRUFBRSxRQUFRO1FBQ2YsTUFBTSxFQUFFLEtBQUs7UUFDYixJQUFJLEVBQUUsT0FBTztRQUNiLFdBQVcsRUFBRSxNQUFNO1FBQ25CLFlBQVksRUFBRSxRQUFRO1FBQ3RCLE1BQU0sRUFBRTtZQUNKLEdBQUcsRUFBRSxDQUFDO1lBQ04sSUFBSSxFQUFFLENBQUM7U0FDVjtLQUNKLENBQUM7SUFDRixNQUFNLE1BQU0sR0FBbUI7UUFDM0IsSUFBSSxFQUFFLFlBQVk7UUFDbEIsVUFBVTtLQUNiLENBQUM7SUFFRixJQUFJLEtBQUssQ0FB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