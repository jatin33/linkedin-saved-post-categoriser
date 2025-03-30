// LinkedIn Post Organizer - Storage Utilities
// Handles interactions with Chrome Storage API

const StorageUtils = {
  /**
   * Get all categories
   * @returns {Promise<Array>} Array of category objects
   */
  getCategories: async function() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getCategories' }, (categories) => {
        resolve(categories || []);
      });
    });
  },
  
  /**
   * Get all categorized posts
   * @returns {Promise<Object>} Object with post IDs as keys and post data as values
   */
  getCategorizedPosts: async function() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getCategorizedPosts' }, (posts) => {
        resolve(posts || {});
      });
    });
  },
  
  /**
   * Save post with category
   * @param {string} postId - Unique identifier for the post
   * @param {Object} postData - Data about the post
   * @param {string} categoryId - ID of the category
   * @returns {Promise<Object>} Success status
   */
  savePostCategory: async function(postId, postData, categoryId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'savePostCategory',
        data: { postId, postData, categoryId }
      }, (response) => {
        resolve(response);
      });
    });
  },
  
  /**
   * Remove category from a post
   * @param {string} postId - Unique identifier for the post
   * @returns {Promise<Object>} Success status
   */
  removePostCategory: async function(postId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'removePostCategory',
        data: { postId }
      }, (response) => {
        resolve(response);
      });
    });
  },
  
  /**
   * Add a new category
   * @param {string} name - Name of the category
   * @param {string} color - Color for the category
   * @returns {Promise<Object>} Success status and new category
   */
  addCategory: async function(name, color) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'addCategory',
        data: { name, color }
      }, (response) => {
        resolve(response);
      });
    });
  },
  
  /**
   * Remove a category
   * @param {string} categoryId - ID of the category to remove
   * @returns {Promise<Object>} Success status
   */
  removeCategory: async function(categoryId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'removeCategory',
        data: { categoryId }
      }, (response) => {
        resolve(response);
      });
    });
  },
  
  /**
   * Check if a post is already categorized
   * @param {string} postId - Post ID to check
   * @returns {Promise<Object|null>} Post data or null if not found
   */
  getPostCategory: async function(postId) {
    const posts = await this.getCategorizedPosts();
    return posts[postId] || null;
  }
};
