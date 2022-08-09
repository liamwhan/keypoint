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
    const DEMO = "demo2.kp";
    const pathResolved = yield window.loader.relativePath(DEMO);
    console.log(pathResolved);
    const ast = yield window.loader.load(pathResolved);
    console.log(ast);
    initCanvas();
    window.SlideState = initSlideState(ast, pathResolved);
    window.SlideState.render();
    window.addEventListener("resize", () => window.SlideState.render());
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFXQSxTQUFTLFFBQVEsQ0FBQyxFQUFvQjtJQUNsQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssVUFBVSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssYUFBYSxFQUFFO1FBQzdFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEIsT0FBTztLQUNWO0lBQ0QsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEdBQVc7SUFFOUMsSUFBSSxDQUFDLElBQUksR0FBRztRQUFFLE9BQU8sR0FBRyxDQUFDO0lBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUc7UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUN6QixPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxHQUFpQixFQUFFLElBQVk7SUFFbkQsT0FBTztRQUNILFFBQVEsRUFBRSxJQUFJO1FBQ2QsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTTtRQUM3QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07UUFDbEIsUUFBUSxFQUFFLEdBQUc7UUFDYixNQUFNLEVBQUU7WUFDSixVQUFVLEVBQUUsQ0FBQztZQUNiLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELElBQUksRUFBRTtZQUNGLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJ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