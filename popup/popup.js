// LinkedIn Post Organizer - Popup Script
// Handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Feather icons
  feather.replace();
  
  // Tab switching logic
  setupTabs();
  
  // Set up category management
  await setupCategoryManagement();
  
  // Load and display posts
  await loadPosts();

  // Set up reset all data functionality
  setupResetAllData();
  
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

// Set up reset all data functionality
function setupResetAllData() {
  const resetBtn = document.getElementById('reset-all-data-btn');
  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all categorized posts and categories? This action cannot be undone.')) {
      const result = await StorageUtils.resetAllData();
      if (result.success) {
        alert('All data has been reset to default.');
        // Reload posts and categories to reflect the reset
        await loadCategories();
        await loadPosts();
      } else {
        alert('Failed to reset data.');
      }
    }
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
    return new Date(b[1].dateModified || b[1].dateAdded) - new Date(a[1].dateModified || a[1].dateAdded);
  });
  
  // Populate category filter dropdown
  populateCategoryFilter(categories);
  
  // Render each post
  postsArray.forEach(([postId, postData]) => {
    // Handle both legacy single category and new multiple categories
    const postCategories = postData.categoryIds ? 
      categories.filter(cat => postData.categoryIds.includes(cat.id)) :
      postData.categoryId ? [categories.find(cat => cat.id === postData.categoryId)] : [];
    
    if (postCategories.length === 0) return; // Skip if no categories found
    
    const postElement = createPostElement(postId, postData, postCategories);
    postsContainer.appendChild(postElement);
  });
}

// Create HTML element for a post
function createPostElement(postId, postData, postCategories) {
  const postElement = document.createElement('div');
  postElement.className = 'post-item';
  postElement.style.borderLeftColor = postCategories[0]?.color || '#ccc';
  
  // Create categories HTML
  const categoriesHTML = postCategories.map(category => 
    `<span class="post-category" style="background-color: ${category.color}; color: ${getContrastColor(category.color)}">${escapeHTML(category.name)}</span>`
  ).join('');
  
  // Create post content
  postElement.innerHTML = `
    <div class="post-title">${escapeHTML(postData.title)}</div>
    <div class="post-author">${escapeHTML(postData.author)}</div>
    <div class="post-content">${escapeHTML(postData.content)}</div>
    <div class="post-meta">
      <div class="post-categories">${categoriesHTML}</div>
      <span class="post-date">${formatDate(postData.dateModified || postData.dateAdded)}</span>
    </div>
    <div class="post-actions">
      <button class="edit-post-btn" title="Edit categories">
        <i data-feather="edit-2"></i>
      </button>
      <button class="view-post-btn" title="Open on LinkedIn">
        <i data-feather="external-link"></i>
      </button>
      <button class="remove-post-btn" title="Remove post">
        <i data-feather="x"></i>
      </button>
    </div>
  `;
  
  // Initialize Feather icons in this element
  feather.replace();
  
  // Add event listeners
  const editBtn = postElement.querySelector('.edit-post-btn');
  const viewBtn = postElement.querySelector('.view-post-btn');
  const removeBtn = postElement.querySelector('.remove-post-btn');
  
  editBtn.addEventListener('click', () => {
    showEditCategoriesModal(postId, postData, postCategories);
  });
  
  viewBtn.addEventListener('click', () => {
    window.open(postData.url, '_blank');
  });
  
  removeBtn.addEventListener('click', async () => {
    if (confirm('Remove this post completely?')) {
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

// Show edit categories modal for a post
async function showEditCategoriesModal(postId, postData, currentCategories) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'edit-categories-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  // Get all categories
  const allCategories = await StorageUtils.getCategories();
  const currentCategoryIds = postData.categoryIds || (postData.categoryId ? [postData.categoryId] : []);
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
    ">
      <div style="
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">Edit Categories</h3>
        <button class="close-modal" style="
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        ">&times;</button>
      </div>
      <div style="padding: 20px 24px; max-height: 400px; overflow-y: auto;">
        <div class="categories-list">
          ${allCategories.map(category => `
            <label style="
              display: flex;
              align-items: center;
              padding: 8px 0;
              cursor: pointer;
              border-radius: 6px;
              margin: 4px 0;
            ">
              <input type="checkbox" value="${category.id}" ${currentCategoryIds.includes(category.id) ? 'checked' : ''} style="margin: 0 12px 0 0; transform: scale(1.1);">
              <span style="
                width: 16px;
                height: 16px;
                border-radius: 50%;
                margin-right: 8px;
                background-color: ${category.color};
                border: 2px solid white;
                box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
              "></span>
              <span style="font-size: 14px; font-weight: 500; color: #333;">${category.name}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div style="
        padding: 16px 24px 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      ">
        <button class="cancel-btn" style="
          padding: 10px 20px;
          background: #f8f9fa;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        ">Cancel</button>
        <button class="save-btn" style="
          padding: 10px 20px;
          background: #0077b5;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        ">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const closeBtn = modal.querySelector('.close-modal');
  const cancelBtn = modal.querySelector('.cancel-btn');
  const saveBtn = modal.querySelector('.save-btn');
  
  const closeModal = () => {
    modal.remove();
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  saveBtn.addEventListener('click', async () => {
    const selectedCategories = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => checkbox.value);
    
    // Update post categories
    const result = await StorageUtils.updatePostCategories(postId, selectedCategories);
    
    if (result.success) {
      closeModal();
      // Reload posts to show changes
      await loadPosts();
    } else {
      alert('Failed to update categories');
    }
  });
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
