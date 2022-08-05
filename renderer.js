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

DOMReady(async () => {

    window.PS.Subscribe(Channels.KEYUP, "renderer", (key) => {
        console.log(key);
        const ss = window.SlideState;
        console.log(ss);
        if (key === "ArrowLeft") {
            ss.back();
        }
        else if (key == "ArrowRight") {
            ss.forward();
        }
    });



    const DEMO = "demo.kp";
    const pathResolved = await window.loader.relativePath(DEMO)
    console.log(pathResolved);
    const astJson = await window.loader.load(pathResolved);
    const ast = JSON.parse(astJson);
    console.log(ast);
    window.SlideState = {
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

    window.SlideState.render();
    window.addEventListener("resize", () =>  window.SlideState.render());

});