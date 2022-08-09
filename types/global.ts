
//#region AST Nodes
type KPNodeType = "Document"|"Slide"|"SlideProperties"|"StyleBlock"|"ConfigBlock"|"Content";

interface KPNode {
    type: KPNodeType;
}

interface DocumentNode extends KPNode {
    type: "Document",
    slides: SlideNode[];
}

interface SlideNode extends KPNode {
    type: "Slide";
    id: number;
    properties?: SlideProperties;
    contents: KPNode[];

}
interface ConfigBlockNode extends KPNode
{
    type: "ConfigBlock";
    properties: ConfigBlockProperties;
}
interface StyleBlockNode extends KPNode
{
    type: "StyleBlock";
    properties: ConfigBlockProperties;
}
interface ContentNode extends KPNode
{
    type: "Content";
    contentType: "string"|"image";
    value: string;
    properties?: ConfigBlockProperties & ImageProperties;

}
//#endregion

type Align = "left"|"right"|"center";
type VerticalAlign = "top"|"center"|"bottom";

interface ConfigBlockProperties
{
    align?: Align;
    valign?: VerticalAlign;
    font?: string;
    "font-size"?: string;
    "font-color"?: string;
    offset?: Offset;
}

interface SlideProperties
{
    background?: string;
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
    render: () => void;
    back: () => void;
    forward: () => void;
    preloadImages: () => void;
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
    lastTextMetrics?: TextMetrics
}

interface ImageProperties
{
    width?: string;
    height?: string;
    path?: string;
}

//#region Lexer Token types
interface TokenLocation {
    i: number;
    line: number;
    column: number;
}
type KPTokenType = "SlideProperties"|"StyleBlock"|"ConfigKey"|"ConfigValue"|"ConfigBlock"|"ContentString"|"ImageBlock"|"PageBreak"|"EOL"|"EOF";
interface KPToken {
    type: KPTokenType;
    start?: TokenLocation;
    end?:TokenLocation;
}

interface SlidePropertiesToken extends KPToken
{
    type: "SlideProperties";
    properties: ConfigKeyValueToken[];
}

interface ContentStringToken extends KPToken
{
    type: "ContentString";
    value: string;
}



interface ConfigKeyValueToken extends KPToken
{
    type: "ConfigKey"|"ConfigValue";
    value: string;
}



interface BlockToken extends KPToken
{
    type:"SlideProperties"|"StyleBlock"|"ImageBlock";
    properties: ConfigKeyValueToken[];
}

interface ImageBlockToken extends BlockToken
{
    type: "ImageBlock";
}

interface StyleBlockToken extends BlockToken
{
    type: "StyleBlock";
}

interface EOLToken extends KPToken
{
    type: "EOL";
}

interface EOFToken extends KPToken
{
    type: "EOF";
}

interface PageBreakToken extends KPToken
{
    type: "PageBreak";
}
//#endregion