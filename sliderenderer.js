let canvas, dpr, vw, vh, cx, cy;

const padY = 20;
const padX = 20;

function initCanvas()
{
    canvas = document.querySelector("#cnv");
    dpr = (window.devicePixelRatio === 1) ? 2 : window.devicePixelRatio;
    vw = document.documentElement.clientWidth;
    vh = document.documentElement.clientHeight;
    canvas.width = vw;
    canvas.height = vh;
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    cx = (canvas.width / 2);
    cy = (canvas.height / 2);
}

function dpiScale(n) {
    return n * dpr;
}


function getCtx() {
    return canvas.getContext("2d");
}

function clear(colour) {
    const ctx = getCtx();
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

function drawText(content) {
    const ctx = getCtx();
    const props = content.properties;
    const text = content.value;
    const font = props.font;
    const fontSize = props["font-size"];
    const fontSizePx = parseInt(fontSize.replace("px", ""));
    const colour = props["font-color"];
    const alignH = props.align;
    const alignV = props.valign;

    ctx.font = `${fontSize} ${font}`;
    ctx.fillStyle = colour;
    ctx.textBaseline = "bottom";
    ctx.textAlign = alignH;

    const tm = ctx.measureText(text);
    const th = tm.actualBoundingBoxAscent;
    let x, y;

    // TODO(liam): Calculate if the text will overflow the canvas and wrap

    if (alignH === "center")
    {
        x = cx;
    }
    else if (alignH === "right")
    {
        x = tm.width + (canvas.width - tm.width) - padX;
    }
    else {
        x = padX;
    }

    if (alignV === "center") {
        y = cy + (th / 2);
    }
    else if (alignV === "bottom")
    {
        y = canvas.height - padY;
    }
    else {
        y = padY + tm.actualBoundingBoxAscent;
    }

    ctx.fillText(text, x, y);

}

function renderSlide(slide) {
    initCanvas();
    clear(slide.properties.background);

    for (let c of slide.contents) {
        if (c.type === "Content") {
            switch (c.contentType) {
                case "string":
                    drawText(c);
                    break;
                default:
                    break;
            }
        }
    }
}


