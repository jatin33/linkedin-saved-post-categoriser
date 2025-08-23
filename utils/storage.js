// LinkedIn Post Organizer - Storage Utilities
// Handles interactions with Chrome Storage API

const StorageUtils = {
  /**
   * Get all categories
   * @returns {Promise<Array>} Array of category objects
   */
  getCategories: async function() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getCategories' }, (categories) => {
        if (chrome.runtime.lastError) {
          console.error("Error in getCategories callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(categories || []);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (getCategories) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },
  
  /**
   * Get all categorized posts
   * @returns {Promise<Object>} Object with post IDs as keys and post data as values
   */
  getCategorizedPosts: async function() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getCategorizedPosts' }, (posts) => {
        if (chrome.runtime.lastError) {
          console.error("Error in getCategorizedPosts callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        const result = posts || {};
        resolve(result);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (getCategorizedPosts) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },
  
  /**
   * Save post with categories
   * @param {string} postId - Unique identifier for the post
   * @param {Object} postData - Data about the post
   * @param {Array} categoryIds - Array of category IDs
   * @returns {Promise<Object>} Success status
   */
  savePostCategory: async function(postId, postData, categoryIds) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'savePostCategory',
        data: { postId, postData, categoryIds }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in savePostCategory callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (savePostCategory) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },
  
  /**
   * Remove category from a post
   * @param {string} postId - Unique identifier for the post
   * @returns {Promise<Object>} Success status
   */
  removePostCategory: async function(postId) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'removePostCategory',
        data: { postId }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in removePostCategory callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (removePostCategory) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },
  
  /**
   * Add a new category
   * @param {string} name - Name of the category
   * @param {string} color - Color for the category
   * @returns {Promise<Object>} Success status and new category
   */
  addCategory: async function(name, color) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'addCategory',
        data: { name, color }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in addCategory callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (addCategory) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },

  /**
   * Update an existing category
   * @param {string} categoryId - ID of the category to update
   * @param {string} name - New name of the category
   * @param {string} color - New color for the category
   * @returns {Promise<Object>} Success status
   */
  updateCategory: async function(categoryId, name, color) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'updateCategory',
        data: { categoryId, name, color }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in updateCategory callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (updateCategory) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },
  
  /**
   * Remove a category
   * @param {string} categoryId - ID of the category to remove
   * @returns {Promise<Object>} Success status
   */
  removeCategory: async function(categoryId) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'removeCategory',
        data: { categoryId }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in removeCategory callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (removeCategory) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  },
  
  /**
   * Check if a post is already categorized
   * @param {string} postId - Post ID to check
   * @returns {Promise<Object|null>} Post data or null if not found
   */
  getPostCategory: async function(postId) {
    const posts = await this.getCategorizedPosts();
    const result = posts[postId] || null;
    return result;
  },

  /**
   * Update categories for an existing post
   * @param {string} postId - Unique identifier for the post
   * @param {Array} categoryIds - Array of category IDs
   * @returns {Promise<Object>} Success status
   */
  updatePostCategories: async function(postId, categoryIds) {
    const posts = await this.getCategorizedPosts();
    if (posts[postId]) {
      return this.savePostCategory(postId, posts[postId], categoryIds);
    }
    return { success: false, error: 'Post not found' };
  },

  /**
   * Reset all categorized posts and categories to default.
   * @returns {Promise<Object>} Success status
   */
  resetAllData: async function() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'resetAllData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in resetAllData callback:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
      if (chrome.runtime.lastError) {
        console.error("Error sending message (resetAllData) immediately after call:", chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
  }
};
