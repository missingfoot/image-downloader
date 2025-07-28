// background.js -- service worker for the Image Downloader extension
//
// This file listens for messages from content scripts containing details
// about an image to download. When invoked it uses the chrome.downloads API
// to download the image directly.  The service worker is required
// because content scripts do not have direct access to privileged APIs like
// downloads.  The 'saveAs' property ensures Chrome opens a file picker so
// users can choose a save location.

// Create context menu on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'downloadImage',
    title: 'Download Image',
    contexts: ['image'],
    documentUrlPatterns: ['<all_urls>']
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'download' && message.url) {
    const options = {
      url: message.url,
      // Use the provided filename if available; otherwise allow Chrome to generate one.
      filename: message.filename || undefined,
      // Setting saveAs to false allows Chrome to download immediately to the default
      // downloads folder without prompting the user with a dialog.
      saveAs: false,
      // Avoid overwriting files by uniquifying the filename when duplicates occur.
      conflictAction: 'uniquify'
    };
    
    // Handle data URLs (from blob downloads)
    if (message.url.startsWith('data:')) {
      console.log('Downloading data URL blob');
    }
    
    try {
      chrome.downloads.download(options, downloadId => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, id: downloadId });
        }
      });
      // Return true to indicate we'll respond asynchronously
      return true;
    } catch (err) {
      console.error('Unexpected error while starting download:', err);
      sendResponse({ success: false, error: err.toString() });
    }
  }
  // For other messages do nothing
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'downloadImage' && info.srcUrl) {
    // Send message to content script to get the largest version of the image
    chrome.tabs.sendMessage(tab.id, {
      action: 'downloadViaContextMenu',
      imageUrl: info.srcUrl
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Context menu download failed:', chrome.runtime.lastError);
        // Fallback: download the original URL directly
        downloadImageDirectly(info.srcUrl);
      } else if (response && response.success) {
        console.log('Context menu download successful');
      } else {
        console.error('Context menu download failed:', response?.error);
        // Fallback: download the original URL directly
        downloadImageDirectly(info.srcUrl);
      }
    });
  }
});

// Fallback function to download image directly when content script is unavailable
function downloadImageDirectly(imageUrl) {
  const options = {
    url: imageUrl,
    filename: undefined, // Let Chrome generate filename
    saveAs: false,
    conflictAction: 'uniquify'
  };
  
  chrome.downloads.download(options, downloadId => {
    if (chrome.runtime.lastError) {
      console.error('Direct download failed:', chrome.runtime.lastError);
    } else {
      console.log('Direct download successful, ID:', downloadId);
    }
  });
}