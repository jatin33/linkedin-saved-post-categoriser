// LinkedIn Post Organizer - Content Script
// Detects saved posts and adds categorization UI with modal-based selection

// Configuration
const config = {
  // Selectors for LinkedIn saved posts
  savedPostsPage: '/my-items/saved-posts/',
  postSelector: 'ul[role="list"] > li',
  postIdAttribute: 'data-chameleon-result-urn',
  postTitleSelector: '.entity-result__content-summary, .feed-shared-update-v2__description',
  postAuthorSelector: '.entity-result__content-actor a span[aria-hidden="true"], .feed-shared-actor__name',
  postContentSelector: '.entity-result__content-summary, .feed-shared-update-v2__description',
  
  // Application specific
  categorizeButtonClass: 'linkedin-post-organizer-categorize-btn',
  modalClass: 'linkedin-post-organizer-modal',
  categorizedPostClass: 'linkedin-post-organizer-categorized',
  categoryBadgesClass: 'linkedin-post-organizer-badges',
};

// Global variables
let currentModal = null;
let categories = [];

// Main initialization
async function initialize() {
  // Only run on LinkedIn
  if (!window.location.hostname.includes('linkedin.com')) {
    return;
  }
  
  // Load categories
  categories = await StorageUtils.getCategories();
  
  // Check if we're on saved posts page
  if (window.location.pathname.includes(config.savedPostsPage)) {
    console.log('LinkedIn Post Organizer: Initializing on saved posts page');
    initializeSavedPostsPage();
  }
  
  // Listen for page navigation (LinkedIn uses SPA)
  observeUrlChanges();
}

// Initialize on LinkedIn saved posts page
async function initializeSavedPostsPage() {
  // Wait for posts to load
  await waitForElements(config.postSelector);
  
  // Get all categorized posts from storage
  const categorizedPosts = await StorageUtils.getCategorizedPosts();
  
  // Process each post
  const posts = document.querySelectorAll(config.postSelector);
  
  posts.forEach(async (post) => {
    const postId = extractPostId(post);
    if (!postId) return;
    
    // Check if post is already categorized
    const postData = categorizedPosts[postId];
    
    // Add categorization UI
    addCategorizeButton(post, postId, postData);
  });
  
  // Set up observer for dynamically loaded content
  setupPostsObserver();
}

// Extract post ID from LinkedIn post element
function extractPostId(postElement) {
  // Try to get the post ID from data attribute
  let postId = postElement.getAttribute(config.postIdAttribute);
  
  // If not found, look for it in URN or other identifiers
  if (!postId) {
    const possibleIdElements = postElement.querySelectorAll('[data-urn]');
    if (possibleIdElements.length > 0) {
      postId = possibleIdElements[0].getAttribute('data-urn');
    }
  }
  
  // Last resort: generate an ID based on content
  if (!postId) {
    const author = postElement.querySelector(config.postAuthorSelector)?.textContent.trim();
    const content = postElement.querySelector(config.postContentSelector)?.textContent.trim();
    if (author && content) {
      // Create a hash from author and truncated content
      postId = `${author}-${content.substring(0, 50)}`.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }
  }
  
  return postId;
}

// Extract post data for storage
function extractPostData(postElement) {
  const postLinkElement = postElement.querySelector('a[href*="/posts/"], a[href*="/feed/update/"]');
  const postUrl = postLinkElement ? postLinkElement.href : ''; // Default to empty string if no specific post URL found

  return {
    title: postElement.querySelector(config.postTitleSelector)?.textContent.trim() || 'Untitled Post',
    author: postElement.querySelector(config.postAuthorSelector)?.textContent.trim() || 'Unknown Author',
    content: postElement.querySelector(config.postContentSelector)?.textContent.trim() || '',
    url: postUrl, // Use the extracted post URL
    timestamp: new Date().toISOString()
  };
}

// Add categorize button to a saved post
async function addCategorizeButton(postElement, postId, existingPostData = null) {
  // Check if button already exists
  if (postElement.querySelector(`.${config.categorizeButtonClass}`)) {
    return;
  }
  
  // Create container for button and badges
  const container = document.createElement('div');
  container.className = 'linkedin-post-organizer-container';
  
  // Create categorize button
  const button = document.createElement('button');
  button.className = config.categorizeButtonClass;
  button.innerHTML = '🏷️ Categorize';
  button.title = 'Add categories to this post';
  
  // Handle button click
  button.addEventListener('click', () => {
    showCategorizationModal(postId, postElement, existingPostData);
  });
  
  container.appendChild(button);
  
  // Add category badges if post is already categorized
  if (existingPostData && existingPostData.categoryIds && existingPostData.categoryIds.length > 0) {
    const badgesContainer = createCategoryBadges(existingPostData.categoryIds);
    container.appendChild(badgesContainer);
    postElement.classList.add(config.categorizedPostClass);
  }
  
  // Add container to post
  const targetElement = postElement.querySelector('.feed-shared-social-actions') || 
                       postElement.querySelector('.social-actions-bar') ||
                       postElement;
  
  if (targetElement === postElement) {
    targetElement.appendChild(container);
  } else {
    targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
  }
}

// Create category badges for a post
function createCategoryBadges(categoryIds) {
  const badgesContainer = document.createElement('div');
  badgesContainer.className = config.categoryBadgesClass;
  
  categoryIds.forEach(categoryId => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const badge = document.createElement('span');
      badge.className = 'linkedin-post-organizer-badge';
      badge.textContent = category.name;
      badge.style.backgroundColor = category.color;
      badge.style.color = getContrastColor(category.color);
      badgesContainer.appendChild(badge);
    }
  });
  
  return badgesContainer;
}

// Show categorization modal
async function showCategorizationModal(postId, postElement, existingPostData = null) {
  // Close existing modal if open
  if (currentModal) {
    currentModal.remove();
  }
  
  // Get current categories for this post
  const currentCategories = existingPostData?.categoryIds || [];
  const currentPostUrl = existingPostData?.url || extractPostData(postElement).url; // Use existing URL or extract new one

  // Create modal
  const modal = document.createElement('div');
  modal.className = config.modalClass;
  modal.innerHTML = `
    <div class="linkedin-post-organizer-modal-content">
      <div class="linkedin-post-organizer-modal-header">
        <h3>Categorize Post</h3>
        <button class="linkedin-post-organizer-modal-close">&times;</button>
      </div>
      <div class="linkedin-post-organizer-modal-body">
        <div class="linkedin-post-organizer-form-group">
          <label for="linkedin-post-organizer-post-url">Post Link <span style="color: red;">*</span></label>
          <input type="text" id="linkedin-post-organizer-post-url" value="${currentPostUrl}" placeholder="Enter LinkedIn Post URL (required)" required>
          <small style="color: #666; font-size: 12px;">This field is required. Please enter a valid LinkedIn post URL.</small>
        </div>
        <div class="linkedin-post-organizer-categories-list">
          ${categories.map(category => `
            <label class="linkedin-post-organizer-category-item">
              <input type="checkbox" value="${category.id}" ${currentCategories.includes(category.id) ? 'checked' : ''}>
              <span class="linkedin-post-organizer-category-color" style="background-color: ${category.color}"></span>
              <span class="linkedin-post-organizer-category-name">${category.name}</span>
            </label>
          `).join('')}
        </div>
        <div class="linkedin-post-organizer-new-category">
          <h4>Create New Category</h4>
          <div class="linkedin-post-organizer-new-category-form">
            <input type="text" id="linkedin-post-organizer-new-category-name" placeholder="Category name" maxlength="20">
            <input type="color" id="linkedin-post-organizer-new-category-color" value="#0077B5">
            <button id="linkedin-post-organizer-add-category">Add</button>
          </div>
        </div>
      </div>
      <div class="linkedin-post-organizer-modal-footer">
        <button class="linkedin-post-organizer-btn-secondary linkedin-post-organizer-modal-close">Cancel</button>
        <button class="linkedin-post-organizer-btn-primary" id="linkedin-post-organizer-save-categories">Save Categories</button>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.appendChild(modal);
  currentModal = modal;
  
  // Setup modal event listeners
  setupModalEventListeners(modal, postId, postElement);
}

// Setup event listeners for the modal
function setupModalEventListeners(modal, postId, postElement) {
  // Close modal events
  const closeButtons = modal.querySelectorAll('.linkedin-post-organizer-modal-close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
      currentModal = null;
    });
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      currentModal = null;
    }
  });
  
  // Add new category
  const addCategoryBtn = modal.querySelector('#linkedin-post-organizer-add-category');
  const categoryNameInput = modal.querySelector('#linkedin-post-organizer-new-category-name');
  const categoryColorInput = modal.querySelector('#linkedin-post-organizer-new-category-color');
  
  addCategoryBtn.addEventListener('click', async () => {
    const name = categoryNameInput.value.trim();
    const color = categoryColorInput.value;
    
    if (!name) {
      alert('Please enter a category name');
      return;
    }
    
    // Check if category already exists
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists');
      return;
    }
    
    const result = await StorageUtils.addCategory(name, color);
    if (result.success) {
      // Update local categories
      categories.push(result.category);
      
      // Add new category to the modal
      const categoriesList = modal.querySelector('.linkedin-post-organizer-categories-list');
      const newCategoryItem = document.createElement('label');
      newCategoryItem.className = 'linkedin-post-organizer-category-item';
      newCategoryItem.innerHTML = `
        <input type="checkbox" value="${result.category.id}" checked>
        <span class="linkedin-post-organizer-category-color" style="background-color: ${color}"></span>
        <span class="linkedin-post-organizer-category-name">${name}</span>
      `;
      categoriesList.appendChild(newCategoryItem);
      
      // Clear form
      categoryNameInput.value = '';
      categoryColorInput.value = '#0077B5';
    } else {
      alert('Failed to create category');
    }
  });
  
  // Save categories
  const saveCategoriesBtn = modal.querySelector('#linkedin-post-organizer-save-categories');
  saveCategoriesBtn.addEventListener('click', async () => {
    // Get the URL from the input field in the modal
    const postUrlInput = modal.querySelector('#linkedin-post-organizer-post-url');
    const postUrl = postUrlInput ? postUrlInput.value.trim() : '';
    
    // Validate that URL is provided
    if (!postUrl) {
      alert('Please enter a LinkedIn post URL. This field is required.');
      postUrlInput.focus();
      return;
    }
    
    // Validate that it's a LinkedIn URL
    if (!isValidLinkedInUrl(postUrl)) {
      alert('Please enter a valid LinkedIn post URL (should contain linkedin.com).');
      postUrlInput.focus();
      return;
    }
    
    const selectedCategories = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => checkbox.value);
    
    // Extract post data
    const postData = extractPostData(postElement);
    
    // Use the URL from the input field
    postData.url = postUrl;

    // Save categorization
    const result = await StorageUtils.savePostCategory(postId, postData, selectedCategories);
    
    if (result.success) {
      // Update UI
      updatePostCategorization(postElement, selectedCategories);
      
      // Close modal
      modal.remove();
      currentModal = null;
    } else {
      alert('Failed to save categories');
    }
  });
  
  // Enter key on category name input
  categoryNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCategoryBtn.click();
    }
  });
  
  // Real-time URL validation
  const postUrlInput = modal.querySelector('#linkedin-post-organizer-post-url');
  if (postUrlInput) {
    postUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const saveBtn = modal.querySelector('#linkedin-post-organizer-save-categories');
      
      if (url && isValidLinkedInUrl(url)) {
        e.target.style.borderColor = '#28a745';
        e.target.style.boxShadow = '0 0 0 0.2rem rgba(40, 167, 69, 0.25)';
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
      } else if (url) {
        e.target.style.borderColor = '#dc3545';
        e.target.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.6';
      } else {
        e.target.style.borderColor = '#ddd';
        e.target.style.boxShadow = 'none';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.6';
      }
    });
    
    // Initial validation check
    const initialUrl = postUrlInput.value.trim();
    const saveBtn = modal.querySelector('#linkedin-post-organizer-save-categories');
    if (!initialUrl || !isValidLinkedInUrl(initialUrl)) {
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.6';
    }
  }
}

// Update post categorization in UI
function updatePostCategorization(postElement, categoryIds) {
  // Remove existing badges
  const existingBadges = postElement.querySelector(`.${config.categoryBadgesClass}`);
  if (existingBadges) {
    existingBadges.remove();
  }
  
  // Add new badges if categories selected
  if (categoryIds.length > 0) {
    const container = postElement.querySelector('.linkedin-post-organizer-container');
    const badgesContainer = createCategoryBadges(categoryIds);
    container.appendChild(badgesContainer);
    postElement.classList.add(config.categorizedPostClass);
  } else {
    postElement.classList.remove(config.categorizedPostClass);
  }
}

// Validate LinkedIn URL
function isValidLinkedInUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('linkedin.com');
  } catch (e) {
    return false;
  }
}

// Get contrasting text color for background
function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Set up observer for dynamically loaded posts
function setupPostsObserver() {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes are posts
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if node is a post or contains posts
            if (node.matches && node.matches(config.postSelector)) {
              processNewPost(node);
            } else if (node.querySelectorAll) {
              const posts = node.querySelectorAll(config.postSelector);
              posts.forEach(processNewPost);
            }
          }
        }
      }
    }
  });
  
  // Start observing
  const container = document.querySelector('.scaffold-finite-scroll__content') || document.body;
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }
}

// Process newly added posts
async function processNewPost(postElement) {
  const postId = extractPostId(postElement);
  if (!postId) return;
  
  // Check if we're on saved posts page
  if (window.location.pathname.includes(config.savedPostsPage)) {
    const postData = await StorageUtils.getPostCategory(postId);
    addCategorizeButton(postElement, postId, postData);
  }
}

// Observe URL changes to handle SPA navigation
function observeUrlChanges() {
  let lastUrl = location.href;
  
  // Create an observer instance
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('LinkedIn Post Organizer: URL changed to', lastUrl);
      
      // Reset and reinitialize
      setTimeout(() => {
        if (window.location.pathname.includes(config.savedPostsPage)) {
          initializeSavedPostsPage();
        }
      }, 1000);
    }
  });
  
  // Start observing
  observer.observe(document, { subtree: true, childList: true });
}

// Utility: Wait for elements to be available in the DOM
function waitForElements(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkElements = () => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        resolve(elements);
        return;
      }
      
      // Check for timeout
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for elements: ${selector}`));
        return;
      }
      
      // Try again
      setTimeout(checkElements, 500);
    };
    
    checkElements();
  });
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
