# Technical Context: LinkedIn Post Organizer

## Technology Stack
- **Platform**: Chrome Extension (Manifest V3)
- **JavaScript**: Vanilla ES6+ (no frameworks)
- **Storage**: Chrome Storage Sync API
- **CSS**: Custom styles with LinkedIn UI integration
- **Icons**: Feather Icons via CDN, custom SVG icons

## Project Structure
```
LinkedInSaver/
├── manifest.json           # Extension configuration
├── background/
│   └── background.js       # Service worker, storage management
├── content/
│   ├── content.js         # LinkedIn DOM integration
│   └── content.css        # Styles for injected elements
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Popup functionality
│   └── popup.css          # Popup styling
├── utils/
│   └── storage.js         # Storage utility functions
└── icons/                 # Extension icons
```

## Key Dependencies
- **Chrome APIs**: runtime, storage, activeTab
- **External**: Feather Icons CDN for popup UI
- **LinkedIn Selectors**: Relies on LinkedIn's DOM structure

## Development Environment
- **Browser**: Chrome with Developer Mode enabled
- **Testing**: Manual testing on LinkedIn.com
- **Storage**: Chrome DevTools Application tab for storage inspection

## Technical Constraints

### Chrome Extension Limitations
- Manifest V3 service worker instead of background pages
- Content Security Policy restrictions
- Limited access to LinkedIn's internal APIs
- Must use message passing for cross-context communication

### LinkedIn Integration Challenges
- **Dynamic DOM**: Posts load via infinite scroll
- **SPA Navigation**: URL changes without page reloads
- **Selector Stability**: LinkedIn may change CSS classes
- **Rate Limiting**: Must avoid excessive DOM manipulation

## Performance Considerations
- **Lazy Loading**: Only process visible posts initially
- **Debounced Operations**: Limit observer callback frequency
- **Memory Management**: Clean up event listeners on navigation
- **Storage Efficiency**: Minimize sync storage usage

## Security & Privacy
- **Permissions**: Limited to activeTab and storage
- **Host Permissions**: Only linkedin.com domain
- **Data Storage**: User data stays in Chrome sync storage
- **No External Requests**: All processing happens locally

## Browser Compatibility
- **Primary Target**: Chrome 88+ (Manifest V3 support)
- **Storage Sync**: Requires Chrome account for cross-device sync
- **Feature Detection**: Graceful degradation if APIs unavailable

## Development Setup
1. Load unpacked extension in Chrome Developer Mode  
2. Navigate to LinkedIn saved posts page
3. Test categorization functionality
4. Use Chrome DevTools for debugging
5. Monitor storage in Application > Storage > Extension
