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
      sendResponse(data.categorizedPosts || {});
    });
    return true;
  }
  
  if (message.action === 'savePostCategory') {
    const { postId, postData, categoryId } = message.data;
    
    chrome.storage.sync.get('categorizedPosts', (data) => {
      const categorizedPosts = data.categorizedPosts || {};
      
      categorizedPosts[postId] = {
        ...postData,
        categoryId,
        dateAdded: new Date().toISOString()
      };
      
      chrome.storage.sync.set({ categorizedPosts }, () => {
        sendResponse({ success: true });
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
  
  if (message.action === 'removeCategory') {
    const { categoryId } = message.data;
    
    chrome.storage.sync.get(['categories', 'categorizedPosts'], (data) => {
      const categories = data.categories || [];
      const categorizedPosts = data.categorizedPosts || {};
      
      // Remove category
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      
      // Update posts that had this category
      Object.keys(categorizedPosts).forEach(postId => {
        if (categorizedPosts[postId].categoryId === categoryId) {
          categorizedPosts[postId].categoryId = 'other'; // Default to 'other'
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
});
