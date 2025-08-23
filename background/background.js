// LinkedIn Post Organizer - Background Script
// Handles events and manages storage operations

// Listen for installation
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize storage with default categories if not already set
  const storage = await chrome.storage.sync.get('categories');
  if (!storage.categories) {
    await chrome.storage.sync.set({
      categories: [
        { id: 'work', name: 'Work', color: '#0077B5' },
        { id: 'learning', name: 'Learning', color: '#5851DB' },
        { id: 'inspiration', name: 'Inspiration', color: '#FFC107' },
        { id: 'networking', name: 'Networking', color: '#4CAF50' },
        { id: 'other', name: 'Other', color: '#9E9E9E' }
      ]
    });
  }
  
  // Initialize storage for saved posts if not already set
  const postsStorage = await chrome.storage.sync.get('categorizedPosts');
  if (!postsStorage.categorizedPosts) {
    await chrome.storage.sync.set({
      categorizedPosts: {}
    });
  }

  // Enable the side panel for all hosts on installation
  chrome.sidePanel.setOptions({
    enabled: true
  });
});

// Listen for clicks on the extension action (icon)
chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel when the extension icon is clicked for the current tab
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCategories') {
    chrome.storage.sync.get('categories', (data) => {
      sendResponse(data.categories || []);
    });
    return true; // Required for async sendResponse
  }
  
  if (message.action === 'getCategorizedPosts') {
    chrome.storage.sync.get('categorizedPosts', (data) => {
      const posts = data.categorizedPosts || {};
      sendResponse(posts);
    });
    return true;
  }
  
  if (message.action === 'savePostCategory') {
    const { postId, postData, categoryIds } = message.data;
    
    chrome.storage.sync.get('categorizedPosts', (data) => {
      const categorizedPosts = data.categorizedPosts || {};
      
      categorizedPosts[postId] = {
        ...postData,
        categoryIds: categoryIds || [],
        dateAdded: categorizedPosts[postId]?.dateAdded || new Date().toISOString(),
        dateModified: new Date().toISOString()
      };
      
      chrome.storage.sync.set({ categorizedPosts }, () => {
        if (chrome.runtime.lastError) {
          console.error('Background: Storage error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true });
        }
      });
    });
    return true;
  }
  
  if (message.action === 'removePostCategory') {
    const { postId } = message.data;
    
    chrome.storage.sync.get('categorizedPosts', (data) => {
      const categorizedPosts = data.categorizedPosts || {};
      
      if (categorizedPosts[postId]) {
        delete categorizedPosts[postId];
        
        chrome.storage.sync.set({ categorizedPosts }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'Post not found' });
      }
    });
    return true;
  }
  
  if (message.action === 'addCategory') {
    const { name, color } = message.data;
    
    chrome.storage.sync.get('categories', (data) => {
      const categories = data.categories || [];
      const id = name.toLowerCase().replace(/\s+/g, '-');
      
      categories.push({ id, name, color });
      
      chrome.storage.sync.set({ categories }, () => {
        sendResponse({ success: true, category: { id, name, color } });
      });
    });
    return true;
  }

  if (message.action === 'updateCategory') {
    const { categoryId, name, color } = message.data;

    chrome.storage.sync.get('categories', (data) => {
      const categories = data.categories || [];
      const categoryIndex = categories.findIndex(cat => cat.id === categoryId);

      if (categoryIndex > -1) {
        categories[categoryIndex] = { ...categories[categoryIndex], name, color };
        chrome.storage.sync.set({ categories }, () => {
          sendResponse({ success: true, category: categories[categoryIndex] });
        });
      } else {
        sendResponse({ success: false, error: 'Category not found' });
      }
    });
    return true;
  }
  
  if (message.action === 'removeCategory') {
    const { categoryId } = message.data;
    
    chrome.storage.sync.get(['categories', 'categorizedPosts'], (data) => {
      const categories = data.categories || [];
      const categorizedPosts = data.categorizedPosts || {};
      
      // Remove category
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      
      // Update posts that had this category
      Object.keys(categorizedPosts).forEach(postId => {
        if (categorizedPosts[postId].categoryIds && categorizedPosts[postId].categoryIds.includes(categoryId)) {
          // Remove the deleted category from the post's category list
          categorizedPosts[postId].categoryIds = categorizedPosts[postId].categoryIds.filter(id => id !== categoryId);
          // If no categories left, add 'other' as default
          if (categorizedPosts[postId].categoryIds.length === 0) {
            categorizedPosts[postId].categoryIds = ['other'];
          }
          categorizedPosts[postId].dateModified = new Date().toISOString();
        }
        // Handle legacy posts with single categoryId
        else if (categorizedPosts[postId].categoryId === categoryId) {
          categorizedPosts[postId].categoryIds = ['other'];
          delete categorizedPosts[postId].categoryId; // Remove legacy field
          categorizedPosts[postId].dateModified = new Date().toISOString();
        }
      });
      
      chrome.storage.sync.set({ 
        categories: updatedCategories,
        categorizedPosts 
      }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.action === 'resetAllData') {
    chrome.storage.sync.set({
      categories: [
        { id: 'work', name: 'Work', color: '#0077B5' },
        { id: 'learning', name: 'Learning', color: '#5851DB' },
        { id: 'inspiration', color: '#FFC107' },
        { id: 'networking', name: 'Networking', color: '#4CAF50' },
        { id: 'other', name: 'Other', color: '#9E9E9E' }
      ],
      categorizedPosts: {}
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
