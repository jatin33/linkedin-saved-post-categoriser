# LinkedIn Post Organizer Chrome Extension

## Deployed Link
https://linkedin-post-organiser-lp.vercel.app/

## Overview
The LinkedIn Post Organizer, also known as "LinkedInSaver," is a Chrome browser extension designed to enhance LinkedIn's native save functionality. It provides a robust categorization system, allowing users to organize their saved LinkedIn posts for better management and retrieval.

## Problem Solved
LinkedIn's default saved posts feature lacks organization, making it difficult for users to find specific content among numerous saved items. This extension addresses that by enabling users to:
*   Assign custom categories to saved posts.
*   Filter and search through categorized posts.
*   Manage categories through an intuitive interface.
*   See category indicators directly within LinkedIn's interface.

## Key Features
*   **Post Categorization**: Add category dropdowns to saved posts on LinkedIn.
*   **Category Management**: Create, edit, and delete custom categories via the extension side panel.
*   **Visual Indicators**: Display category badges on saved posts in the main LinkedIn feed.
*   **Intuitive Side Panel Interface**: A dedicated side panel for managing posts and categories, including search, filter by author, and real-time synchronization. It also includes a "Reset All Bookmarks" option and displays the LinkedIn post URL in the categorization modal.
*   **Persistent Storage**: Utilizes Chrome Storage Sync API for cross-device synchronization of categories and categorized posts.
*   **Seamless Integration**: Designed to integrate natively with LinkedIn's existing UI/UX patterns without disruption.

## Architecture and Technical Details
The extension follows a standard Chrome Extension (Manifest V3) architecture, comprising:
*   **Background Script (`background/background.js`)**: Acts as a service worker, handling storage management, message passing, and initial setup.
*   **Content Scripts (`content/content.js`, `content/content.css`)**: Injected into LinkedIn pages to manipulate the DOM, add UI elements, and listen for user interactions. It uses a `MutationObserver` to track dynamic content loading and handles LinkedIn's Single Page Application (SPA) navigation.
*   **Side Panel Interface (`popup/popup.html`, `popup/popup.js`, `popup/popup.css`)**: Provides the user interface for managing categories and viewing categorized posts within the Chrome side panel.
*   **Storage Utilities (`utils/storage.js`)**: Helper functions for interacting with Chrome's `storage.sync` API.

### Data Model
Categories and categorized posts are stored in Chrome sync storage:
```javascript
Categories: [
  { id: 'work', name: 'Work', color: '#0077B5' }
]

CategorizedPosts: {
  'post-id': {
    title: 'Post Title',
    author: 'Author Name', 
    content: 'Post content...',
    categoryId: 'work',
    dateAdded: '2025-01-08T10:13:11.000Z'
  }
}
```

### Key Design Patterns
*   **Message Passing**: All communication between content scripts, popup, and the background script occurs via Chrome's message passing API.
*   **DOM Integration**: Uses `MutationObserver` for dynamic content, CSS class targeting, and progressive enhancement to add functionality.
*   **Robust Post ID Extraction**: Employs a multi-layered strategy (`data-id` -> `data-urn` -> content hash) to reliably identify LinkedIn posts.

## Installation and Setup

To install and run the LinkedIn Post Organizer extension in Chrome:

1.  **Enable Chrome Developer Mode**:
    *   Open Chrome and navigate to `chrome://extensions/`.
    *   Toggle the "Developer mode" switch in the top-right corner.

2.  **Load the Extension**:
    *   Click the "Load unpacked" button.
    *   Navigate to the root directory of this project (the `LinkedInSaver` folder containing `manifest.json`).
    *   Select the folder and click "Select Folder" or "Open".

3.  **Verify Installation**:
    *   The "LinkedIn Post Organizer" extension should now appear in your `chrome://extensions/` list.
    *   Its icon should appear in your Chrome toolbar. Clicking it will open the side panel.

## Usage

Once installed, the extension integrates directly with your LinkedIn experience:

1.  **Categorize a Saved Post**:
    *   Navigate to your saved posts on LinkedIn (e.g., `linkedin.com/in/[your-username]/detail/recent-activity/shares/`).
    *   You will see a new dropdown menu on each saved post.
    *   Select an existing category or create a new one to assign to the post.

2.  **Manage Categories and Posts**:
    *   Click the LinkedIn Post Organizer extension icon in your Chrome toolbar.
    *   The side panel will open, allowing you to:
        *   View all your categorized posts.
        *   Search and filter posts by category.
        *   Create, edit, and delete custom categories.

3.  **View Category Indicators**:
    *   When browsing your main LinkedIn feed, saved posts that you have categorized will display a small badge indicating their assigned category.

## Demo Video
Watch a quick demonstration of the LinkedIn Post Organizer in action:

https://res.cloudinary.com/dvcl31tyv/video/upload/v1756019643/Screen_Recording_2025-08-24_at_12.22.32_PM_b8hza0.mov

## Current Status
The core functionality of the LinkedIn Post Organizer is fully implemented and ready for testing. All essential components, including the background script, content script, side panel interface, and storage utilities, are complete. The extension now features a side panel for managing posts and categories, a "Reset All Bookmarks" option, displays the LinkedIn post URL in the categorization modal, includes an author filter, and supports real-time UI synchronization. It is designed for a seamless, native-feeling integration with LinkedIn.

## Troubleshooting
*   **Extension not loading**: Ensure `manifest.json` is in the root of the selected folder and has no syntax errors.
*   **Extension loads but doesn't work on LinkedIn**: Verify that `https://www.linkedin.com/*` is included in the `host_permissions` in `manifest.json`.
*   **Category dropdowns not appearing**: Check the Chrome DevTools console (F12) for errors related to the content script.
*   **Categorizations not persisting**: Inspect Chrome Storage (Application tab in DevTools) to ensure data is being saved correctly.

For a detailed testing guide, refer to `memory-bank/testing-plan.md`.

## Future Enhancements
While the core functionality is complete, potential future enhancements include:
*   Bulk operations for categorizing multiple posts.
*   Advanced analytics and insights on saved content.
*   Export/import functionality for categories and posts.
*   Custom category icons.
*   Integration with external note-taking or productivity tools.
*   More advanced search filters (e.g., by date, author).
