type KPTokenType = "SlideProperties"|"StyleBlock"|"ConfigKey"
|"ConfigValue"|"ConfigBlock"|"ContentString"|"ImageBlock"
|"VideoBlock"|"HeaderBlock"|"FooterBlock"|"PageBreak"
|"Include"|"EOL"|"EOF"|"KPMeta";

interface TokenLocation {
    i: number;
    line: number;
    column: number;
}

interface KPToken {
    type: KPTokenType;
    start?: TokenLocation;
    end?:TokenLocation;
}

interface KPDocumentMetaData extends KPToken
{
    type: "KPMeta";
    path: string;
    directory: string;
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