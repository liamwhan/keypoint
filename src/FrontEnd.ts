/**
 * This file is Electron's Renderer thread file, it calls and coordinates the underlying subsystems
 */
type DOMReadyCallbackSync = () => void;
type DOMReadyCallbackAsync = () => Promise<void>;
type DOMReadyCallback = DOMReadyCallbackSync & DOMReadyCallbackAsync;

function DOMReady(fn: DOMReadyCallback) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
        return;
    }
    document.addEventListener("DOMContentLoaded", fn);
}

function Clamp(i: number, min: number, max: number): number
{
    if (i <= min) return min;
    if (i >= max) return max;
    return i;
}

function initSlideState(ast: DocumentNode, file: string) : SlideState
{
    return {
        filePath: file,
        activeSlideIndex: 0,
        activeSlide: ast.slides[0],
        slideCount: ast.slides.length,
        slides: ast.slides,
        slideDoc: ast,
        videoPlaying: false,
        slideHasVideo: function() {
            const hasVideo = this.activeSlide.contents.some((c: KPNode) => c.type=== "Content" && (c as ContentNode).contentType === "video");
            return hasVideo;
        },
        render: function() {
            changeSlide(this.activeSlide);
        },
        back: function() {
            const target = Clamp(this.activeSlideIndex - 1, 0, this.slideCount - 1);
            if (target === this.activeSlideIndex) return;
            this.activeSlideIndex = target;
            this.activeSlide = this.slides[target];
            this.render();
        },
        forward: function() {
            const target = Clamp(this.activeSlideIndex + 1, 0, this.slideCount - 1);
            if (target === this.activeSlideIndex) return;
            this.activeSlideIndex = target;
            this.activeSlide = this.slides[target];
            this.render();
        },
        preload: function() {
            preloadImages(this.slideDoc);
            preloadVideos(this.slideDoc);
        }
    } as SlideState;
}

function docLoaded(ast: DocumentNode, file: string): void
{
    console.log(ast);
    const openButton = document.querySelector("#btnOpen") as HTMLButtonElement;
    canvas = document.querySelector("canvas#cnv") as HTMLCanvasElement;
    openButton.parentElement.parentElement.parentElement.classList.toggle("hide");
    canvas.classList.toggle("hide");
    window.removeEventListener("resize", resizeHandler);

    initCanvas();
    window.SlideState = initSlideState(ast, file);
    window.SlideState.preload();
    window.SlideState.render(); 

    window.addEventListener("resize", resizeHandler);

}

function keyUpHandler(key: string): void {
    const ss = window.SlideState;
        if (key === "ArrowLeft") {
            ss.back();
        }
        else if (key == "ArrowRight") {
            ss.forward();
        }
}

function keyDownHandler(key: string, KeyState: KeyState) : void
{
    if (KeyState.CtrlDown && key === "r") 
    {
        window.location.reload();
    }
}

const resizeHandler = () => {
    initCanvas();
    window.SlideState.render();
};

DOMReady(async () => {
    const openButton = document.querySelector("#btnOpen") as HTMLButtonElement;
    openButton.addEventListener("click", async () => {
        await window.loader.openFile();
    });
    window.addEventListener("docLoaded", (e: CustomEvent) => {
        const { ast, file } = e.detail;
        docLoaded(ast as DocumentNode, file as string);
    });
    window.PS.Subscribe(Channel.KEYUP, "renderer", keyUpHandler);
    window.PS.Subscribe(Channel.KEYDOWN, "renderer", keyDownHandler);
});