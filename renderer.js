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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFPQSxTQUFTLFFBQVEsQ0FBQyxFQUFFO0lBQ2hCLElBQUksUUFBUSxDQUFDLFVBQVUsS0FBSyxVQUFVLElBQUksUUFBUSxDQUFDLFVBQVUsS0FBSyxhQUFhLEVBQUU7UUFDN0UsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQixPQUFPO0tBQ1Y7SUFDRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUdELFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRztJQUV0QixJQUFJLENBQUMsSUFBSSxHQUFHO1FBQUUsT0FBTyxHQUFHLENBQUM7SUFDekIsSUFBSSxDQUFDLElBQUksR0FBRztRQUFFLE9BQU8sR0FBRyxDQUFDO0lBQ3pCLE9BQU8sQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQUlELFNBQVMsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFJO0lBRTdCLE9BQU87UUFDSCxRQUFRLEVBQUUsSUFBSTtRQUNkLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFCLFVBQVUsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU07UUFDN0IsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO1FBQ2xCLFFBQVEsRUFBRSxHQUFHO1FBQ2IsTUFBTSxFQUFFO1lBQ0osVUFBVSxFQUFFLENBQUM7WUFDYixXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFDRCxJQUFJLEVBQUU7WUFDRixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxD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