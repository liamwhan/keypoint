let canvas:HTMLCanvasElement, 
    dpr:number  = 1.0, 
    vw:number   = document.documentElement.clientWidth,
    vh:number   = document.documentElement.clientHeight,
    cx:number, 
    cy:number;

const padY = 20;
const padX = 20;

interface ImagePreload
{
    src: string;
    img: HTMLImageElement;
}
const preloadedImages: ImagePreload[] = [];

let renderState: SlideRenderState = {
    currentLine: 0,
    currentFont: "Arial",
    currentFontSize: "12px",
    lastTextMetrics: undefined
}

// Preload images in the background on slide load so we can draw them faster
function preloadImages(ast: DocumentNode)
{   
    setTimeout(() => {
        const imagePaths = ast.slides.map(s => {
            const imgPaths = s.contents.filter(c => c.type === "Content" && (c as ContentNode).contentType === "image").map((c) => (c as ContentNode).value);
            return imgPaths;
        }).flat();
        for(const src of imagePaths)
        {
            const img = document.createElement("img");
            img.setAttribute("src", src);
            img.addEventListener("load", (e) => {
                preloadedImages.push({src, img});
            });
        }
    }, 1)
}

function clearRenderState(): SlideRenderState
{
    return renderState = {
        currentLine: 0,
        currentFont: "Arial",
        currentFontSize: "12px",
        lastTextMetrics: undefined
    }
}

function initCanvas(): void
{
    canvas = document.querySelector("#cnv") as HTMLCanvasElement;
    if (canvas === null)
    {
        console.error("Canvas element not found");
        return;   
    }
    dpr = (window.devicePixelRatio === 1) ? 2 : window.devicePixelRatio;
    vw = document.documentElement.clientWidth;
    vh = document.documentElement.clientHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    cx = (canvas.width / 2);
    cy = (canvas.height / 2);
}

function dpiScale(n: number): number {
    return n * dpr;
}


function getCtx(): CanvasRenderingContext2D {
    return canvas.getContext("2d") as CanvasRenderingContext2D;
}

function clear(colour: string): void {
    clearRenderState();
    colour = (colour.substring(0,1) !== "#") ? `#${colour}` : colour;
    const ctx = getCtx();
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

// TODO(liam): This should take into account the font that was rendered and therefore should use TextMetrics
function calculateLineOffset(fontSizePx: number | string): number
{
    if (typeof(fontSizePx) === "string") fontSizePx = parseInt(fontSizePx.replace("px", ""));
    return renderState.currentLine * fontSizePx;
}

function drawImage(content: ContentNode): void {
    const ctx = getCtx();
    const props = content.properties;
    const imagePath = content.value;
    const alignH = props.align;
    const alignV = props.valign;
    const offsetY = props.offset.top;
    const offsetX = props.offset.left;
    const dwp = parseFloat(props.width.replace("%", "")) / 100;
    let dhp = parseFloat(props.height.replace("%", "")) / 100;
    if (dhp === 1 && dwp !== 1) dhp = dwp; // Constrain Aspect Ratio;
    
    let x: number, y: number;

    const {img} = preloadedImages.find(i => i.src === imagePath);
    const { naturalWidth: nw, naturalHeight: nh} = img;
    const dw = nw * dwp;
    const dh = nh * dhp;
    
    if (alignH === "center")
    {
        x = cx - (dw / 2) + offsetX;
    }
    else if (alignH === "left")
    {
        x = padX + offsetX;
    }
    else 
    {
        x = canvas.width - dw + offsetX;
    }

    if (alignV === "center")
    {
        y = cy - (dh / 2) + offsetY + calculateLineOffset(renderState.currentFontSize);
    }
    else if (alignV === "top")
    {
        y = padY + offsetY + calculateLineOffset(renderState.currentFontSize);
    }
    else
    {
        y = canvas.height - dh - padY + offsetY + calculateLineOffset(renderState.currentFontSize);
    }

    ctx.drawImage(img, x, y, dw, dh);
}

function drawText(content: ContentNode): void {
    const ctx = getCtx();
    const props = content.properties;
    const text = content.value;
    const font = renderState.currentFont = props.font;
    const fontSize = renderState.currentFontSize = props["font-size"];
    const fontSizePx = parseInt(fontSize.replace("px", ""));
    const colour = "#" + props["font-color"];
    const alignH = props.align;
    const alignV = props.valign;
    const offsetY = props.offset.top;
    const offsetX = props.offset.left;

    ctx.font = `${fontSize} ${font}`;
    ctx.fillStyle = colour;
    ctx.textBaseline = "bottom";
    ctx.textAlign = alignH;

    const tm = ctx.measureText(text);
    const th = tm.actualBoundingBoxAscent;
    let x: number, y: number;

    // TODO(liam): Calculate if the text will overflow the canvas and wrap

    if (alignH === "center")
    {
        x = cx + offsetX;
    }
    else if (alignH === "right")
    {
        x = tm.width + (canvas.width - tm.width) - padX + offsetX;
    }
    else {
        x = padX + offsetX;
    }

    if (alignV === "center") {
        y = cy + (th / 2) + calculateLineOffset(fontSizePx) + offsetY;
    }
    else if (alignV === "bottom")
    {
        y = canvas.height - padY + calculateLineOffset(fontSizePx) + offsetY;
    }
    else {
        y = padY + tm.actualBoundingBoxAscent + calculateLineOffset(fontSizePx) + offsetY;
    }

    ctx.fillText(text, x, y);
    renderState.currentLine++;

}

function renderSlide(slide: SlideNode): void {
    initCanvas();
    clear(slide.properties.background);

    for (let c of slide.contents) {
        if (c.type === "Content") {
            switch ((c as ContentNode).contentType) {
                case "string":
                    drawText(c as ContentNode);
                    break;
                case "image": 
                    drawImage(c as ContentNode);
                    break;
                default:
                    break;
            }
        }
    }
}


