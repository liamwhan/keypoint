function DOMReady(fn) {
    if (document.readState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
        return;
    }
    document.addEventListener("DOMContentLoaded", fn);
}


function Clamp(i, min, max)
{
    if (i < min) return min;
    if (i > max) return max;
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

function docLoaded(ast, file)
{
   window.SlideState = initSlideState(ast, file);
   window.SlideState.render(); 

}

DOMReady(async () => {

    window.addEventListener("docLoaded", (e) => {
        const { ast, file } = e.detail;
        docLoaded(ast, file);
    });
    window.PS.Subscribe(Channels.KEYUP, "renderer", (key) => {
        const ss = window.SlideState;
        if (key === "ArrowLeft") {
            ss.back();
        }
        else if (key == "ArrowRight") {
            ss.forward();
        }
    });

    const DEMO = "demo.kp";
    const pathResolved = await window.loader.relativePath(DEMO);
    console.log(pathResolved);
    const ast = await window.loader.load(pathResolved);
    console.log(ast);

    initSlideState(ast, pathResolved);
    window.SlideState.render();
    // initCanvas();
    window.addEventListener("resize", () =>  window.SlideState.render());

});