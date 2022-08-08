var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function DOMReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
        return;
    }
    document.addEventListener("DOMContentLoaded", fn);
}
function Clamp(i, min, max) {
    if (i <= min)
        return min;
    if (i >= max)
        return max;
    return i;
}
function initSlideState(ast, file) {
    return {
        filePath: file,
        activeSlideIndex: 0,
        activeSlide: ast.slides[0],
        slideCount: ast.slides.length,
        slides: ast.slides,
        slideDoc: ast,
        render: function () {
            initCanvas();
            renderSlide(this.activeSlide);
        },
        back: function () {
            const target = Clamp(this.activeSlideIndex - 1, 0, this.slideCount - 1);
            if (target === this.activeSlideIndex)
                return;
            this.activeSlideIndex = target;
            this.activeSlide = this.slides[target];
            this.render();
        },
        forward: function () {
            const target = Clamp(this.activeSlideIndex + 1, 0, this.slideCount - 1);
            if (target === this.activeSlideIndex)
                return;
            this.activeSlideIndex = target;
            this.activeSlide = this.slides[target];
            this.render();
        }
    };
}
function docLoaded(ast, file) {
    initCanvas();
    window.SlideState = initSlideState(ast, file);
    window.SlideState.render();
}
function keyUpHandler(key) {
    const ss = window.SlideState;
    if (key === "ArrowLeft") {
        ss.back();
    }
    else if (key == "ArrowRight") {
        ss.forward();
    }
}
function keyDownHandler(key, KeyState) {
    if (KeyState.CtrlDown && key === "r") {
        window.location.reload();
    }
}
DOMReady(() => __awaiter(this, void 0, void 0, function* () {
    window.addEventListener("docLoaded", (e) => {
        const { ast, file } = e.detail;
        docLoaded(ast, file);
    });
    window.PS.Subscribe(Channel.KEYUP, "renderer", keyUpHandler);
    window.PS.Subscribe(Channel.KEYDOWN, "renderer", keyDownHandler);
    const DEMO = "demo.kp";
    const pathResolved = yield window.loader.relativePath(DEMO);
    console.log(pathResolved);
    const ast = yield window.loader.load(pathResolved);
    console.log(ast);
    initCanvas();
    window.SlideState = initSlideState(ast, pathResolved);
    window.SlideState.render();
    window.addEventListener("resize", () => window.SlideState.render());
}));
