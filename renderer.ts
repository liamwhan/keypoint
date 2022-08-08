
interface SlideState {
    filePath: string;
    activeSlideIndex: number;
    activeSlide: SlideNode;
}

function DOMReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
        return;
    }
    document.addEventListener("DOMContentLoaded", fn);
}


function Clamp(i, min, max)
{
    if (i <= min) return min;
    if (i >= max) return max;
    return i;
}



function initSlideState(ast, file)
{
    return {
        filePath: file,
        activeSlideIndex: 0,
        activeSlide: ast.slides[0],
        slideCount: ast.slides.length,
        slides: ast.slides,
        slideDoc: ast,
        render: function() {
            initCanvas();
            renderSlide(this.activeSlide);
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
        }
    };
}

function docLoaded(ast: DocumentNode, file: string)
{
    initCanvas();
    window.SlideState = initSlideState(ast, file);
    window.SlideState.render(); 

}

function keyUpHandler(key: string) {
    const ss = window.SlideState;
        if (key === "ArrowLeft") {
            ss.back();
        }
        else if (key == "ArrowRight") {
            ss.forward();
        }
}

function keyDownHandler(key: string, KeyState: KeyState)
{
    if (KeyState.CtrlDown && key === "r") 
    {
        window.location.reload();
    }
}

DOMReady(async () => {

    window.addEventListener("docLoaded", (e: CustomEvent) => {
        const { ast, file } = e.detail;
        docLoaded(ast as DocumentNode, file as string);
    });
    window.PS.Subscribe(Channel.KEYUP, "renderer", keyUpHandler);
    window.PS.Subscribe(Channel.KEYDOWN, "renderer", keyDownHandler);

    const DEMO = "demo.kp";
    const pathResolved = await window.loader.relativePath(DEMO);
    console.log(pathResolved);
    const ast = await window.loader.load(pathResolved);
    console.log(ast);

    initCanvas();
    window.SlideState = initSlideState(ast, pathResolved);
    window.SlideState.render();
    window.addEventListener("resize", () =>  window.SlideState.render());

});