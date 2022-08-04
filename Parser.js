

function parseConfigBlock(token)
{
    const config = {
        align: "center",
        valign: "top",
        font: "Arial",
        "font-size": "12px",
        "offset": {
            top: 0,
            left: 0
        }
    };
    const userConfigProperties = token.value.split(" ");
    console.log(userConfigProperties);
    const userConfig = {};
    for(let c of userConfigProperties)
    {
        const s = c.split("=");
        userConfig[s[0]] = s[1].replace(/\"/g, "");
    }
    return {
        type: "ConfigBlock",
        properties: {...config, ...userConfig}
    };
}
function parseSlideProperties(token)
{
    const props = {
        background: "#FFFFFF"
    }
    if (token.value.length < 1) return props;
    const userProps = token.value.split(" ");
    const userProperties = {};
    for(let p of userProps)
    {
        userProperties[p[0]] = p[1];
    }
    return {
        type: "SlideProperties",
        properties: {...props, ...userProperties}
    };
}

function parseContentString(token)
{
    if (token.type != "ContentString") throw new Error("Parse Error: parseContentString called on token that is not a ContentString. Token Type: ", token.type);
    return token.value;
}


function parse(tokens)
{
    let slideN = 0;
    const ast = {
        type: "Document",
        slides: []
    }

    function newSlide()
    {
        slideN++;
        const slide =  {
            type: "Slide",
            id: slideN,
            properties: {},
            contents: []
        };
        ast.slides.push(slide);
        return slide;
    }
    let slide = newSlide();

    for(const token of tokens)
    {
        switch (token.type)
        {
            case "SlideProperties":
                slide.properties = parseSlideProperties(token);
                break;
            case "ConfigBlock":
                slide.contents.push(parseConfigBlock(token))
                break;
            case "PageBreak":
                slide = newSlide();
                break;
            case "ContentString":
                slide.contents.push(parseContentString(token));
                break;
            case "EOL":
                slide.contents.push({type: "EOL"});
            
        }
    }
    return ast;
}

module.exports = {parse};