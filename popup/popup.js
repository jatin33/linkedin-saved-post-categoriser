// LinkedIn Post Organizer - Popup Script
// Handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Feather icons
  feather.replace();
  
  // Tab switching logic
  setupTabs();
  
  // Set up category management
  setupCategoryManagement();
  
  // Load and display posts
  await loadPosts();
  
  // Set up search and filtering
  setupFilters();
});

// Tab switching functionality
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Load and display categorized posts
async function loadPosts() {
  const postsContainer = document.getElementById('posts-list');
  const emptyState = document.getElementById('empty-posts');
  
  // Get all posts and categories
  const categorizedPosts = await StorageUtils.getCategorizedPosts();
  const categories = await StorageUtils.getCategories();
  
  // Clear container
  postsContainer.innerHTML = '';
  
  // Check if there are any posts
  const postsArray = Object.entries(categorizedPosts);
  
  if (postsArray.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Sort posts by date (newest first)
  postsArray.sort((a, b) => {
    return new Date(b[1].dateAdded) - new Date(a[1].dateAdded);
  });
  
  // Populate category filter dropdown
  populateCategoryFilter(categories);
  
  // Render each post
  postsArray.forEach(([postId, postData]) => {
    // Find the category for this post
    const category = categories.find(cat => cat.id === postData.categoryId);
    if (!category) return; // Skip if category not found
    
    const postElement = createPostElement(postId, postData, category);
    postsContainer.appendChild(postElement);
  });
}

// Create HTML element for a post
function createPostElement(postId, postData, category) {
  const postElement = document.createElement('div');
  postElement.className = 'post-item';
  postElement.style.borderLeftColor = category.color;
  
  // Create post content
  postElement.innerHTML = `
    <div class="post-title">${escapeHTML(postData.title)}</div>
    <div class="post-author">${escapeHTML(postData.author)}</div>
    <div class="post-content">${escapeHTML(postData.content)}</div>
    <div class="post-meta">
      <span class="post-category" style="background-color: ${category.color}">${escapeHTML(category.name)}</span>
      <span class="post-date">${formatDate(postData.dateAdded)}</span>
    </div>
    <div class="post-actions">
      <button class="view-post-btn" title="Open on LinkedIn">
        <i data-feather="external-link"></i>
      </button>
      <button class="remove-post-btn" title="Remove from category">
        <i data-feather="x"></i>
      </button>
    </div>
  `;
  
  // Initialize Feather icons in this element
  feather.replace();
  
  // Add event listeners
  const viewBtn = postElement.querySelector('.view-post-btn');
  const removeBtn = postElement.querySelector('.remove-post-btn');
  
  viewBtn.addEventListener('click', () => {
    window.open(postData.url, '_blank');
  });
  
  removeBtn.addEventListener('click', async () => {
    if (confirm('Remove this post from its category?')) {
      const result = await StorageUtils.removePostCategory(postId);
      if (result.success) {
        // Reload posts
        loadPosts();
      }
    }
  });
  
  return postElement;
}

// Populate the category filter dropdown
function populateCategoryFilter(categories) {
  const filterElement = document.getElementById('category-filter');
  
  // Clear existing options except 'All Categories'
  while (filterElement.options.length > 1) {
    filterElement.remove(1);
  }
  
  // Add each category as an option
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    filterElement.appendChild(option);
  });
}

// Set up search and filter functionality
function setupFilters() {
  const categoryFilter = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-posts');
  
  // Handle category filter change
  categoryFilter.addEventListener('change', filterPosts);
  
  // Handle search input
  searchInput.addEventListener('input', filterPosts);
  
  // Function to filter posts based on category and search term
  function filterPosts() {
    const selectedCategory = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    const postItems = document.querySelectorAll('.post-item');
    
    postItems.forEach(post => {
      // Get post data
      const postCategory = post.querySelector('.post-category').textContent;
      const postTitle = post.querySelector('.post-title').textContent.toLowerCase();
      const postContent = post.querySelector('.post-content').textContent.toLowerCase();
      const postAuthor = post.querySelector('.post-author').textContent.toLowerCase();
      
      // Check if post matches category filter
      const matchesCategory = selectedCategory === 'all' || 
                           (post.querySelector('.post-category').textContent.toLowerCase() === 
                            categories.find(c => c.id === selectedCategory)?.name.toLowerCase());
      
      // Check if post matches search term
      const matchesSearch = postTitle.includes(searchTerm) || 
                           postContent.includes(searchTerm) || 
                           postAuthor.includes(searchTerm);
      
      // Show/hide based on filters
      if (matchesCategory && matchesSearch) {
        post.style.display = 'block';
      } else {
        post.style.display = 'none';
      }
    });
  }
}

// Set up category management UI
async function setupCategoryManagement() {
  // Get DOM elements
  const categoriesList = document.getElementById('categories-list');
  const addCategoryBtn = document.getElementById('add-category-btn');
  const addCategoryModal = document.getElementById('add-category-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const saveCategoryBtn = document.getElementById('save-category-btn');
  
  // Load and display categories
  await loadCategories();
  
  // Show add category modal
  addCategoryBtn.addEventListener('click', () => {
    // Reset form
    document.getElementById('category-name').value = '';
    document.getElementById('category-color').value = '#0077B5';
    
    // Show modal
    addCategoryModal.style.display = 'block';
  });
  
  // Close modal
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      addCategoryModal.style.display = 'none';
    });
  });
  
  // Save new category
  saveCategoryBtn.addEventListener('click', async () => {
    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;
    
    if (!name) {
      alert('Please enter a category name');
      return;
    }
    
    // Save new category
    const result = await StorageUtils.addCategory(name, color);
    
    if (result.success) {
      // Close modal
      addCategoryModal.style.display = 'none';
      
      // Reload categories
      await loadCategories();
      
      // Reload posts to update category filters
      await loadPosts();
    }
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === addCategoryModal) {
      addCategoryModal.style.display = 'none';
    }
  });
}

// Load and display categories
async function loadCategories() {
  const categoriesList = document.getElementById('categories-list');
  
  // Get categories
  const categories = await StorageUtils.getCategories();
  
  // Clear list
  categoriesList.innerHTML = '';
  
  // Render each category
  categories.forEach(category => {
    const categoryElement = createCategoryElement(category);
    categoriesList.appendChild(categoryElement);
  });
}

// Create HTML element for a category
function createCategoryElement(category) {
  const categoryElement = document.createElement('div');
  categoryElement.className = 'category-item';
  
  // Create category content
  categoryElement.innerHTML = `
    <div class="category-info">
      <div class="category-color" style="background-color: ${category.color}"></div>
      <div class="category-name">${escapeHTML(category.name)}</div>
    </div>
    <div class="category-actions">
      <button class="edit-category-btn" title="Edit category">
        <i data-feather="edit-2"></i>
      </button>
      <button class="delete-category-btn" title="Delete category">
        <i data-feather="trash-2"></i>
      </button>
    </div>
  `;
  
  // Initialize Feather icons in this element
  feather.replace();
  
  // Add event listeners
  const deleteBtn = categoryElement.querySelector('.delete-category-btn');
  
  // Prevent deleting the 'Other' category
  if (category.id === 'other') {
    deleteBtn.disabled = true;
    deleteBtn.style.opacity = '0.2';
    deleteBtn.title = 'Cannot delete default category';
  } else {
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Delete category "${category.name}"? Posts in this category will be moved to "Other".`)) {
        const result = await StorageUtils.removeCategory(category.id);
        if (result.success) {
          // Reload categories and posts
          await loadCategories();
          await loadPosts();
        }
      }
    });
  }
  
  // Edit category functionality could be added here
  
  return categoryElement;
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  
  // If invalid date, return empty string
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Check if it's today
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Otherwise return the full date
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  
  return str
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
