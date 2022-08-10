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
function calculateLineOffset(fontSizePx) {
    if (typeof (fontSizePx) === "string")
        fontSizePx = parseInt(fontSizePx.replace("px", ""));
    return renderState.currentLine * fontSizePx;
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
        y = cy - (dh / 2) + offsetY + calculateLineOffset(renderState.currentFontSize);
    }
    else if (alignV === "top") {
        y = padY + offsetY + calculateLineOffset(renderState.currentFontSize);
    }
    else {
        y = canvas.height - dh - padY + offsetY + calculateLineOffset(renderState.currentFontSize);
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
    tm.actualBoundingBoxDescent;
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
            + offsetY;
    }
    else if (alignV === "bottom") {
        y = canvas.height - padY
            + offsetY;
    }
    else {
        y = padY + tm.actualBoundingBoxAscent
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
        renderContents(prevSlide, ctx);
        ctx.globalAlpha = a;
        renderContents(slide, ctx);
        window.requestAnimationFrame(af);
    };
    window.requestAnimationFrame(af);
}
function renderContents(slide, ctx) {
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
                    drawVideo(c, ctx, false);
                    break;
                default:
                    break;
            }
        }
    }
}
function getPreviousSlide(toSlide) {
    if (!renderState.activeSlide)
        return null;
    return (toSlide.id > renderState.activeSlide.id) ? toSlide.prev : toSlide.next;
}
function changeSlide(slide) {
    if (slide === renderState.activeSlide)
        return;
    stopAll();
    const prev = getPreviousSlide(slide);
    transitionTo(slide, prev, (s) => {
        clear(s.properties.background);
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
                        drawVideo(c);
                        break;
                    default:
                        break;
                }
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2xpZGVSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlNsaWRlUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQyxHQUFXLEVBQUUsUUFBa0IsRUFBRSxFQUFFO0lBQ3RGLElBQUksR0FBRyxLQUFLLEdBQUcsRUFDZjtLQUVDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE1BQXdCLEVBQ3hCLEdBQUcsR0FBVyxHQUFHLEVBQ2pCLEVBQUUsR0FBWSxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFDbEQsRUFBRSxHQUFZLFFBQVEsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUNuRCxFQUFTLEVBQ1QsRUFBUyxDQUFDO0FBRWQsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQWVoQixNQUFNLGVBQWUsR0FBbUIsRUFBRSxDQUFDO0FBQzNDLE1BQU0sZUFBZSxHQUFtQixFQUFFLENBQUM7QUFHM0MsSUFBSSxXQUFXLEdBQXFCO0lBQ2hDLFdBQVcsRUFBRSxDQUFDO0lBQ2QsV0FBVyxFQUFFLE9BQU87SUFDcEIsZUFBZSxFQUFFLE1BQU07SUFDdkIsZUFBZSxFQUFFLFNBQVM7SUFDMUIsV0FBVyxFQUFFLFNBQVM7Q0FDekIsQ0FBQTtBQUdELFNBQVMsYUFBYSxDQUFDLEdBQWlCO0lBRXBDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDWixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNsQyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFLLENBQWlCLENBQUMsV0FB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