type Align = "left"|"right"|"center";
type VerticalAlign = "top"|"center"|"bottom";

interface StyleBlockProperties
{
    align?: Align;
    valign?: VerticalAlign;
    font?: string;
    "font-size"?: string;
    "font-color"?: string;
    offset?: Offset;
}



type SlideTransitionType = "none" | "dissolve";
interface SlideTransition
{
    /**
     * The slide transition type
     */
    type: SlideTransitionType;

    /**
     * The duration of the transition in ms
     */
    duration: number;
}

interface SlideProperties
{
    background?: string;
    transition?: SlideTransition;
    header?: string;
    footer?: string;
}

interface Offset {
    top: number;
    left: number;
}

interface SlideState 
{
    filePath: string;
    activeSlideIndex: number;
    activeSlide: SlideNode;
    slideCount: number;
    slides: SlideNode[];
    slideDoc: DocumentNode;
    slideHasVideo: () => boolean;
    videoPlaying: boolean;
    render: () => void;
    back: () => void;
    forward: () => void;
    preload: () => void;
}

interface KeyState
{
    CtrlDown: boolean;
    AltDown: boolean;
    ShiftDown: boolean;
    MetaKeyDown: boolean;
    KeyCode: string;
}

interface Window {
    SlideState?: SlideState;
    loader: KPPreloadLoader;
}

interface KPPreloadLoader {
    relativePath: (fragment: string) => Promise<string>;
    load: (filepath: string) => Promise<DocumentNode>;
    openFile: () => Promise<void>;
}

interface SlideRenderState
{
    currentLine: number;
    currentFont: string;
    currentFontSize: string;
    lastTextMetrics?: TextMetrics;
    activeSlide?: SlideNode;
}

interface MediaProperties
{
    path?: string;
}

interface ImageProperties extends MediaProperties
{
    width?: string;
    height?: string;
}

interface HeaderFooterProperties
{
    /**
     * ID/Name of the header
     */
    name?: string;

    /**
     * Print right-aligned page numbers in the footer
     */
    "page-number"?: boolean;
}