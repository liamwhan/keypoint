### Keywords
| Keyword / Character | Description |
|---------------------|-------------|
| `[` | Open Config Block |
| `]` | Close Config Block |
| `\` | Page Break |

### Slide Properties
Slide properties are specified on the first line of a new slide with a hash/pound symbol `#`
e.g. `# background=#FFFFFF` and are terminated by a new line

| Property | Allowed values |
|----------|----------------|
| `background` | Background colour e.g. #FFFFFF. Defaults to white |

### Config Properties
| Property | Allowed values |
|----------|----------------|
| `align`  | `left`,`right`,`center`|
| `valign` | `top`,`bottom`,`center`|
| `font`   | The font family name (Note: must be enclosed in double quotes `"`) |
| `font-size` | The font size in pixels e.g. 14px  |
| `offset` | Vertical pixel offset (margin) from natural position on slide, use prefix `t` for `top` or `l` for left comma delimited e.g. `t-10,l10` would move the element up 10px and right 10px and `t10,l-10` would move the element down 10px and left 10px |
