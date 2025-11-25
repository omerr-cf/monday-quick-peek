# Changelog

All notable changes to Monday Quick Peek will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-25

### Added

- **Initial Release** - Monday Quick Peek Chrome Extension
- **Hover-to-Preview Functionality** - Instantly preview task notes and comments on hover
- **Search Within Notes** - Real-time search with highlighting
- **Monday.com API Integration** - Fetches real-time data from Monday.com API
- **Settings Page** - API key management and connection testing
- **Smart Tooltip Positioning** - Automatically positions tooltip to stay in viewport
- **Performance Optimizations** - LRU caching, request cancellation, debouncing
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Responsive Design** - Beautiful UI matching Monday.com design language

### Features

- **500ms Hover Delay** - Prevents accidental tooltip triggers
- **Smooth Animations** - Fade-in and slide-up animations
- **Intelligent Positioning** - Tooltip stays visible when moving cursor from task to tooltip
- **Support for All Board Views** - Works on all Monday.com board views
- **Search Functionality** - Search across note content, author names, and timestamps
- **Empty State Handling** - Graceful handling when tasks have no notes
- **Extension Context Recovery** - Handles extension reloads gracefully
- **Rate Limiting** - Built-in rate limiting with exponential backoff
- **Caching** - 5-minute cache with LRU eviction (max 50 entries)

### Technical Details

- **Manifest V3** - Built for Chrome Extension Manifest V3
- **Service Worker** - Background service worker for API communication
- **Content Scripts** - Efficient content script with event delegation
- **Chrome Storage API** - Uses sync storage for settings, local storage for cache
- **GraphQL API** - Integrates with Monday.com GraphQL API
- **Error Recovery** - Automatic retry with exponential backoff
- **Memory Management** - Proper cleanup of event listeners and timers

### Performance

- **Lazy Loading** - Only fetches data when tooltip is shown
- **Request Cancellation** - Cancels in-flight requests when user moves away
- **LRU Cache** - Efficient caching with automatic eviction
- **Debouncing** - Optimized debouncing for search input (150ms)
- **Throttling** - Throttled hover detection (500ms)

### UI/UX

- **Monday.com Design Language** - Matches Monday.com's purple accent colors
- **Scrollable Content** - Tooltip content is scrollable for long note lists
- **Search Highlighting** - Highlights matching text in search results
- **Loading States** - Shows loading indicator while fetching data
- **Error States** - User-friendly error messages with actionable buttons
- **Empty States** - Helpful messages when no notes are available

### Security

- **API Key Storage** - Secure storage using Chrome sync storage
- **Input Validation** - Validates API key format before saving
- **XSS Prevention** - Escapes HTML content to prevent XSS attacks
- **Permission Model** - Minimal permissions (storage, activeTab)

### Documentation

- **README.md** - Comprehensive setup and usage guide
- **TESTING.md** - Detailed testing instructions
- **PERFORMANCE_OPTIMIZATIONS.md** - Performance optimization details
- **CHANGELOG.md** - This file

---

## [Unreleased]

### Planned

- Support for comments (updates) in addition to notes
- Keyboard shortcuts for quick access
- Customizable hover delay in settings
- Dark mode support
- Multiple board support
- Export notes functionality
