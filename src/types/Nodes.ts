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
    document: DocumentNode;
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