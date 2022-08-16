window.PS.Subscribe(Channel.KEYDOWN, "SlideRenderer", (key, KeyState) => {
    if (key === " ") {
    }
});
let canvas, dpr = 1.0, vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight, cx, cy;
const padY = 20;
const padX = 20;
const preloadedImages = [];
const preloadedVideos = [];
let renderState = {
    currentLine: 0,
    currentFont: "Arial",
    currentFontSize: "12px",
    lastTextMetrics: undefined,
    activeSlide: undefined
};
function preloadImages(ast) {
    setTimeout(() => {
        const imagePaths = ast.slides.map(s => {
            const imgPaths = s.contents.filter(c => c.type === "Content" && c.contentType === "image").map((c) => c.value);
            return imgPaths;
        }).flat();
        for (const src of imagePaths) {
            const img = document.createElement("img");
            img.setAttribute("src", src);
            img.addEventListener("load", (e) => {
                preloadedImages.push({ src, img });
            });
        }
    }, 0);
}
function preloadVideos(ast) {
    setTimeout(() => {
        const videoPaths = ast.slides.map(s => {
            const vPaths = s.contents.filter(c => c.type === "Content" && c.contentType === "video").map((c) => c.value);
            return vPaths;
        }).flat();
        console.log("Preloading", videoPaths.length, "videos", videoPaths);
        for (const src of videoPaths) {
            const video = document.createElement("video");
            preloadedVideos.push({ src, video });
            video.setAttribute("src", src);
            video.setAttribute("preload", "auto");
        }
    }, 0);
}
function clearRenderState() {
    const activeSlide = renderState.activeSlide;
    return renderState = {
        currentLine: 0,
        currentFont: "Arial",
        currentFontSize: "12px",
        lastTextMetrics: undefined,
        activeSlide
    };
}
function initCanvas() {
    canvas = document.querySelector("#cnv");
    if (canvas === null) {
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
function dpiScale(n) {
    return n * dpr;
}
function getCtx() {
    return canvas.getContext("2d");
}
function clear(colour) {
    clearRenderState();
    colour = (colour.substring(0, 1) !== "#") ? `#${colour}` : colour;
    const ctx = getCtx();
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function blend(colour1, a1, colour2, a2) {
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
function drawImage(content, ctx) {
    ctx = ctx !== null && ctx !== void 0 ? ctx : getCtx();
    const props = content.properties;
    const imagePath = content.value;
    const alignH = props.align;
    const alignV = props.valign;
    const offsetY = props.offset.top;
    const offsetX = props.offset.left;
    const dwp = parseFloat(props.width.replace("%", "")) / 100;
    let dhp = parseFloat(props.height.replace("%", "")) / 100;
    if (dhp === 1 && dwp !== 1)
        dhp = dwp;
    let x, y;
    const { img } = preloadedImages.find(i => i.src === imagePath);
    const { naturalWidth: nw, naturalHeight: nh } = img;
    const dw = nw * dwp;
    const dh = nh * dhp;
    if (alignH === "center") {
        x = cx - (dw / 2) + offsetX;
    }
    else if (alignH === "left") {
        x = padX + offsetX;
    }
    else {
        x = canvas.width - dw + offsetX;
    }
    if (alignV === "center") {
        y = cy - (dh / 2) + offsetY;
    }
    else if (alignV === "top") {
        y = padY + offsetY;
    }
    else {
        y = canvas.height - dh - padY + offsetY;
    }
    ctx.drawImage(img, x, y, dw, dh);
}
function drawVideo(content, ctx, autoplay = true) {
    const videoPath = content.value;
    const { video } = preloadedVideos.find(i => i.src === videoPath);
    const playCallback = () => {
        ctx = ctx !== null && ctx !== void 0 ? ctx : getCtx();
        if (video.paused || video.ended)
            return;
        const { videoWidth: nw, videoHeight: nh } = video;
        const scaleFactor = (canvas.width * 0.8) / nw;
        const dw = nw * scaleFactor;
        const dh = nh * scaleFactor;
        const { x, y } = calculateOrigin(dw, dh, content);
        ctx.drawImage(video, x, y, dw, dh);
        window.requestAnimationFrame(playCallback);
    };
    video.addEventListener("play", playCallback);
    if (autoplay) {
        video.play();
    }
    else {
        video.pause();
        video.currentTime = 0;
        playCallback();
    }
}
function calculateOrigin(iw, ih, content) {
    const props = content.properties;
    const alignH = props.align;
    const alignV = props.valign;
    const offsetY = props.offset.top;
    const offsetX = props.offset.left;
    let x = 0, y = 0;
    if (alignH === "center") {
        x = cx - (iw / 2) + offsetX;
    }
    else if (alignH === "right") {
        x = canvas.width - iw - padX + offsetX;
    }
    else {
        x = padX + offsetX;
    }
    if (alignV === "center") {
        y = cy - (ih / 2) + offsetY;
    }
    else if (alignV === "bottom") {
        y = canvas.height - ih - padY + offsetY;
    }
    else {
        y = padY + offsetY;
    }
    return { x, y };
}
let slideText = [];
function updateSlideTextDimensions(slide) {
    slideText = [];
    for (const c of slide.contents) {
        if (c.type !== "Content" || c.contentType !== "string")
            continue;
        slideText.push(getTextDimensions(c));
    }
}
function getTextDimensions(content) {
    const props = content.properties;
    const { value: text, id } = content;
    const { font, "font-size": fontSize, align, valign, offset } = props;
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
function getLineOffset(td) {
    if (td.id === 0)
        return 0;
    const prevSameAlign = slideText.filter(t => t.id < td.id && t.valign === td.valign);
    if (!prevSameAlign.length)
        return 0;
    let offset = 0;
    prevSameAlign.map((t) => {
        offset += t.height;
    });
    return offset;
}
function drawHeader(headerName, slide) {
    const ctx = getCtx();
    ctx.save();
    if (!slide.document.headers.hasOwnProperty(headerName))
        return;
    const header = slide.document.headers[headerName];
    if (!header)
        return;
    console.log("drawHeader", header);
    const style = header.contents.find(c => c.type === "StyleBlock");
    if (!style)
        throw new Error("Could not find a style block in the header contents. This is a bug, there should be a default one");
    const fontSize = parseInt(style.properties["font-size"].replace("px", "")) * 2;
    ctx.font = `${fontSize}px ${style.properties.font}`;
    ctx.fillStyle = `#${style.properties["font-color"]}`;
    ctx.textAlign = style.properties.align;
    if (header.properties["page-number"]) {
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
    const contents = header.contents.filter(c => c.type === "Content" && c.contentType === "string");
    const line = 0;
    ctx.textAlign = style.properties.align;
    for (let c of contents) {
        const content = c;
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
function drawFooter(headerName, slide) {
    const ctx = getCtx();
    ctx.save();
    if (!slide.document.headers.hasOwnProperty(headerName))
        return;
    const header = slide.document.headers[headerName];
    if (!header)
        return;
    console.log("drawHeader", header);
    const style = header.contents.find(c => c.type === "StyleBlock");
    if (!style)
        throw new Error("Could not find a style block in the header contents. This is a bug, there should be a default one");
    const fontSize = parseInt(style.properties["font-size"].replace("px", "")) * 2;
    ctx.font = `${fontSize}px ${style.properties.font}`;
    ctx.fillStyle = `#${style.properties["font-color"]}`;
    ctx.textAlign = style.properties.align;
    if (header.properties["page-number"]) {
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
    const contents = header.contents.filter(c => c.type === "Content" && c.contentType === "string");
    const line = 0;
    ctx.textAlign = style.properties.align;
    for (let c of contents) {
        const content = c;
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
function drawText(content, ctx) {
    ctx = ctx !== null && ctx !== void 0 ? ctx : getCtx();
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
    let x, y;
    if (alignH === "center") {
        x = cx + offsetX;
    }
    else if (alignH === "right") {
        x = tm.width + (canvas.width - tm.width) - padX + offsetX;
    }
    else {
        x = padX + offsetX;
    }
    if (alignV === "center") {
        y = cy + (th / 2)
            + lineOffset
            + offsetY;
    }
    else if (alignV === "bottom") {
        y = canvas.height - padY
            + lineOffset
            + offsetY;
    }
    else {
        y = padY + tm.actualBoundingBoxAscent
            + lineOffset
            + offsetY;
    }
    ctx.fillText(text, x, y);
}
function stopAll() {
    for (const v of preloadedVideos) {
        const { video } = v;
        video.pause();
        video.currentTime = 0;
    }
}
function getPreviousSlide(toSlide) {
    if (!renderState.activeSlide)
        return null;
    return (toSlide.id > renderState.activeSlide.id) ? toSlide.prev : toSlide.next;
}
function renderContents(slide, ctx, autoplay) {
    updateSlideTextDimensions(slide);
    if (slide.properties.header) {
        drawHeader(slide.properties.header, slide);
    }
    ctx = ctx !== null && ctx !== void 0 ? ctx : getCtx();
    for (let c of slide.contents) {
        if (c.type === "Content") {
            switch (c.contentType) {
                case "string":
                    drawText(c, ctx);
                    break;
                case "image":
                    drawImage(c, ctx);
                    break;
                case "video":
                    drawVideo(c, ctx, autoplay);
                    break;
                default:
                    break;
            }
        }
    }
}
function renderClear(s) {
    updateSlideTextDimensions(s);
    clear(s.properties.background);
    if (s.properties.header) {
        drawHeader(s.properties.header, s);
    }
    for (let c of s.contents) {
        if (c.type === "Content") {
            switch (c.contentType) {
                case "string":
                    drawText(c);
                    break;
                case "image":
                    drawImage(c);
                    break;
                case "video":
                    drawVideo(c, undefined, true);
                    break;
                default:
                    break;
            }
        }
    }
}
function transitionTo(slide, from, onComplete) {
    const transition = slide.properties.transition;
    if (from === null || transition.type === "none") {
        renderState.activeSlide = slide;
        onComplete(slide);
        return;
    }
    const prevSlide = from;
    renderState.activeSlide = slide;
    const ctx = getCtx();
    ctx.save();
    let start;
    const af = (t) => {
        if (start === undefined)
            start = t;
        let elasped = t - start;
        if (elasped >= transition.duration) {
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
function changeSlide(slide) {
    stopAll();
    if (slide === renderState.activeSlide) {
        renderClear(slide);
        return;
    }
    const prev = getPreviousSlide(slide);
    transitionTo(slide, prev, renderClear);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2xpZGVSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlNsaWRlUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQyxHQUFXLEVBQUUsUUFBa0IsRUFBRSxFQUFFO0lBRXRGLElBQUksR0FBRyxLQUFLLEdBQUcsRUFDZjtLQUVDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE1BQXlCLEVBQ3pCLEdBQUcsR0FBVyxHQUFHLEVBQ2pCLEVBQUUsR0FBVyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFDakQsRUFBRSxHQUFXLFFBQVEsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUNsRCxFQUFVLEVBQ1YsRUFBVSxDQUFDO0FBRWYsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQWVoQixNQUFNLGVBQWUsR0FBbUIsRUFBRSxDQUFDO0FBQzNDLE1BQU0sZUFBZSxHQUFtQixFQUFFLENBQUM7QUFHM0MsSUFBSSxXQUFXLEdBQXFCO0lBQ2hDLFdBQVcsRUFBRSxDQUFDO0lBQ2QsV0FBVyxFQUFFLE9BQU87SUFDcEIsZUFBZSxFQUFFLE1BQU07SUFDdkIsZUFBZSxFQUFFLFNBQVM7SUFDMUIsV0FBVyxFQUFFLFNBQVM7Q0FDekIsQ0FBQTtBQUdELFNBQVMsYUFBYSxDQUFDLEdBQWlCO0lBRXBDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFFWixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUVsQyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFLLENBQWlCLENBQUMsV0FB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