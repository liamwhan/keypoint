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
function parseConfigBlock(token) {
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
        type: "ConfigBlock",
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
function defaultConfigBlock() {
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
        for (let j = contents.length - 1; j >= 0; --j) {
            const node = contents[j];
            if (node.type !== "ConfigBlock")
                continue;
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
                slide.properties = parseSlideProperties(token);
                break;
            case "ConfigBlock":
                slide.contents.push(parseConfigBlock(token));
                break;
            case "PageBreak":
                slide = newSlide();
                break;
            case "ContentString":
                const content = parseContentString(token);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLFNBQVMsV0FBVyxDQUFDLFlBQW9CO0lBQ3JDLE1BQU0sTUFBTSxHQUFXO1FBQ25CLEdBQUcsRUFBRSxDQUFDO1FBQ04sSUFBSSxFQUFFLENBQUM7S0FDVixDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNmLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFHRCxTQUFTLGdCQUFnQixDQUFDLEtBQXVCO0lBRTdDLElBQUksVUFBVSxHQUEwQjtRQUNwQyxLQUFLLEVBQUUsUUFBUTtRQUNmLE1BQU0sRUFBRSxLQUFLO1FBQ2IsSUFBSSxFQUFFLE9BQU87UUFDYixXQUFXLEVBQUUsTUFBTTtRQUNuQixZQUFZLEVBQUUsUUFBUTtRQUN0QixNQUFNLEVBQUU7WUFDSixHQUFHLEVBQUUsQ0FBQztZQUNOLElBQUksRUFBRSxDQUFDO1NBQ1Y7S0FDSixDQUFDO0lBQ0YsTUFBTSxNQUFNLEdBQW9CO1FBQzVCLElBQUksRUFBRSxhQUFhO1FBQ25CLFVBQVU7S0FDYixDQUFDO0lBRUYsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1B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