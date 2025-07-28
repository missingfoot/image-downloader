// popup.js - Handles the popup UI for Image Downloader settings

document.addEventListener('DOMContentLoaded', function() {
  const positionOptions = document.querySelectorAll('.position-option');
  const sizeInput = document.getElementById('sizeInput');
  const sizeUpBtn = document.getElementById('sizeUp');
  const sizeDownBtn = document.getElementById('sizeDown');
  const marginInput = document.getElementById('marginInput');
  const marginUpBtn = document.getElementById('marginUp');
  const marginDownBtn = document.getElementById('marginDown');
  const minSizeInput = document.getElementById('minSizeInput');
  const minSizeUpBtn = document.getElementById('minSizeUp');
  const minSizeDownBtn = document.getElementById('minSizeDown');

  let currentSettings = {
    position: 'top-right',
    size: 24,
    margin: 4,
    minSize: 256
  };
  
  let isInitialLoad = true;

  // Load saved settings
  function loadSettings() {
    chrome.storage.sync.get(['buttonPosition', 'buttonSize', 'buttonMargin', 'buttonMinSize'], function(result) {
      console.log('Loading settings from storage:', result);
      console.log('buttonMargin value from storage:', result.buttonMargin);
      console.log('Type of buttonMargin:', typeof result.buttonMargin);
      
      if (result.buttonPosition) {
        currentSettings.position = result.buttonPosition;
      }
      if (result.buttonSize) {
        currentSettings.size = result.buttonSize;
      }
      if (result.buttonMargin !== undefined) {
        currentSettings.margin = result.buttonMargin;
        console.log('Setting margin to:', result.buttonMargin);
      } else {
        console.log('No margin found in storage, keeping default:', currentSettings.margin);
      }
      if (result.buttonMinSize !== undefined) {
        currentSettings.minSize = result.buttonMinSize;
        console.log('Setting minSize to:', result.buttonMinSize);
      } else {
        console.log('No minSize found in storage, keeping default:', currentSettings.minSize);
      }
      
      console.log('Current settings after loading:', currentSettings);
      
      // Update UI to reflect current settings
      updatePositionUI();
      updateSizeUI();
      updateMarginUI();
      updateMinSizeUI();
      
      // Mark initial load as complete
      isInitialLoad = false;
    });
  }

  // Update position UI to show current selection
  function updatePositionUI() {
    positionOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.position === currentSettings.position) {
        option.classList.add('selected');
      }
    });
  }

  // Update size UI to show current value
  function updateSizeUI() {
    sizeInput.value = currentSettings.size;
  }

  // Update margin UI to show current value
  function updateMarginUI() {
    console.log('Updating margin UI with value:', currentSettings.margin);
    marginInput.value = currentSettings.margin;
  }

  // Update min size UI to show current value
  function updateMinSizeUI() {
    console.log('Updating minSize UI with value:', currentSettings.minSize);
    minSizeInput.value = currentSettings.minSize;
  }

  // Auto-save function
  function autoSave() {
    const settingsToSave = {
      buttonPosition: currentSettings.position,
      buttonSize: currentSettings.size,
      buttonMargin: currentSettings.margin,
      buttonMinSize: currentSettings.minSize
    };
    
    console.log('Saving settings:', settingsToSave);
    console.log('Margin being saved:', settingsToSave.buttonMargin);
    console.log('MinSize being saved:', settingsToSave.buttonMinSize);
    
    chrome.storage.sync.set(settingsToSave, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
      } else {
        console.log('Settings saved successfully');
        // Notify content scripts about the change
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'updateSettings',
              settings: currentSettings
            });
          }
        });
      }
    });
  }



  // Handle position selection
  positionOptions.forEach(option => {
    option.addEventListener('click', function() {
      currentSettings.position = this.dataset.position;
      updatePositionUI();
      console.log('Position changed to:', currentSettings.position);
      autoSave();
    });
  });

  // Handle size stepper buttons
  sizeUpBtn.addEventListener('click', function() {
    const newSize = Math.min(64, currentSettings.size + 1);
    currentSettings.size = newSize;
    updateSizeUI();
    console.log('Size up clicked, new value:', newSize);
    autoSave();
  });

  sizeDownBtn.addEventListener('click', function() {
    const newSize = Math.max(12, currentSettings.size - 1);
    currentSettings.size = newSize;
    updateSizeUI();
    console.log('Size down clicked, new value:', newSize);
    autoSave();
  });

  // Handle manual size input - just update the value without validation
  sizeInput.addEventListener('input', function() {
    let value = parseInt(this.value);
    if (!isNaN(value)) {
      currentSettings.size = value;
    }
  });

  // Validate and save when user leaves the input field
  sizeInput.addEventListener('blur', function() {
    let value = parseInt(this.value);
    if (isNaN(value)) {
      value = 24;
    }
    value = Math.max(12, Math.min(64, value));
    currentSettings.size = value;
    this.value = value;
    autoSave();
  });

  // Save when user presses Enter
  sizeInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      this.blur(); // This will trigger the blur event and save
    }
  });

  // Handle margin stepper buttons
  marginUpBtn.addEventListener('click', function() {
    const newMargin = Math.min(20, currentSettings.margin + 1);
    currentSettings.margin = newMargin;
    updateMarginUI();
    console.log('Margin up clicked, new value:', newMargin);
    autoSave();
  });

  marginDownBtn.addEventListener('click', function() {
    const newMargin = Math.max(0, currentSettings.margin - 1);
    currentSettings.margin = newMargin;
    updateMarginUI();
    console.log('Margin down clicked, new value:', newMargin);
    autoSave();
  });

  // Handle manual margin input - just update the value without validation
  marginInput.addEventListener('input', function() {
    let value = parseInt(this.value);
    if (!isNaN(value)) {
      currentSettings.margin = value;
      console.log('Margin input changed to:', value);
    }
  });

  // Validate and save when user leaves the margin input field
  marginInput.addEventListener('blur', function() {
    // Don't process blur during initial load
    if (isInitialLoad) return;
    
    let value = parseInt(this.value);
    if (isNaN(value)) {
      value = currentSettings.margin; // Use current setting instead of hardcoded 4
    }
    value = Math.max(0, Math.min(20, value));
    currentSettings.margin = value;
    this.value = value;
    console.log('Margin blur event, saving value:', value);
    autoSave();
  });

  // Save when user presses Enter on margin input
  marginInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      this.blur(); // This will trigger the blur event and save
    }
  });

  // Handle min size stepper buttons
  minSizeUpBtn.addEventListener('click', function() {
    const newMinSize = Math.min(1024, currentSettings.minSize + 32);
    currentSettings.minSize = newMinSize;
    updateMinSizeUI();
    console.log('MinSize up clicked, new value:', newMinSize);
    autoSave();
  });

  minSizeDownBtn.addEventListener('click', function() {
    const newMinSize = Math.max(32, currentSettings.minSize - 32);
    currentSettings.minSize = newMinSize;
    updateMinSizeUI();
    console.log('MinSize down clicked, new value:', newMinSize);
    autoSave();
  });

  // Handle manual min size input - just update the value without validation
  minSizeInput.addEventListener('input', function() {
    let value = parseInt(this.value);
    if (!isNaN(value)) {
      currentSettings.minSize = value;
      console.log('MinSize input changed to:', value);
    }
  });

  // Validate and save when user leaves the min size input field
  minSizeInput.addEventListener('blur', function() {
    // Don't process blur during initial load
    if (isInitialLoad) return;
    
    let value = parseInt(this.value);
    if (isNaN(value)) {
      value = currentSettings.minSize; // Use current setting instead of hardcoded 256
    }
    value = Math.max(32, Math.min(1024, value));
    currentSettings.minSize = value;
    this.value = value;
    console.log('MinSize blur event, saving value:', value);
    autoSave();
  });

  // Save when user presses Enter on min size input
  minSizeInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      this.blur(); // This will trigger the blur event and save
    }
  });

  // Load settings when popup opens
  loadSettings();
}); 