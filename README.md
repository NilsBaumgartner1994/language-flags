# Language Flags

![Scrolling Flags Banner](https://github.com/NilsBaumgartner1994/language-flags/blob/main/press-kit/scrolling-flags-banner.gif?raw=true)

## Overview

**Language Flags** visualizes ISO language codes (e.g., `en-UK`, `en-US`) as circular flags using unique colors for each character. This provides an accessible, language-agnostic format for both left-to-right (LTR) and right-to-left (RTL) languages.

## Why ISO Codes Over Country Flags?

Using national flags for languages is problematic due to:
- **Ambiguity**: Shared languages (e.g., English in the US and UK).
- **Multilingual Countries**: Nations like Canada and Switzerland have multiple languages.
- **Cultural Sensitivity**: Flags may misrepresent or exclude regional nuances.

**Language Flags** avoids these issues by focusing on ISO language codes, offering a clear, inclusive representation.

## Key Features

- **ISO Code Visualization**: Represents each character with distinct colors.
- **Circular Design**: Characters are visualized as concentric rings, starting from the outermost ring.
- **Bidirectional Readability**: Logical design for LTR and RTL languages.
- **Output Formats**: Supports PNG and scalable SVG files.

## Example Flags

- **German (`de-DE`)**  
  ![German Flag](https://raw.githubusercontent.com/NilsBaumgartner1994/language-flags/refs/heads/main/flags/de-DE.png)

- **British English (`en-GB`)**  
  ![British English Flag](https://raw.githubusercontent.com/NilsBaumgartner1994/language-flags/refs/heads/main/flags/en-GB.png)

- **American English (`en-US`)**  
  ![American English Flag](https://raw.githubusercontent.com/NilsBaumgartner1994/language-flags/refs/heads/main/flags/en-US.png)

## How It Works

1. **Character to Color Mapping**:
    - Each character corresponds to a unique hue.
    - Alternating saturation and lightness enhance differentiation.

2. **Ring Structure**:
    - Outer rings represent the first character, with subsequent characters moving inward.

3. **Output Formats**:
    - **PNG**: High-quality raster images.
    - **SVG**: Resolution-independent vector graphics.
