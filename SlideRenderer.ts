window.PS.Subscribe(Channel.KEYDOWN, "SlideRenderer", (key: string, KeyState: KeyState) =>
{
    if (key === " ")
    {

    }
});

let canvas: HTMLCanvasElement,
    dpr: number = 1.0,
    vw: number = document.documentElement.clientWidth,
    vh: number = document.documentElement.clientHeight,
    cx: number,
    cy: number;

const padY = 20;
const padX = 20;


interface ImagePreload
{
    src: string;
    img: HTMLImageElement;
}

interface VideoPreload
{
    src: string;
    video: HTMLVideoElement;
}

const preloadedImages: ImagePreload[] = [];
const preloadedVideos: VideoPreload[] = [];


let renderState: SlideRenderState = {
    currentLine: 0,
    currentFont: "Arial",
    currentFontSize: "12px",
    lastTextMetrics: undefined,
    activeSlide: undefined
}

// Preload images in the background on slide load so we can draw them faster
function preloadImages(ast: DocumentNode): void
{
    setTimeout(() =>
    {
        const imagePaths = ast.slides.map(s =>
        {
            const imgPaths = s.contents.filter(c => c.type === "Content" && (c as ContentNode).contentType === "image").map((c) => (c as ContentNode).value);
            return imgPaths;
        }).flat();
        for (const src of imagePaths)
        {
            const img = document.createElement("img");
            img.setAttribute("src", src);
            img.addEventListener("load", (e) =>
            {
                preloadedImages.push({ src, img });
            });
        }
    }, 0);
}



// Preload videos in the background on slide load so we can draw them faster
function preloadVideos(ast: DocumentNode): void
{
    setTimeout(() =>
    {
        const videoPaths = ast.slides.map(s =>
        {
            const vPaths = s.contents.filter(c => c.type === "Content" && (c as ContentNode).contentType === "video").map((c) => (c as ContentNode).value);
            return vPaths;
        }).flat();
        console.log("Preloading", videoPaths.length, "videos", videoPaths);
        for (const src of videoPaths)
        {
            const video = document.createElement("video");
            preloadedVideos.push({ src, video });
            video.setAttribute("src", src);
            video.setAttribute("preload", "auto");
        }
    }, 0)
}

function clearRenderState(): SlideRenderState
{
    const activeSlide = renderState.activeSlide;
    return renderState = {
        currentLine: 0,
        currentFont: "Arial",
        currentFontSize: "12px",
        lastTextMetrics: undefined,
        activeSlide
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

function dpiScale(n: number): number
{
    return n * dpr;
}


function getCtx(): CanvasRenderingContext2D
{
    return canvas.getContext("2d") as CanvasRenderingContext2D;
}

function clear(colour: string): void
{
    clearRenderState();
    colour = (colour.substring(0, 1) !== "#") ? `#${colour}` : colour;
    const ctx = getCtx();
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

function blend(colour1: string, a1: number, colour2: string, a2: number): void
{
    colour1 = (colour1.substring(0, 1) !== "#") ? `#${colour1}` : colour1;
    colour2 = (colour2.substring(0, 1) !== "#") ? `#${colour2}` : colour2;
    const ctx = getCtx();
    ctx.save();
    ctx.globalAlpha = a1;
    ctx.fillStyle = colour1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = a2;
    ctx.fillStyle = colour2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

}

// TODO(liam): This should take into account the font that was rendered and therefore should use TextMetrics
function calculateLineOffset(fontSizePx: number | string): number
{
    if (typeof (fontSizePx) === "string") fontSizePx = parseInt(fontSizePx.replace("px", ""));
    return renderState.currentLine * fontSizePx;
}

function drawImage(content: ContentNode, ctx?: CanvasRenderingContext2D): void
{
    ctx = ctx ?? getCtx();
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

    const { img } = preloadedImages.find(i => i.src === imagePath);
    const { naturalWidth: nw, naturalHeight: nh } = img;
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
        y = cy - (dh / 2) + offsetY
            //+ calculateLineOffset(renderState.currentFontSize)
            ;
    }
    else if (alignV === "top")
    {
        y = padY + offsetY
            //+ calculateLineOffset(renderState.currentFontSize)
            ;
    }
    else
    {
        y = canvas.height - dh - padY + offsetY + calculateLineOffset(renderState.currentFontSize);
    }

    ctx.drawImage(img, x, y, dw, dh);
}

function drawVideo(content: ContentNode, ctx?: CanvasRenderingContext2D, autoplay: boolean = true): void
{

    const videoPath = content.value;

    const { video } = preloadedVideos.find(i => i.src === videoPath);
    const playCallback = () =>
    {
        ctx = ctx ?? getCtx();

        if (video.paused || video.ended) return;
        const { videoWidth: nw, videoHeight: nh } = video;
        const scaleFactor = (canvas.width * 0.8) / nw;
        const dw = nw * scaleFactor;
        const dh = nh * scaleFactor;

        const { x, y } = calculateOrigin(dw, dh, content);

        ctx.drawImage(video, x, y, dw, dh);
        window.requestAnimationFrame(playCallback);
    };
    video.addEventListener("play", playCallback);
    if (autoplay)
    {
        video.play();
    }
    else
    {
        video.pause();
        video.currentTime = 0;
        playCallback(); // Render the first frame 
    }
}

/**
 * Calculates the x,y origin of an item. Do not use for text due to line breaks and other layout concerns
 * @param iw Intrinsic width of the item being rendered
 * @param ih Intrinsic height of the item being rendered
 * @param content The ContentNode
 */
function calculateOrigin(iw: number, ih: number, content: ContentNode): { x: number, y: number }
{
    const props = content.properties;
    const alignH = props.align;
    const alignV = props.valign;
    const offsetY = props.offset.top;
    const offsetX = props.offset.left;
    let x: number = 0, y: number = 0;

    if (alignH === "center")
    {
        x = cx - (iw / 2) + offsetX;
    }
    else if (alignH === "right")
    {
        x = canvas.width - iw - padX + offsetX;
    }
    else
    {
        x = padX + offsetX;
    }

    if (alignV === "center")
    {
        y = cy - (ih / 2) + offsetY;
    }
    else if (alignV === "bottom")
    {
        y = canvas.height - ih - padY + offsetY;
    }
    else
    {
        y = padY + offsetY;
    }
    return { x, y };
}

interface TextDimensions
{
    id: number;
    text: string;
    height: number;
    width: number;
    align: Align;
    valign: VerticalAlign;
    offset: Offset;
}

let slideText: TextDimensions[] = [];

function updateSlideTextDimensions(slide: SlideNode): void
{
    slideText = [];
    for(const c of slide.contents)
    {
        if (c.type !== "Content" || (c as ContentNode).contentType !== "string") continue;
        slideText.push(getTextDimensions(c as ContentNode));
    }
}

function getTextDimensions(content: ContentNode): TextDimensions
{
    const props = content.properties;
    const {value: text, id} = content;
    const {font, "font-size": fontSize, align, valign, offset} = props;

    const ctx = getCtx();

    ctx.textBaseline = "bottom";
    ctx.font = `${fontSize} ${font}`;
    ctx.textAlign = align;
    
    const tm = ctx.measureText(text);
    const height = tm.actualBoundingBoxAscent;
    const width = tm.width;
    ctx.restore();
    return { id, text, height, width, align, valign, offset };

}

function getLineOffset(td: TextDimensions)
{
    if (td.id === 0) return 0;

    const prevSameAlign = slideText.filter(t => t.id < td.id && t.valign === td.valign);
    if (!prevSameAlign.length) return 0;
    let offset = 0;
    prevSameAlign.map((t) => {
        offset += t.height;
    });
    return offset;
}

function drawText(content: ContentNode, ctx?: CanvasRenderingContext2D): void
{
    ctx = ctx ?? getCtx();
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

    const tm = renderState.lastTextMetrics = ctx.measureText(text);
    const th = tm.actualBoundingBoxAscent;
    const td = slideText.find(t => t.id === content.id);
    const lineOffset = getLineOffset(td);
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
    else
    {
        x = padX + offsetX;
    }

    if (alignV === "center")
    {
        y = cy + (th / 2)
            + lineOffset
            + offsetY;
    }
    else if (alignV === "bottom")
    {
        y = canvas.height - padY
            + lineOffset 
            + offsetY;
    }
    else
    {
        y = padY + tm.actualBoundingBoxAscent
            + lineOffset 
            + offsetY;
    }

    ctx.fillText(text, x, y);

}

function stopAll()
{
    for (const v of preloadedVideos)
    {
        const { video } = v;
        video.pause();
        video.currentTime = 0;
    }
}
type TransitionCompleteCallback = (slide: SlideNode) => void;

function transitionTo(slide: SlideNode, from: SlideNode | null, onComplete: TransitionCompleteCallback)
{
    const transition = slide.properties.transition;
    if (from === null || transition.type === "none")
    {
        renderState.activeSlide = slide;
        onComplete(slide);
        return;
    }
    const prevSlide = from;
    renderState.activeSlide = slide;

    const ctx = getCtx();
    ctx.save();
    let start: number;
    const af: FrameRequestCallback = (t) =>
    {
        if (start === undefined) start = t;
        let elasped = t - start;
        if (elasped >= transition.duration)
        {
            ctx.restore();
            onComplete(slide);
            return;
        }
        const a = elasped / transition.duration;
        const a2 = 1 - a;
        
        blend(slide.properties.background, a, prevSlide.properties.background, a2);
        
        ctx.globalAlpha = a2;
        renderContents(prevSlide, ctx, false);

        ctx.globalAlpha = a;
        renderContents(slide, ctx, false);
        
        window.requestAnimationFrame(af);
    };
    window.requestAnimationFrame(af);

}

function renderContents(slide: SlideNode, ctx?: CanvasRenderingContext2D, autoplay?: boolean): void
{
    updateSlideTextDimensions(slide);
    ctx = ctx ?? getCtx();
    for (let c of slide.contents)
    {
        if (c.type === "Content")
        {
            switch ((c as ContentNode).contentType) 
            {
                case "string":
                    drawText(c as ContentNode, ctx);
                    break;
                case "image":
                    drawImage(c as ContentNode, ctx);
                    break;
                case "video":
                    drawVideo(c as ContentNode, ctx, autoplay);
                    break;
                default:
                    break;
            }
        }
    }
}

function getPreviousSlide(toSlide: SlideNode): SlideNode | null
{
    if (!renderState.activeSlide) return null;
    return (toSlide.id > renderState.activeSlide.id) ? toSlide.prev : toSlide.next;
}

function renderClear(s: SlideNode)
{
    updateSlideTextDimensions(s);

    clear(s.properties.background);
    for (let c of s.contents)
    {
        if (c.type === "Content")
        {
            switch ((c as ContentNode).contentType)
            {
                case "string":
                    drawText(c as ContentNode);
                    break;
                case "image":
                    drawImage(c as ContentNode);
                    break;
                case "video":
                    drawVideo(c as ContentNode, undefined, true);
                    break;
                default:
                    break;
            }
        }
    }
}

function changeSlide(slide: SlideNode): void
{
    stopAll();
    if (slide === renderState.activeSlide) 
    {
        renderClear(slide);
        return;
    }
    const prev = getPreviousSlide(slide);
    transitionTo(slide, prev, renderClear);

}


