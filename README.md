## Keywords
| Keyword / Character | Description |
|---------------------|-------------|
| `[` | Open Config Block |
| `]` | Close Config Block |
| `!` | Include file |

## Block Types
### Slide Block
The `[slide]` will start a new slide and allows attributes that control the background and transition animation for the slide. Any non-`slide` blocks below a `[slide]` will be interpreted as the contents of that slide.

| Syntax | Allowed attributes |
|--------|--------------------|
| `[slide]` | `background`, `transition` |

#### Slide Block Example
```
[slide background=EFEFEF transition=0.5s,dissolve]
```

#### Slide Block Attributes
| Attribute | Allowed values | Default value |
|-----------|----------------|---------|
| `background` | A hex encoded RGB colour e.g. `background=FFFFFF`, this will set the background color of the slide. | `FFFFFF` | 
| `transition` | Comma delimited `{TRANSITION_TYPE},{TRANSITION_DURATION}` e.g. `transition=dissolve,2s` or `transition=dissolve,500ms` | `none` |


### Style Block
The `[style]` block contains styling information for the content elements beneath it. You can specify multiple `[style]` blocks per slide.
| Syntax | Allowed attributes |
|--------|--------------------|
| `[style]` | `align`, `valign`, `font`, `font-size`, `font-color`, `offset` |

#### Style Block Examples
```
[style align=center valign=center font="Tahoma" font-size=60px font-color=FF0000]
This text will be centered, red, in Tahoma at 60px 

[style align=center valign=center font="Arial" font-size=20px font-color=000000]
This text will be centered, black, in Arial at 60px 


```

#### Style Block Attributes
| Attribute | Allowed values | Default value | Description |
|-----------|----------------|---------------|--------------|
| `align` | `left`,`right`,`center` | `center` | Sets the horiztonal alignment of the content (text or image) on the slide |
| `valign` | `top`,`center`,`bottom` | `top` | Sets the vertical alignment of the content (text or image) on the slide |
| `font` | Valid font family name e.g. `Arial` |  `Arial` | Sets the font of the text content beneath the style block |
| `font-color` | Valid hex color e.g. `FFFFFF` | `000000` | Sets the font colour of the text content beneath the style block |
| `font-size` | Valid font size e.g. `12px` | `12px` | Sets the font size of the text content beneath the style block |
| `offset` | Comma-delimited offset e.g. `t10,l-10` | `t0,l0` | Allows offsetting the content below from its natural position by an arbitrary number of pixels from the top `t` and left `l`. For `t` Positive values move the content down, negative values move the content up. For `l` positive values move the content right and negative values move the content left |

### Image Block
The `[image]` block displays an image. An images position is controlled by its preceding `[style]` block

| Syntax | Allowed attributes |
|--------|--------------------|
| `[image]` | `width`, `height`, `path` |

#### Image Block Examples
```
# This style block will center the image on the slide
[style align=center valign=center]
[image width=100% path="./myimage.png"]
```

#### Image Block Attributes
| Attribute | Allowed values | Default value | Description |
|-----------|----------------|---------------|--------------|
| `width`   | Width as a percentage of the slide width e.g. `80%` | `100%` | Optional. Specify the width of the image as a percentage of it's parent slide's width | 
| `height` | Height as a percentage of the slide width e.g. `80%` | Defaults to the value of `width` to retain aspect ratio | Optional. Specify the height of the image as a percentage of it's parent slide's height | 
| `path` | File path of the image to render e.g. `./image.png` or `/path/to/image.png`. Replace backlash path separators with forward slash on Windows systems | No default. Mandatory. |  Required. Specifies the absolute or relative path to the image file to render |

### Video Block
The `[video]` block displays a video. Videos are always rendered in the center of the screen at 80% of the parent slide's width.

| Syntax | Allowed attributes |
|--------|--------------------|
| `[video]` | `path` |

#### Video Block Examples
```
[video path="./myvideo.mkv"]
```

#### Video Block Attributes
| Attribute | Allowed values | Default value | Description |
|-----------|----------------|---------------|--------------|
| `path` | File path of the video to render e.g. `./video.mkv` or `/path/to/video.mkv`. Replace backlash path separators with forward slash on Windows systems | No default. Mandatory. |  Required. Specifies the absolute or relative path to the video file to render |



### Include
You can include the contents of another `.kp` slide deck into a slide with the `!` include operator. This allows you the flexibility to split your slide deck across multiple files if you need to. 

> **NOTE**: You can only include from the base/entry `.kp` file, include blocks within included files will be ignored to prevent circular references (i.e. including the base file again from the include file)

#### Include Example
Base Slide file `base.kp`
```
[slide background=EFEFEF transition=0.5s,dissolve]
This is the slide from the base file

# The line below will include the file inc.kp in your slide deck
! ./inc.kp

# You can also prefix with the include identifier to make the file more readable. And the .kp extension is assumed.
!include ./inc
```

Included file `inc.kp`
```
[slide background=00FF00 transition=0.5s,dissolve]
[style font-size=60px font-color=000000]
This is the slide from the included file

# This line will be ignored when inc.kp is not the entry, base include file
! ./base.kp
```