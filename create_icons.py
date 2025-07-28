#!/usr/bin/env python3
"""
Script to generate basic download icons for the Chrome extension. The script
creates three PNG files (16x16, 48x48 and 128x128) containing a simple
down‑arrow inside a circle. Icons are stored in the `icons` directory.  If
additional sizes are needed they can easily be added to the `sizes` list.

This script uses the Pillow library (already available in this environment)
to generate vector‑like shapes using drawing primitives.  The down arrow is
drawn as a triangle pointing down, with a rectangle above it to create a
consistent look.  A white background with transparent edges ensures the
icon blends nicely on dark pages.
"""
import os
from PIL import Image, ImageDraw


def generate_icon(size: int) -> Image.Image:
    """Return a new icon image of the given size with a down arrow."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Draw a white circle for the background
    radius = size // 2 - 1
    draw.ellipse(
        [(1, 1), (size - 2, size - 2)],
        fill=(255, 255, 255, 230),  # semi‑opaque white
        outline=(200, 200, 200, 255),
        width=max(1, size // 20),
    )
    # Dimensions for the arrow: create a downward pointing arrow (triangle) and a small rectangle above it
    arrow_width = size * 0.35
    arrow_height = size * 0.35
    rect_height = size * 0.15
    center_x = size / 2
    top_y = size / 2 - (arrow_height / 2) - rect_height / 2
    # Triangle points for arrow tip
    tip_x1 = center_x - arrow_width / 2
    tip_x2 = center_x + arrow_width / 2
    tip_y = top_y + rect_height + arrow_height
    # Draw rectangle (shaft of arrow)
    rect_x1 = center_x - arrow_width / 6
    rect_x2 = center_x + arrow_width / 6
    rect_y1 = top_y
    rect_y2 = top_y + rect_height
    draw.rectangle(
        [(rect_x1, rect_y1), (rect_x2, rect_y2)], fill=(0, 0, 0, 255)
    )
    # Draw triangle (head of arrow)
    triangle = [(tip_x1, rect_y2), (tip_x2, rect_y2), (center_x, tip_y)]
    draw.polygon(triangle, fill=(0, 0, 0, 255))
    return img


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "icons")
    os.makedirs(out_dir, exist_ok=True)
    sizes = [16, 48, 128]
    for size in sizes:
        icon = generate_icon(size)
        icon_path = os.path.join(out_dir, f"icon{size}.png")
        icon.save(icon_path)
        print(f"Generated {icon_path}")


if __name__ == "__main__":
    main()