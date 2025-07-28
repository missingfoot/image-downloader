# Image & Video Downloader Chrome Extension

A powerful Chrome extension that adds download buttons to images and videos across the web, with special support for Reddit and Twitter/X.

## Features

### 🖼️ **Image Support**
- **Multiple Formats**: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG
- **High Resolution**: Automatically finds the largest available version
- **Smart Detection**: Works with srcset and responsive images
- **Platform Optimization**: Special handling for Reddit and Twitter/X

### 🎥 **Video Support**
- **Multiple Formats**: MP4, WebM, MOV, AVI, MKV, FLV, M4V, 3GP
- **Blob URL Handling**: Downloads videos from blob URLs
- **Direct Downloads**: Works with direct video file URLs

### 🎯 **Download Methods**
- **Hover Button**: Download button appears when hovering over media
- **Right-Click Menu**: Context menu option for downloading
- **Size Filtering**: Configurable minimum size to avoid small icons/avatars

### ⚙️ **Customizable Settings**
- **Button Position**: Top-left, top-right, bottom-left, bottom-right, or centered
- **Button Size**: Adjustable from 12px to 64px
- **Margin Control**: Fine-tune button positioning
- **Minimum Size Filter**: Set minimum image size for download buttons

## Installation

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/missingfoot/image-downloader.git
   cd image-downloader
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the extension folder

### From Chrome Web Store
*Coming soon*

## Usage

### Basic Usage
1. **Hover** over any image or video on supported websites
2. **Click** the download button that appears
3. **File downloads** automatically to your default downloads folder

### Right-Click Method
1. **Right-click** on any image or video
2. Select **"Download Image"** from the context menu
3. **File downloads** automatically

### Settings
1. Click the extension icon in your toolbar
2. Adjust **button position**, **size**, **margin**, and **minimum size filter**
3. Settings are **automatically saved** and applied immediately

## Supported Platforms

### ✅ **Fully Supported**
- **Reddit**: Optimized for Reddit's image hosting and video formats
- **Twitter/X**: Enhanced support for Twitter's image and video content
- **General Web**: Works on most websites with images and videos

### 🔧 **Special Features**
- **Reddit**: Converts preview URLs to full-resolution images
- **Twitter/X**: Handles Twitter's image URL patterns and video thumbnails
- **Blob URLs**: Downloads content from blob URLs (common in video players)

## Technical Details

### File Structure
```
image-downloader/
├── manifest.json          # Extension manifest
├── content.js             # Main content script
├── background.js          # Background service worker
├── popup.html             # Settings popup UI
├── popup.js               # Settings popup logic
├── create_icons.py        # Icon generation script
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Key Features
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing for downloads
- **Content Scripts**: DOM manipulation and event handling
- **Storage API**: Persistent settings across sessions
- **Context Menus**: Right-click integration

## Development

### Prerequisites
- Python 3.x (for icon generation)
- Pillow library: `pip install Pillow`

### Building Icons
```bash
python create_icons.py
```

### Testing
1. Load the extension in Chrome
2. Visit supported websites (Reddit, Twitter/X, etc.)
3. Test hover buttons and right-click functionality
4. Verify settings persistence

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Edge**: ✅ Full support (Chromium-based)
- **Opera**: ✅ Full support (Chromium-based)
- **Firefox**: ❌ Not supported (different extension API)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for personal use and learning
- Inspired by the need for better media downloading tools
- Special thanks to the Chrome Extensions documentation

## Support

If you encounter issues or have feature requests, please open an issue on GitHub.

---

**Note**: This extension is designed for downloading publicly available media. Please respect copyright and terms of service when downloading content. 