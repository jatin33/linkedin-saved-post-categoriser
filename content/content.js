// LinkedIn Post Organizer - Content Script
// Detects saved posts and adds categorization UI

// Configuration
const config = {
  // Selectors for LinkedIn saved posts
  savedPostsPage: '/my-items/saved-posts/',
  postSelector: '.scaffold-finite-scroll__content > div',
  postIdAttribute: 'data-id',
  postTitleSelector: '.feed-shared-update-v2__description',
  postAuthorSelector: '.feed-shared-actor__name',
  postContentSelector: '.feed-shared-update-v2__description',
  saveButtonSelector: '[aria-label="Save post"]',
  savedIndicatorSelector: '[aria-label="Unsave post"]',
  
  // Application specific
  categoriesDropdownClass: 'linkedin-post-organizer-dropdown',
  categorizedPostClass: 'linkedin-post-organizer-categorized',
};

// Main initialization
async function initialize() {
  // Only run on LinkedIn
  if (!window.location.hostname.includes('linkedin.com')) {
    return;
  }
  
  // Check if we're on saved posts page or main feed
  if (window.location.pathname.includes(config.savedPostsPage)) {
    initializeSavedPostsPage();
  } else {
    initializeMainFeed();
  }
  
  // Listen for page navigation (LinkedIn uses SPA)
  observeUrlChanges();
}

// Initialize on LinkedIn saved posts page
async function initializeSavedPostsPage() {
  console.log('LinkedIn Post Organizer: Initializing on saved posts page');
  
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
    const categoryData = categorizedPosts[postId];
    
    // Add categorization UI
    addCategoryDropdown(post, postId, categoryData);
  });
  
  // Set up observer for dynamically loaded content
  setupPostsObserver();
}

// Initialize on main feed
async function initializeMainFeed() {
  console.log('LinkedIn Post Organizer: Initializing on main feed');
  
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
    const categoryData = categorizedPosts[postId];
    
    // Add indicator if post is saved and categorized
    if (categoryData) {
      const saveButton = post.querySelector(config.savedIndicatorSelector);
      if (saveButton) {
        addCategoryIndicator(post, categoryData);
      }
    }
    
    // Watch for save button clicks
    watchSaveButton(post, postId);
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
      postId = `${author}-${content.substring(0, 50)}`.replace(/\s+/g, '-');
    }
  }
  
  return postId;
}

// Extract post data for storage
function extractPostData(postElement) {
  return {
    title: postElement.querySelector(config.postTitleSelector)?.textContent.trim() || 'Untitled Post',
    author: postElement.querySelector(config.postAuthorSelector)?.textContent.trim() || 'Unknown Author',
    content: postElement.querySelector(config.postContentSelector)?.textContent.trim() || '',
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

// Add categorization dropdown to a saved post
async function addCategoryDropdown(postElement, postId, existingCategory = null) {
  // Check if dropdown already exists
  if (postElement.querySelector(`.${config.categoriesDropdownClass}`)) {
    return;
  }
  
  // Create container for dropdown
  const container = document.createElement('div');
  container.className = 'linkedin-post-organizer-container';
  
  // Get categories from storage
  const categories = await StorageUtils.getCategories();
  
  // Create label
  const label = document.createElement('span');
  label.className = 'linkedin-post-organizer-label';
  label.textContent = 'Categorize: ';
  container.appendChild(label);
  
  // Create dropdown
  const dropdown = document.createElement('select');
  dropdown.className = config.categoriesDropdownClass;
  
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a category';
  dropdown.appendChild(defaultOption);
  
  // Add categories
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    option.style.color = category.color;
    
    // Select if this post already has this category
    if (existingCategory && existingCategory.categoryId === category.id) {
      option.selected = true;
    }
    
    dropdown.appendChild(option);
  });
  
  // Handle category selection
  dropdown.addEventListener('change', async () => {
    const selectedCategoryId = dropdown.value;
    
    if (selectedCategoryId) {
      // Get post data
      const postData = extractPostData(postElement);
      
      // Save categorization
      const result = await StorageUtils.savePostCategory(postId, postData, selectedCategoryId);
      
      if (result.success) {
        // Visual feedback
        postElement.classList.add(config.categorizedPostClass);
        
        // Find the color for the selected category
        const selectedCategory = categories.find(c => c.id === selectedCategoryId);
        if (selectedCategory) {
          addCategoryIndicator(postElement, { categoryId: selectedCategoryId });
        }
      }
    } else {
      // Remove categorization
      const result = await StorageUtils.removePostCategory(postId);
      
      if (result.success) {
        // Visual feedback
        postElement.classList.remove(config.categorizedPostClass);
        
        // Remove indicator
        const indicator = postElement.querySelector('.linkedin-post-organizer-indicator');
        if (indicator) {
          indicator.remove();
        }
      }
    }
  });
  
  container.appendChild(dropdown);
  
  // Add container to post
  const targetElement = postElement.querySelector('.feed-shared-social-actions');
  if (targetElement) {
    targetElement.appendChild(container);
  } else {
    postElement.appendChild(container);
  }
  
  // Mark as categorized if needed
  if (existingCategory) {
    postElement.classList.add(config.categorizedPostClass);
    addCategoryIndicator(postElement, existingCategory);
  }
}

// Add visual indicator for categorized post
async function addCategoryIndicator(postElement, categoryData) {
  // Remove existing indicator
  const existingIndicator = postElement.querySelector('.linkedin-post-organizer-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Get categories to find color
  const categories = await StorageUtils.getCategories();
  const category = categories.find(c => c.id === categoryData.categoryId);
  
  if (!category) return;
  
  // Create indicator
  const indicator = document.createElement('div');
  indicator.className = 'linkedin-post-organizer-indicator';
  indicator.textContent = category.name;
  indicator.style.backgroundColor = category.color;
  
  // Add to post
  const actionsContainer = postElement.querySelector('.feed-shared-social-actions');
  if (actionsContainer) {
    actionsContainer.appendChild(indicator);
  } else {
    postElement.appendChild(indicator);
  }
}

// Watch for save button clicks to add categorization UI
function watchSaveButton(postElement, postId) {
  const saveButton = postElement.querySelector(config.saveButtonSelector);
  if (!saveButton) return;
  
  saveButton.addEventListener('click', async () => {
    // Wait for save action to complete
    setTimeout(async () => {
      // Check if post is now saved
      const savedIndicator = postElement.querySelector(config.savedIndicatorSelector);
      if (savedIndicator) {
        // Post is saved, add categorization UI
        const postData = extractPostData(postElement);
        const existingCategory = await StorageUtils.getPostCategory(postId);
        
        addCategoryDropdown(postElement, postId, existingCategory);
      }
    }, 1000);
  });
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
            if (node.matches(config.postSelector)) {
              processNewPost(node);
            } else {
              const posts = node.querySelectorAll(config.postSelector);
              posts.forEach(processNewPost);
            }
          }
        }
      }
    }
  });
  
  // Start observing
  const container = document.querySelector('.scaffold-finite-scroll__content');
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
    const categoryData = await StorageUtils.getPostCategory(postId);
    addCategoryDropdown(postElement, postId, categoryData);
  } else {
    // Main feed
    const categoryData = await StorageUtils.getPostCategory(postId);
    
    if (categoryData) {
      const saveButton = postElement.querySelector(config.savedIndicatorSelector);
      if (saveButton) {
        addCategoryIndicator(postElement, categoryData);
      }
    }
    
    watchSaveButton(postElement, postId);
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
        } else {
          initializeMainFeed();
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
