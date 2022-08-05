function DOMReady(fn) {
    if (document.readState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
        return;
    }
    document.addEventListener("DOMContentLoaded", fn);
}

DOMReady(async () => {
    const DEMO = "demo.kp";
    const pathResolved = await window.loader.relativePath(DEMO)
    console.log(pathResolved);
    const astJson = await window.loader.load(pathResolved);
    const ast = JSON.parse(astJson);
    console.log(ast);
    window.SlideState = {
        activeSlideIndex: 0,
        activeSlide: ast.slides[0],
        slideDoc: ast
    };

    initCanvas();
    renderSlide(SlideState.activeSlide);
    window.addEventListener("resize", () => {
        initCanvas();
        renderSlide(SlideState.activeSlide);
    });

});