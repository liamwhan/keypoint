window.PS.Subscribe(Channel.KEYDOWN, "SlideRenderer", (key: string, KeyState: KeyState) =>
{
    if (key === " ")
    {
        playSlideVideo();
    }
});

const btnPlay = document.querySelector("#btnPlay") as HTMLButtonElement;

function playSlideVideo()
{
    const slideState = window.SlideState;
    if (!slideState) {
        console.error("SlideState is not set");
        return;
    }

    if (slideState.slideHasVideo())
    {
        if (slideState.videoPlaying)
        {
            stopAll();
            renderContents(slideState.activeSlide, undefined, true);
        }
        else {
            hidePlayButton();
            const videoNode = slideState.activeSlide.contents.find(c => c.type === "Content" && (c as ContentNode).contentType === "video");
            if (!videoNode) return;
            slideState.videoPlaying = true;
            drawVideo(videoNode as ContentNode, true);
        }

    }
}

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
    
    ctx.restore();
    ctx.globalAlpha = a2;
    ctx.fillStyle = colour2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

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
            ;
    }
    else if (alignV === "top")
    {
        y = padY + offsetY
            ;
    }
    else
    {
        y = canvas.height - dh - padY + offsetY 
        // + calculateLineOffset(renderState.currentFontSize)
        ;
    }

    ctx.drawImage(img, x, y, dw, dh);
}

function drawVideo(content: ContentNode, play: boolean, ctx?: CanvasRenderingContext2D): void
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
    if (play)
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

function drawHeader(headerName: string, slide: SlideNode): void
{
    const ctx = getCtx();
    ctx.save();
    if (!slide.document.headers.hasOwnProperty(headerName)) return;
    const header = slide.document.headers[headerName];
    if (!header) return;
    
    const style = header.contents.find(c => c.type === "StyleBlock") as StyleBlockNode;
    if (!style) throw new Error("Could not find a style block in the header contents. This is a bug, there should be a default one");
    const fontSize = parseInt(style.properties["font-size"].replace("px", "")) * 2;
    
    ctx.font = `${fontSize}px ${style.properties.font}`;
    ctx.fillStyle = `#${style.properties["font-color"]}`;
    ctx.textAlign = style.properties.align;
    if (header.properties["page-number"])
    {
        ctx.textAlign = "right";
        const text = `${slide.id + 1}`;
        const ptm = ctx.measureText(text);
        const pw = ptm.width;
        const ph = ptm.actualBoundingBoxAscent;
        const x = canvas.width - pw - padX;
        const y = ph + padY;
        ctx.fillText(text, x, y);
    }
    
    const contents = header.contents.filter(c => c.type === "Content" && (c as ContentNode).contentType === "string");
    const line = 0;
    ctx.textAlign = style.properties.align;
    
    for (let c of contents)
    {
        const content = c as ContentNode;
        const text = content.value;
        const htm = ctx.measureText(text);
        const hw = htm.width;
        const hh = htm.actualBoundingBoxAscent;
        const x = padX;
        const y = hh + padY;
        ctx.fillText(text, x, y);
    }
    ctx.restore();

}
function drawFooter(footerName: string, slide: SlideNode): void
{
    const ctx = getCtx();
    ctx.save();
    if (!slide.document.footers.hasOwnProperty(footerName)) return;
    const footer = slide.document.footers[footerName];
    if (!footer) return;
    console.log("drawHeader", footer)
    
    const style = footer.contents.find(c => c.type === "StyleBlock") as StyleBlockNode;
    if (!style) throw new Error("Could not find a style block in the header contents. This is a bug, there should be a default one");
    const fontSize = parseInt(style.properties["font-size"].replace("px", "")) * 2;
    
    ctx.font = `${fontSize}px ${style.properties.font}`;
    ctx.fillStyle = `#${style.properties["font-color"]}`;
    ctx.textAlign = style.properties.align;
    if (footer.properties["page-number"])
    {
        ctx.textAlign = "right";
        const text = `${slide.id + 1}`;
        const ptm = ctx.measureText(text);
        const pw = ptm.width;
        const ph = ptm.actualBoundingBoxAscent;
        const x = canvas.width - pw - padX;
        const y = ph + padY;
        console.log("Drawing Page Number", text, "at", `{${x},${y}}`);
        ctx.fillText(text, x, y);
    }
    
    const contents = footer.contents.filter(c => c.type === "Content" && (c as ContentNode).contentType === "string");
    const line = 0;
    ctx.textAlign = style.properties.align;
    
    for (let c of contents)
    {
        const content = c as ContentNode;
        const text = content.value;
        const htm = ctx.measureText(text);
        const hw = htm.width;
        const hh = htm.actualBoundingBoxAscent;
        const x = padX;
        const y = hh + padY;
        console.log("Drawing Header", text, "at", `{${x},${y}}`);
        ctx.fillText(text, x, y);
    }
    ctx.restore();

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

    window.SlideState.videoPlaying = false;
    if (window.SlideState.slideHasVideo())
    {
        showPlayButton();
    }
    for (const v of preloadedVideos)
    {
        const { video } = v;
        video.pause();
        video.currentTime = 0;
    }
}

function getPreviousSlide(toSlide: SlideNode): SlideNode | null
{
    if (!renderState.activeSlide) return null;
    return (toSlide.id > renderState.activeSlide.id) ? toSlide.prev : toSlide.next;
}

function renderContents(slide: SlideNode, ctx?: CanvasRenderingContext2D, clearCanvas: boolean = false): void
{
    if (clearCanvas)
    {
        clear(slide.properties.background);
    }
    updateSlideTextDimensions(slide);
    if (slide.properties.header)
    {
        drawHeader(slide.properties.header, slide);
    }

    if (slide.properties.footer)
    {
        drawFooter(slide.properties.footer, slide);
    }
    
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
                    drawVideo(c as ContentNode, false, ctx);
                    break;
                default:
                    break;
            }
        }
    }
}

function slideHasVideo(slide: SlideNode) : boolean
{
    return slide.contents.some((c: KPNode) => c.type === "Content" && (c as ContentNode).contentType === "video");
}

type TransitionCompleteCallback = (slide: SlideNode, ctx?: CanvasRenderingContext2D, clearCanvas?: boolean) => void;

function transitionTo(to: SlideNode, from: SlideNode | null, onComplete: TransitionCompleteCallback)
{
    const transition = to.properties.transition;
    if (from === null || transition.type === "none")
    {
        renderState.activeSlide = to;
        onComplete(to, undefined, true);
        return;
    }
    renderState.activeSlide = to;

    const ctx = getCtx();
    ctx.save();
    let start: number;
    const af: FrameRequestCallback = (t) =>
    {
        if (start === undefined) start = t;
        let dt = t - start;
        if (dt >= transition.duration)
        {
            ctx.restore();
            setPlayButtonAlpha(1);
            onComplete(to, undefined, true);
            return;
        }

        
        const a = dt / transition.duration;
        const a2 = 1 - a;
        if (slideHasVideo(to))
        {
            setPlayButtonAlpha(a);
        }
        else if (slideHasVideo(from))
        {
            setPlayButtonAlpha(a2);
        }
        
        blend(to.properties.background, a, from.properties.background, a2);
        
        ctx.globalAlpha = a2;
        renderContents(from, ctx, false);

        ctx.globalAlpha = a;
        renderContents(to, ctx, false);
        ctx.restore();
        
        window.requestAnimationFrame(af);
    };
    window.requestAnimationFrame(af);

}

function btnPlayClickHandler (e: Event): void{
    const btnPlay = document.querySelector("#btnPlay") as HTMLButtonElement;
    btnPlay.parentElement.classList.add("hide");
    playSlideVideo();
}

function setPlayButtonAlpha(a: number)
{
    const css = `${a.toFixed(1)}`;
    btnPlay.parentElement.style.opacity = css;
}

function showPlayButton(): void
{
    btnPlay.parentElement.classList.remove("hide");
    btnPlay.addEventListener("click", btnPlayClickHandler);
}

function hidePlayButton(): void
{
    btnPlay.parentElement.classList.add("hide")
    btnPlay.removeEventListener("click", btnPlayClickHandler);
}

function changeSlide(slide: SlideNode): void
{
    stopAll();
    if (slideHasVideo(slide))
    {
        showPlayButton();
    } 
    else 
    {
        hidePlayButton();
    }
    if (slide === renderState.activeSlide) 
    {
        renderContents(slide, undefined, true);
        return;
    }
    const prev = getPreviousSlide(slide);
    transitionTo(slide, prev, renderContents);

}


