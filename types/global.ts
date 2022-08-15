
//#region AST Nodes
type KPNodeType = "Document"|"Slide"|"SlideProperties"|"StyleBlock"|"ConfigBlock"|"Content"|"Header"|"Footer";

interface KPNode {
    type: KPNodeType;
}

interface HeaderFooterDict {
    [name:string]: HeaderNode | FooterNode;
}
interface DocumentNode extends KPNode {
    type: "Document",
    slides: SlideNode[],
    headers: HeaderFooterDict,
    footers: HeaderFooterDict
}

interface SlideNode extends KPNode {
    type: "Slide";
    id: number;
    properties?: SlideProperties;
    contents: KPNode[];
    prev: SlideNode|null;
    next: SlideNode|null;
}

interface HeaderNode extends KPNode {
    type: "Header";
    properties?: HeaderFooterProperties;
    contents: KPNode[];
}

interface FooterNode extends KPNode {
    type: "Footer";
    properties?: HeaderFooterProperties;
    contents: KPNode[];
}

interface ConfigBlockNode extends KPNode
{
    type: "ConfigBlock";
    properties: StyleBlockProperties;
}

interface StyleBlockNode extends KPNode
{
    type: "StyleBlock";
    properties: StyleBlockProperties;
}

interface ContentNode extends KPNode
{
    type: "Content";
    contentType: "string"|"image"|"video";
    value: string;
    properties?: StyleBlockProperties & ImageProperties;
    id?: number;
}
//#endregion

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

//#region Lexer Token types
interface TokenLocation {
    i: number;
    line: number;
    column: number;
}

type KPTokenType = "SlideProperties"|"StyleBlock"|"ConfigKey"|"ConfigValue"|"ConfigBlock"|"ContentString"|"ImageBlock"|"VideoBlock"|"HeaderBlock"|"FooterBlock"|"PageBreak"|"Include"|"EOL"|"EOF";
interface KPToken {
    type: KPTokenType;
    start?: TokenLocation;
    end?:TokenLocation;
}

interface IncludeToken extends KPToken
{
    type: "Include";
    path: string;
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
    type:"SlideProperties"|"StyleBlock"|"ImageBlock"|"VideoBlock"|"HeaderBlock"|"FooterBlock";
    properties: ConfigKeyValueToken[];
}

interface HeaderBlockToken extends BlockToken
{
    type: "HeaderBlock";
}

interface FooterBlockToken extends BlockToken
{
    type: "FooterBlock";
}

interface VideoBlockToken extends BlockToken
{
    type: "VideoBlock";
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