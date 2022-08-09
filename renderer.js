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
        },
        preloadImages: function () {
            preloadImages(this.slideDoc);
        }
    };
}
function docLoaded(ast, file) {
    initCanvas();
    window.SlideState = initSlideState(ast, file);
    window.SlideState.preloadImages();
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
    window.SlideState.preloadImages();
    window.SlideState.render();
    window.addEventListener("resize", () => window.SlideState.render());
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFNQSxTQUFTLFFBQVEsQ0FBQyxFQUFvQjtJQUNsQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssVUFBVSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssYUFBYSxFQUFFO1FBQzdFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEIsT0FBTztLQUNWO0lBQ0QsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEdBQVc7SUFFOUMsSUFBSSxDQUFDLElBQUksR0FBRztRQUFFLE9BQU8sR0FBRyxDQUFDO0lBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUc7UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUN6QixPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxHQUFpQixFQUFFLElBQVk7SUFFbkQsT0FBTztRQUNILFFBQVEsRUFBRSxJQUFJO1FBQ2QsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTTtRQUM3QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07UUFDbEIsUUFBUSxFQUFFLEdBQUc7UUFDYixNQUFNLEVBQUU7WUFDSixVQUFVLEVBQUUsQ0FBQztZQUNiLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELElBQUksRUFBRTtZQUNGLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJ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