
//#region AST Nodes
type KPNodeType = "Document"|"Slide"|"SlideProperties"|"ConfigBlock"|"Content";

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
interface ContentNode extends KPNode
{
    type: "Content";
    contentType: "string"|"image";
    value: string;
    properties?: ConfigBlockProperties;

}
//#endregion

type Align = "left"|"right"|"center";
type VerticalAlign = "top"|"center"|"bottom";

interface ConfigBlockProperties
{
    align: Align;
    valign: VerticalAlign;
    font: string;
    "font-size": string;
    "font-color": string;
    offset: Offset;
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
    load: (filepath: string) => Promise<void>;
    openFile: () => Promise<void>;
}

//#region Lexer Token types
interface TokenLocation {
    i: number;
    line: number;
    column: number;
}
type KPTokenType = "SlideProperties"|"ConfigKey"|"ConfigValue"|"ConfigBlock"|"ContentString"|"PageBreak"|"EOL"|"EOF";
interface KPToken {
    type: KPTokenType;
    start: TokenLocation;
    end:TokenLocation;
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

interface ConfigBlockToken extends KPToken
{
    type: "ConfigBlock";
    properties: ConfigKeyValueToken[];
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