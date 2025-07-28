// content.js
//
// This content script runs on Twitter/X and Reddit pages.  It listens for
// mouseover events on <img> elements and displays a small download button near
// the hovered image.  When clicked, the script attempts to determine the
// largest/highest quality version of the image and instructs the background
// service worker to download it via chrome.downloads.download().  The logic
// accounts for common image URL patterns on Twitter (the `name` parameter) and
// Reddit (preview.redd.it vs i.redd.it) so that the resulting download URL
// points to the original full‑resolution picture.

;(function() {
  console.log('Image Downloader extension loaded on:', window.location.href);
  
  const downloadButton = document.createElement('button');
  downloadButton.id = 'image-download-btn';
  downloadButton.title = 'Download original image';
  
  // Default settings
  let buttonSettings = {
    position: 'top-right',
    size: 24,
    margin: 4,
    minSize: 256
  };
  
  // Load settings from storage
  chrome.storage.sync.get(['buttonPosition', 'buttonSize', 'buttonMargin', 'buttonMinSize'], function(result) {
    console.log('Content script loading settings from storage:', result);
    
    if (result.buttonPosition) {
      buttonSettings.position = result.buttonPosition;
    }
    if (result.buttonSize) {
      buttonSettings.size = result.buttonSize;
    }
    if (result.buttonMargin !== undefined) {
      buttonSettings.margin = result.buttonMargin;
      console.log('Setting margin to:', result.buttonMargin);
    } else {
      console.log('No margin found in storage, keeping default:', buttonSettings.margin);
    }
    if (result.buttonMinSize !== undefined) {
      buttonSettings.minSize = result.buttonMinSize;
      console.log('Setting minSize to:', result.buttonMinSize);
    } else {
      console.log('No minSize found in storage, keeping default:', buttonSettings.minSize);
    }
    
    console.log('Final button settings:', buttonSettings);
    updateButtonStyle();
  });
  
  function updateButtonStyle() {
    console.log('Updating button style with settings:', buttonSettings);
    Object.assign(downloadButton.style, {
      position: 'absolute',
      display: 'none',
      zIndex: '2147483647',
      backgroundColor: 'transparent',
      border: 'none',
      padding: '0',
      margin: '0',
      width: `${buttonSettings.size}px`,
      height: `${buttonSettings.size}px`,
      cursor: 'pointer',
      userSelect: 'none'
    });
  }
  // Embed the custom button icons as data URIs.  We avoid relying on
  // chrome.runtime.getURL() here because loading image resources via
  // chrome-extension:// URLs can fail on some pages (resulting in
  // chrome-extension://invalid/ errors).  Instead we inline the PNG data
  // directly.  These base64 strings correspond to the normal (off) and
  // hover (on) arrow images supplied by the user.  If you wish to
  // substitute your own artwork, you can regenerate the base64 strings
  // with your preferred images.
  const OFF_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gEdEwIkGB4toQAAAf9JREFUeNrt3bltAgEURdFvC4mCaIgGqIYIIhqamuyIBFuWbZb5y7khGfMOw6IB3pZl+QiN7d0hAEAAaGqb2xt2u52j0rhlWZwBBIAAEAACAAABIAAEgAAQAAJAAAgAASAABIAAEADq2abrHbu99u3eul4r6QzgKUAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAA6GWt/p9B+/0+DodD+gP16P8giog4nU5xPp9nnwEul0scj8dxj7wM46d5CpiGIMv4qV4DTEGQafx0LwK7I8g2fsp3AV0RZBw/7dvAbgiyjp/6c4AuCDKPnxpABwTZx08PoDKCCuOXAFARQZXxywCohKDS+KUAVEBQbfxyADIjqDh+SQAZEVQdvyyATAgqj18aQAYE1ccvD2BNBB3GbwFgDQRdxm8D4JUIOo3fCsArEHQbvx2AZyLoOH5LAM9A0HX8tgAeiaDz+K0BPAJB9/HbA7gHwYTxRwD4D4Ip448B8BcEk8YfBeA3CKaNPw7ATwgmjj8SwHcIpo4fkeDr4Wsi2G63ERFjxx8N4PrIn55fCAFAAAgAASAABIAAEAACQAAIAAEgAASAWvbleoBn/C6+nAEEgABQuj4BF6nyqsey6D0AAAAASUVORK5CYII=';
  const ON_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gEdEwIcMByVPwAAAf5JREFUeNrt3LluwlAURdHniIYvdmlR8tUvTaRIkDkG32FtiYYKfBY2BXiZc86htr04BAAIAHXtdPvEsiyOSuFuv/I5A7gECAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAJXpVPWN7f13h6q/lXQGcAkQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAOoDYF3XMefc/bF3j3iN27YdL2DeNMZ4+mNd19mtbdsOOdZ3e0cA0A3BUeOHBtAFwZHjhwdQHcHR46cAUBVBhPHTAKiGIMr4qQBUQRBp/HQAsiOINn5KAFkRRBw/LYBsCKKOnxpAFgSRx08PIDqC6OOXABAVQYbxywCIhiDL+KUAREGQafxyAI5GkG38kgCOQpBx/LIAno0g6/ilATwLQebxywN4NILs47cA8CgEFcZvA2BvBFXGbwVgLwSVxm8H4L8Iqo3fEsBfEVQcvy2A3yKoOn5rAD9FUHn89gC+Q1B9fAC+QNBhfAA+QdBl/I8AnLr+L/56vY7z+TzGGONyubS9P8Dy9ql/f2JZ3DWhcDdzu0NI9wAAQAAIAAEgAASAABAAAkAACAABIABUtbsfhMwH3GtfzgACQAAoXK9AuInWyyD8mwAAAABJRU5ErkJggg==';
  // Create an <img> element inside the button to display the icon. This avoids
  // relying on CSS backgrounds which may be hidden by dark images.
  const iconImg = document.createElement('img');
  // Set the default state to the "off" icon.
  iconImg.src = OFF_DATA_URI;
  iconImg.style.width = '100%';
  iconImg.style.height = '100%';
  iconImg.style.display = 'block';
  downloadButton.appendChild(iconImg);
  // Swap the icon on hover
  downloadButton.addEventListener('mouseenter', () => {
    iconImg.src = ON_DATA_URI;
  });
  downloadButton.addEventListener('mouseleave', () => {
    iconImg.src = OFF_DATA_URI;
  });
  document.body.appendChild(downloadButton);

  let currentImg = null;

  function positionButton(img) {
    const rect = img.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const btnW = downloadButton.offsetWidth || buttonSettings.size;
    const btnH = downloadButton.offsetHeight || buttonSettings.size;
    const margin = buttonSettings.margin;
    
    console.log('Positioning button with margin:', margin, 'settings:', buttonSettings);
    console.log('Image rect:', rect, 'scroll:', { scrollTop, scrollLeft });
    
    let x, y;
    
    switch (buttonSettings.position) {
      case 'top-left':
        x = scrollLeft + rect.left + margin;
        y = scrollTop + rect.top + margin;
        break;
      case 'top-right':
        x = scrollLeft + rect.left + rect.width - btnW - margin;
        y = scrollTop + rect.top + margin;
        break;
      case 'bottom-left':
        x = scrollLeft + rect.left + margin;
        y = scrollTop + rect.top + rect.height - btnH - margin;
        break;
      case 'bottom-right':
        x = scrollLeft + rect.left + rect.width - btnW - margin;
        y = scrollTop + rect.top + rect.height - btnH - margin;
        break;
      case 'center':
        x = scrollLeft + rect.left + (rect.width - btnW) / 2;
        y = scrollTop + rect.top + (rect.height - btnH) / 2;
        break;
      default:
        x = scrollLeft + rect.left + rect.width - btnW - margin;
        y = scrollTop + rect.top + margin;
    }
    
    downloadButton.style.left = `${x}px`;
    downloadButton.style.top = `${y}px`;
    downloadButton.style.display = 'block';
  }

  function hideButton() {
    downloadButton.style.display = 'none';
    currentImg = null;
  }

  // Check if image meets minimum size requirements
  function isImageLargeEnough(img) {
    const minSize = buttonSettings.minSize;
    
    // Check natural dimensions first (actual image size)
    if (img.naturalWidth >= minSize || img.naturalHeight >= minSize) {
      return true;
    }
    
    // Fallback to computed dimensions (displayed size)
    const rect = img.getBoundingClientRect();
    if (rect.width >= minSize || rect.height >= minSize) {
      return true;
    }
    
    return false;
  }

  // Check if image is likely a video thumbnail that will be replaced
  function isVideoThumbnail(img) {
    const src = img.src || img.currentSrc || '';
    
    // Check for video thumbnail patterns
    const videoThumbnailPatterns = [
      /amplify_video_thumb/i,
      /video_thumb/i,
      /video-preview/i,
      /video_thumbnail/i
    ];
    
    // Check if URL contains video thumbnail indicators
    for (const pattern of videoThumbnailPatterns) {
      if (pattern.test(src)) {
        return true;
      }
    }
    
    // Check for common video thumbnail filename patterns
    const filenamePatterns = [
      /thumb/i,
      /preview/i,
      /poster/i
    ];
    
    for (const pattern of filenamePatterns) {
      if (pattern.test(src)) {
        return true;
      }
    }
    
    // Check if parent container has video-related classes or attributes
    const parent = img.closest('[data-testid*="video"], [class*="video"], [class*="player"]');
    if (parent) {
      return true;
    }
    
    return false;
  }

  // Helper function to safely send messages to background script
  function safeSendMessage(message, callback) {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage(message, callback);
      } catch (error) {
        console.warn('Extension context invalid, cannot send message:', error);
        if (callback) callback({ success: false, error: 'Extension context invalid' });
      }
    } else {
      console.warn('Extension context invalid, cannot send message');
      if (callback) callback({ success: false, error: 'Extension context invalid' });
    }
  }

  // Parse HTTP headers to extract filename from Content-Disposition
  // Enhanced header parsing with better error handling
  const lineSeparator = '\r\n';
  const headerSeparator = ': ';
  
  function parseHeaders(headersString) {
    if (!headersString) return {};
    return headersString.split(lineSeparator).reduce((accumulator, line) => {
      const pivot = line.indexOf(headerSeparator);
      if (pivot > 0) {
        const name = line.slice(0, pivot).trim().toLowerCase();
        const value = line.slice(pivot + headerSeparator.length).trim();
        accumulator[name] = value;
      }
      return accumulator;
    }, {});
  }

  // Enhanced filename validation - ensures only valid image and video filenames are used
  function filterFilename(name) {
    // More robust validation that includes both images and videos
    return /^.+\.(?:jpe?g|png|gif|webp|bmp|tiff?|svg|mp4|webm|mov|avi|mkv|flv|m4v|3gp)$/iu.exec(name)?.[0];
  }

  // Query server for filename using HEAD request
  async function queryFilenameFromHeaders(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const disposition = response.headers.get('content-disposition');
      
      if (disposition) {
        // Extract filename from Content-Disposition header using enhanced parsing
        const headers = parseHeaders(response.headers.toString());
        const serverName = /^(?:attachment|inline)\s*;\s*filename="([^"]+)"/iu.exec(disposition)?.[1];
        
        if (serverName != null) {
          const filteredName = filterFilename(serverName);
          if (filteredName) {
            console.log('Using server-provided filename:', filteredName);
            return filteredName;
          }
        }
      }
      return null;
    } catch (e) {
      console.warn('Failed to query filename from headers:', e);
      return null;
    }
  }

  // Handle blob URL downloads
  async function downloadBlobUrl(blobUrl, sendResponse) {
    try {
      console.log('Attempting to download blob URL:', blobUrl);
      
      // Fetch the blob data
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob fetched successfully, size:', blob.size, 'type:', blob.type);
      
      // Determine filename based on blob type
      let filename = 'download';
      if (blob.type.startsWith('image/')) {
        const ext = blob.type.split('/')[1];
        filename = `image.${ext}`;
      } else if (blob.type.startsWith('video/')) {
        const ext = blob.type.split('/')[1];
        filename = `video.${ext}`;
      } else {
        // Try to extract extension from URL if available
        const urlMatch = blobUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (urlMatch) {
          filename = `download.${urlMatch[1]}`;
        } else {
          filename = 'download.bin';
        }
      }
      
      // Convert blob to data URL for download
      const reader = new FileReader();
      reader.onload = function() {
        const dataUrl = reader.result;
        
        // Send to background script for download
        chrome.runtime.sendMessage({ 
          action: 'download', 
          url: dataUrl, 
          filename: filename 
        }, response => {
          if (chrome.runtime.lastError) {
            console.error('Blob download message error:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else if (response && !response.success) {
            console.error('Blob download failed:', response.error);
            sendResponse({ success: false, error: response.error });
          } else {
            console.log('Blob download successful');
            sendResponse({ success: true });
          }
        });
      };
      
      reader.onerror = function() {
        console.error('Failed to read blob data');
        sendResponse({ success: false, error: 'Failed to read blob data' });
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Blob download failed:', error);
      sendResponse({ success: false, error: error.toString() });
    }
  }

  // Determine the highest resolution image URL.  This function uses heuristics
  // tailored to Twitter (twimg.com) and Reddit (preview.redd.it / external-preview.redd.it).
  function getLargestImageUrl(img) {
    let candidates = [];
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    if (srcset) {
      const parts = srcset.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        const [urlPart] = trimmed.split(/\s+/);
        if (urlPart) {
          // Resolve relative URLs in srcset
          try {
            const resolvedUrl = new URL(urlPart, document.location.href);
            candidates.push(resolvedUrl.toString());
          } catch (e) {
            console.warn('Failed to resolve srcset URL:', urlPart, e);
            candidates.push(urlPart);
          }
        }
      }
    }
    const currentSrc = img.currentSrc || img.getAttribute('src') || '';
    if (currentSrc) {
      // Resolve relative URLs for current source
      try {
        const resolvedUrl = new URL(currentSrc, document.location.href);
        candidates.push(resolvedUrl.toString());
      } catch (e) {
        console.warn('Failed to resolve currentSrc URL:', currentSrc, e);
        candidates.push(currentSrc);
      }
    }
    if (candidates.length === 0) {
      return currentSrc;
    }
    // pick the last candidate, which usually has the highest width in srcset
    let url = candidates[candidates.length - 1];
    try {
      const urlObj = new URL(url, document.location.href);
      const host = urlObj.hostname;
      // Twitter/X: Use name=orig parameter to get original size
      if (/twimg\.com$/.test(host) || host.includes('twimg.com')) {
        // Always set name=orig regardless of previous value
        urlObj.searchParams.set('name', 'orig');
        return urlObj.toString();
      }
      // Reddit preview: convert to i.redd.it if possible
      if (host.includes('preview.redd.it') || host.includes('external-preview.redd.it')) {
        // If the path ends with a file extension, use that path on i.redd.it
        let path = urlObj.pathname;
        // Remove size parameters from path (sometimes appended as `.jpg?width=...`)
        const extMatch = path.match(/(\.[a-zA-Z0-9]+)$/);
        if (extMatch) {
          const ext = extMatch[1];
          // Example path: /abcd12345.jpg
          path = path.split('?')[0];
          return `https://i.redd.it${path}`;
        }
      }
      // Reddit i.redd.it or other hosts: remove query parameters to get full size
      if (host.includes('i.redd.it')) {
        // remove query string; reddit uses width/auto to specify scaled images
        return urlObj.origin + urlObj.pathname;
      }
    } catch (e) {
      console.warn('Failed to parse URL:', url, e);
    }
    return url;
  }

  // Enhanced filename extraction from URL path
  function readFilename(url) {
    try {
      const urlObj = new URL(url);
      const branch = urlObj.pathname;
      const leaf = branch.slice(branch.lastIndexOf('/') + 1);
      return filterFilename(leaf);
    } catch (e) {
      console.warn('Failed to read filename from URL:', e);
      return null;
    }
  }

  async function deriveFilenameEnhanced(imageUrl) {
    try {
      // First try to get filename from server headers
      const serverFilename = await queryFilenameFromHeaders(imageUrl);
      if (serverFilename) {
        return serverFilename;
      }
      
      // Fall back to URL parsing with enhanced validation
      const urlFilename = readFilename(imageUrl);
      if (urlFilename) {
        console.log('Using URL-derived filename:', urlFilename);
        return urlFilename;
      }
      
      // Final fallback: URL parsing (existing logic with enhanced validation)
      const urlObj = new URL(imageUrl);
      let filename = urlObj.pathname.split('/').pop() || 'image';
      filename = filename.split('?')[0];
      
      // Check if filename already contains a file extension
      const dotIndex = filename.lastIndexOf('.');
      let ext = dotIndex >= 0 ? filename.substring(dotIndex + 1).toLowerCase() : '';
      
      // If no extension present, attempt to infer it from query parameters
      if (!ext) {
        // Twitter provides a 'format' parameter (jpg, png, etc.)
        const fmt = urlObj.searchParams.get('format') || urlObj.searchParams.get('fm') || '';
        if (fmt) {
          ext = fmt.toLowerCase();
        } else {
          // Default to jpg if nothing else is known
          ext = 'jpg';
        }
        filename += `.${ext}`;
      }
      
      // Apply final validation to ensure we have a valid image filename
      const validatedFilename = filterFilename(filename);
      if (validatedFilename) {
        return validatedFilename;
      }
      
      // If validation fails, create a safe fallback
      console.warn('Filename validation failed, using fallback');
      return 'image.jpg';
    } catch (e) {
      console.error('Error deriving filename:', e);
      return 'image.jpg';
    }
  }

  function deriveFilename(imageUrl) {
    try {
      const urlObj = new URL(imageUrl);
      let filename = urlObj.pathname.split('/').pop() || 'image';
      filename = filename.split('?')[0];
      // Check if filename already contains a file extension
      const dotIndex = filename.lastIndexOf('.');
      let ext = dotIndex >= 0 ? filename.substring(dotIndex + 1).toLowerCase() : '';
      // If no extension present, attempt to infer it from query parameters
      if (!ext) {
        // Twitter provides a 'format' parameter (jpg, png, etc.)
        const fmt = urlObj.searchParams.get('format') || urlObj.searchParams.get('fm') || '';
        if (fmt) {
          ext = fmt.toLowerCase();
        } else {
          // Default to jpg if nothing else is known
          ext = 'jpg';
        }
        filename += `.${ext}`;
      }
      
      // Apply enhanced validation to the legacy function as well
      const validatedFilename = filterFilename(filename);
      return validatedFilename || 'image.jpg';
    } catch (e) {
      return 'image.jpg';
    }
  }

  // Event listeners to show the download button when hovering over images and videos.
  document.addEventListener('mouseover', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    // Ignore if hovering over the button itself
    if (target === downloadButton || downloadButton.contains(target)) return;
    
    // Check for both images and videos
    const img = target.closest('img');
    const video = target.closest('video');
    const mediaElement = img || video;
    
    if (!mediaElement) return;
    
    // For images, check minimum size requirements and video thumbnail status
    if (img) {
      if (!isImageLargeEnough(img)) {
        console.log('Image too small, skipping:', img.src, 'dimensions:', img.naturalWidth + 'x' + img.naturalHeight);
        return;
      }
      
      // Skip video thumbnails that will be replaced by video players
      if (isVideoThumbnail(img)) {
        console.log('Video thumbnail detected, skipping:', img.src);
        return;
      }
    }
    
    console.log('Media hover detected:', mediaElement.src || mediaElement.currentSrc, 'on page:', window.location.href);
    currentImg = mediaElement;
    positionButton(mediaElement);
  }, true);

  // Hide the button when the pointer leaves the current media element and the related
  // target isn't the download button.  Without this check the button would
  // disappear before the pointer has a chance to enter it.
  document.addEventListener('mouseout', event => {
    if (!currentImg) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target === currentImg) {
      const toEl = event.relatedTarget;
      if (toEl && (toEl === downloadButton || downloadButton.contains(toEl))) {
        // we're entering the button, don't hide yet
        return;
      }
      hideButton();
    }
  }, true);

  // Also hide the button when leaving the button itself to anywhere else
  downloadButton.addEventListener('mouseleave', () => {
    hideButton();
  });

  // Handle clicks on the download button
  downloadButton.addEventListener('click', async () => {
    if (!currentImg) return;
    
    // Check if the media element still exists in the DOM
    if (!document.contains(currentImg)) {
      console.warn('Media element no longer exists in DOM');
      hideButton();
      return;
    }
    
    // Additional check: verify the element is still valid and accessible
    try {
      const rect = currentImg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Media element has zero dimensions, likely replaced');
        hideButton();
        return;
      }
    } catch (error) {
      console.warn('Cannot access media element properties:', error);
      hideButton();
      return;
    }
    
    const url = currentImg.src || currentImg.currentSrc;
    
    // Handle blob URLs
    if (url.startsWith('blob:')) {
      downloadBlobUrl(url, (response) => {
        if (response && !response.success) {
          console.error('Blob download failed:', response.error);
        }
      });
      hideButton();
      return;
    }
    
    try {
      // For images, use the enhanced URL processing
      if (currentImg.tagName === 'IMG') {
        const processedUrl = getLargestImageUrl(currentImg);
        const filename = await deriveFilenameEnhanced(processedUrl);
        
        safeSendMessage({ action: 'download', url: processedUrl, filename }, response => {
          if (response && !response.success) {
            console.error('Download failed:', response.error);
          }
        });
      } else {
        // For videos, use direct URL with filename detection
        const filename = await deriveFilenameEnhanced(url);
        
        safeSendMessage({ action: 'download', url, filename }, response => {
          if (response && !response.success) {
            console.error('Download failed:', response.error);
          }
        });
      }
    } catch (error) {
      console.error('Download button click error:', error);
    }

    hideButton();
  });
  
  // Listen for settings updates from popup and context menu downloads
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if extension context is still valid
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('Extension context invalid, cannot process message');
      return;
    }
    if (message && message.action === 'updateSettings') {
      console.log('Content script received settings update:', message.settings);
      buttonSettings = message.settings;
      console.log('Updated buttonSettings to:', buttonSettings);
      updateButtonStyle();
      sendResponse({ success: true });
    } else if (message && message.action === 'downloadViaContextMenu') {
      console.log('Context menu download requested for:', message.imageUrl);
      
      // Handle blob URLs directly
      if (message.imageUrl.startsWith('blob:')) {
        downloadBlobUrl(message.imageUrl, sendResponse);
        return true;
      }
      
      // Find the media element that matches the URL
      const images = document.querySelectorAll('img');
      const videos = document.querySelectorAll('video');
      let targetElement = null;
      
      // Check images first
      for (const img of images) {
        if (img.src === message.imageUrl || img.currentSrc === message.imageUrl) {
          targetElement = img;
          break;
        }
      }
      
      // Check videos if no image found
      if (!targetElement) {
        for (const video of videos) {
          if (video.src === message.imageUrl || video.currentSrc === message.imageUrl) {
            targetElement = video;
            break;
          }
        }
      }
      
      if (targetElement) {
        // Use the same logic as the button click but without size restrictions
        if (targetElement.tagName === 'IMG') {
          const url = getLargestImageUrl(targetElement);
          deriveFilenameEnhanced(url).then(filename => {
            chrome.runtime.sendMessage({ action: 'download', url, filename }, response => {
              if (chrome.runtime.lastError) {
                console.error('Context menu download message error:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else if (response && !response.success) {
                console.error('Context menu download failed:', response.error);
                sendResponse({ success: false, error: response.error });
              } else {
                console.log('Context menu download successful');
                sendResponse({ success: true });
              }
            });
          }).catch(error => {
            console.error('Context menu filename derivation failed:', error);
            sendResponse({ success: false, error: error.toString() });
          });
        } else {
          // For videos, use direct URL
          const url = targetElement.src || targetElement.currentSrc;
          deriveFilenameEnhanced(url).then(filename => {
            chrome.runtime.sendMessage({ action: 'download', url, filename }, response => {
              if (chrome.runtime.lastError) {
                console.error('Context menu download message error:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else if (response && !response.success) {
                console.error('Context menu download failed:', response.error);
                sendResponse({ success: false, error: response.error });
              } else {
                console.log('Context menu download successful');
                sendResponse({ success: true });
              }
            });
          }).catch(error => {
            console.error('Context menu filename derivation failed:', error);
            sendResponse({ success: false, error: error.toString() });
          });
        }
      } else {
        // If we can't find the media element, download the URL directly
        console.log('Media element not found, downloading URL directly');
        deriveFilenameEnhanced(message.imageUrl).then(filename => {
          chrome.runtime.sendMessage({ action: 'download', url: message.imageUrl, filename }, response => {
            if (chrome.runtime.lastError) {
              console.error('Direct download message error:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else if (response && !response.success) {
              console.error('Direct download failed:', response.error);
              sendResponse({ success: false, error: response.error });
            } else {
              console.log('Direct download successful');
              sendResponse({ success: true });
            }
          });
        }).catch(error => {
          console.error('Direct download filename derivation failed:', error);
          sendResponse({ success: false, error: error.toString() });
        });
      }
      
      // Return true to indicate we'll respond asynchronously
      return true;
    }
  });
})();