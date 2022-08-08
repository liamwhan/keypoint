"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
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
                const content = parseContentString(token);
                console.log("Seeking for parent Style Block", slide.contents);
                const config = seekContentConfig(slide.contents);
                content.properties = Object.assign({}, config.properties);
                slide.contents.push(content);
                break;
            case "EOL":
                break;
        }
    }
    return ast;
}
exports.parse = parse;
module.exports = { parse };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLFNBQVMsV0FBVyxDQUFDLFlBQW9CO0lBQ3JDLE1BQU0sTUFBTSxHQUFXO1FBQ25CLEdBQUcsRUFBRSxDQUFDO1FBQ04sSUFBSSxFQUFFLENBQUM7S0FDVixDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNmLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFHRCxTQUFTLGVBQWUsQ0FBQyxLQUFzQjtJQUUzQyxJQUFJLFVBQVUsR0FBMEI7UUFDcEMsS0FBSyxFQUFFLFFBQVE7UUFDZixNQUFNLEVBQUUsS0FBSztRQUNiLElBQUksRUFBRSxPQUFPO1FBQ2IsV0FBVyxFQUFFLE1BQU07UUFDbkIsWUFBWSxFQUFFLFFBQVE7UUFDdEIsTUFBTSxFQUFFO1lBQ0osR0FBRyxFQUFFLENBQUM7WUFDTixJQUFJLEVBQUUsQ0FBQztTQUNWO0tBQ0osQ0FBQztJQUNGLE1BQU0sTUFBTSxHQUFtQjtRQUMzQixJQUFJLEVBQUUsWUFBWTtRQUNsQixVQUFVO0tBQ2IsQ0FBQztJQUVGLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFN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