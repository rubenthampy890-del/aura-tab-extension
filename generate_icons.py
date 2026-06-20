import os
import sys
from PIL import Image, ImageDraw, ImageFont

def generate_icon(size, filename):
    # Create image with RGBA (transparent background)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a nice radial/linear gradient circle
    # Center & radius
    cx, cy = size / 2, size / 2
    r = size * 0.45
    
    # Simple soft shadow circle first (if size is large enough)
    if size >= 48:
        draw.ellipse([cx - r + 2, cy - r + 2, cx + r + 2, cy + r + 2], fill=(0, 0, 0, 40))
        
    # Main gradient circle. We draw concentric circles to simulate a gradient.
    steps = int(r)
    for i in range(steps):
        # Blend from dark slate blue to indigo
        ratio = i / steps
        r_color = int(15 * (1 - ratio) + 99 * ratio)
        g_color = int(23 * (1 - ratio) + 102 * ratio)
        b_color = int(42 * (1 - ratio) + 241 * ratio)
        current_r = r - i
        draw.ellipse([cx - current_r, cy - current_r, cx + current_r, cy + current_r], 
                     fill=(r_color, g_color, b_color, 255))
    
    # Draw a glassy inner ring
    draw.ellipse([cx - r * 0.9, cy - r * 0.9, cx + r * 0.9, cy + r * 0.9], 
                 outline=(255, 255, 255, int(255 * 0.25)), width=max(1, int(size * 0.03)))
    
    # Draw a minimalist glowing center shape (a styled geometric "A" or sphere)
    # Let's draw an elegant stylized triangular "A" symbol representing Aura
    # Coordinates for the letter 'A' shape
    w = size * 0.3
    h = size * 0.35
    top_x, top_y = cx, cy - h/2
    bottom_left_x, bottom_left_y = cx - w/2, cy + h/2
    bottom_right_x, bottom_right_y = cx + w/2, cy + h/2
    
    # Draw triangle paths
    draw.line([top_x, top_y, bottom_left_x, bottom_left_y], fill=(255, 255, 255, 220), width=max(1, int(size * 0.05)))
    draw.line([top_x, top_y, bottom_right_x, bottom_right_y], fill=(255, 255, 255, 220), width=max(1, int(size * 0.05)))
    draw.line([cx - w/4, cy + h/8, cx + w/4, cy + h/8], fill=(255, 255, 255, 220), width=max(1, int(size * 0.05)))
    
    # Ensure icons folder exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, "PNG")
    print(f"Generated {filename} ({size}x{size})")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(base_dir, "icons")
    
    generate_icon(16, os.path.join(icons_dir, "icon-16.png"))
    generate_icon(48, os.path.join(icons_dir, "icon-48.png"))
    generate_icon(128, os.path.join(icons_dir, "icon-128.png"))
    print("All icons generated successfully.")
