# System Patterns: LinkedIn Post Organizer

## Architecture Overview
Chrome Extension with service worker background script, content scripts for LinkedIn integration, and popup UI for management.

```
┌─── Background Script ───┐    ┌─── Content Scripts ───┐    ┌─── Popup Interface ───┐
│   • Storage management  │◄──►│   • DOM manipulation  │    │   • Category management│
│   • Message handling    │    │   • Event listeners   │    │   • Post filtering     │
│   • Initial setup       │    │   • UI injection      │    │   • Search interface   │
└─────────────────────────┘    └───────────────────────┘    └───────────────────────┘
                │                           │                           │
                └─────────────── Chrome Storage API ──────────────────┘
```

## Key Design Patterns

### 1. Message Passing Architecture
- **Background Script**: Central hub for storage operations
- **Content Scripts**: Request data via chrome.runtime.sendMessage
- **Popup**: Communicates with background for data management
- **Storage**: Chrome sync storage for cross-device persistence

### 2. DOM Integration Strategy
- **Observer Pattern**: MutationObserver tracks dynamic content loading
- **CSS Class Targeting**: Uses LinkedIn's existing selectors where stable
- **Progressive Enhancement**: Adds functionality without breaking existing UX

### 3. Data Model
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

### 4. UI Injection Pattern
- **Saved Posts Page**: Injects dropdown selectors
- **Main Feed**: Adds category indicators to saved posts
- **Non-intrusive**: Integrates with LinkedIn's social action buttons

### 5. Content Script Lifecycle
1. **Initialize**: Check current page context
2. **Wait**: Use waitForElements for dynamic content
3. **Process**: Extract post IDs and inject UI elements
4. **Observe**: Set up MutationObserver for new content
5. **React**: Handle user interactions and storage updates

## Critical Implementation Details

### Post ID Extraction Strategy
1. Try `data-id` attribute first
2. Fallback to `data-urn` elements
3. Generate hash from author + content as last resort

### LinkedIn SPA Navigation Handling
- URL change detection via MutationObserver
- Re-initialization on page transitions
- Debounced processing to avoid duplicate operations

### Storage Synchronization
- Chrome sync storage for cross-device persistence
- Message-based communication to background script
- Optimistic UI updates with error handling
