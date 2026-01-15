# CRM Data Extractor for ActiveCampaign

A Chrome Extension that extracts Contacts, Deals, and Tasks from ActiveCampaign CRM, stores them locally using Chrome storage, and displays them in a React-based popup dashboard.

## Features

- **Data Extraction**: Extract Contacts, Deals, and Tasks from ActiveCampaign CRM views
- **Local Storage**: Persistent storage using `chrome.storage.local` with deduplication
- **React Dashboard**: Modern popup UI with tabs, search, and filtering
- **Visual Feedback**: Shadow DOM-based extraction indicator with progress states
- **Export Options**: Export data as CSV or JSON format
- **Real-time Sync**: Cross-tab synchronization via storage events

## Installation

### Prerequisites

- Node.js 18+ and npm
- Google Chrome browser

### Build Steps

```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Build for production
npm run build

# Or run in development mode with hot reload
npm run dev
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from the project

## Usage

1. Navigate to ActiveCampaign (contacts, deals, or tasks view)
2. Click the extension icon in Chrome toolbar
3. Click "Extract Now" button
4. View extracted data in the popup dashboard
5. Search, filter, or delete records as needed
6. Export data using the Export menu

## Project Structure

```
extension/
├── manifest.json              # Chrome Extension Manifest V3
├── package.json               # Node dependencies
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Message routing, storage events
│   ├── content/
│   │   ├── index.ts           # Content script orchestrator
│   │   ├── extractors/        # Entity-specific data harvesters
│   │   ├── detectors/         # View type detection
│   │   └── indicators/        # Shadow DOM status UI
│   ├── popup/
│   │   ├── App.tsx            # Main React application
│   │   ├── components/        # UI components
│   │   └── hooks/             # Custom React hooks
│   └── shared/
│       ├── types.ts           # TypeScript interfaces
│       ├── constants.ts       # Configuration and selectors
│       ├── message-types.ts   # Message passing contracts
│       └── storage-service.ts # Chrome storage wrapper
```

## DOM Selection Strategy

### Approach: Adaptive CSS Selectors with Semantic Fallbacks

The extraction engine uses a multi-layered selector strategy for resilience:

1. **Primary**: `data-*` attributes (most stable, least likely to change)
2. **Secondary**: Semantic CSS classes (e.g., `.contact-name`, `.deal-value`)
3. **Tertiary**: Generic patterns with context (table rows, list items)

### Why CSS over XPath?

- CSS selectors are faster to evaluate
- Native browser API support via `querySelector`
- Easier to maintain and debug
- Sufficient for most extraction needs

### Fallback Chains

Each data field has multiple selectors tried in order:

```typescript
const CONTACT_SELECTORS = {
  name: [
    '[data-testid="contact-name"]',     // Best: Test ID
    '.contact-name-cell a',              // Good: Semantic class
    'td.name-column a',                  // Okay: Positional
    '[class*="contactName"]'             // Fallback: Partial match
  ],
  // ... similar for other fields
};
```

### Dynamic Content Handling

- Uses `waitForElement()` with configurable timeout
- MutationObserver for lazy-loaded content detection
- Retry logic with exponential backoff

## Storage Schema

```typescript
interface ACStorageSchema {
  contacts: ACContact[];      // Extracted contact records
  deals: ACDeal[];            // Extracted deal records
  tasks: ACTask[];            // Extracted task records
  lastSync: number;           // Unix timestamp of last extraction
  syncInProgress: boolean;    // Lock flag for race conditions
}

interface ACContact {
  id: string;                 // Generated stable ID
  name: string;
  email: string;
  phone: string;
  tags: string[];
  owner: string;
  extractedAt: number;        // Extraction timestamp
  sourceUrl: string;          // Page URL when extracted
}

interface ACDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  pipeline: string;
  stage: string;
  primaryContact: string;
  owner: string;
  extractedAt: number;
  sourceUrl: string;
}

interface ACTask {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'todo';
  title: string;
  dueDate: string;
  assignee: string;
  linkedEntity: {
    type: 'contact' | 'deal';
    id: string;
    name: string;
  } | null;
  extractedAt: number;
  sourceUrl: string;
}
```

### Deduplication Strategy

Records are deduplicated by their `id` field:
- If record exists with same ID, compare `extractedAt` timestamps
- Newer extraction overwrites older data
- No duplicate records in storage

### Race Condition Handling

Multi-tab extraction is handled with:
- `syncInProgress` flag in storage
- Lock timeout (30 seconds) for stale locks
- Retry logic with configurable attempts
- Atomic read-modify-write pattern

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Extension                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐         ┌───────────────────────────┐    │
│  │  Popup (React)│◄───────►│   Service Worker          │    │
│  │               │ Messages│   (Background)            │    │
│  │  - Dashboard  │         │                           │    │
│  │  - Search     │         │   - Message routing       │    │
│  │  - Export     │         │   - Storage coordination  │    │
│  └───────────────┘         │   - Badge updates         │    │
│                            └───────────────────────────┘    │
│                                        │                     │
│                                        │ Messages            │
│                                        ▼                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Content Script                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │ Contact     │  │ Deal        │  │ Task        │    │  │
│  │  │ Harvester   │  │ Harvester   │  │ Harvester   │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │ View        │  │ Extraction Indicator            │ │  │
│  │  │ Detector    │  │ (Shadow DOM)                    │ │  │
│  │  └─────────────┘  └─────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  chrome.storage.local                   │  │
│  │                  (Persistent Data)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Development

### Hot Reload

```bash
npm run dev
```

The CRXJS Vite plugin enables hot reload during development.

### Debugging

- **Popup**: Right-click extension icon > "Inspect popup"
- **Content Script**: Use page DevTools, scripts appear under Sources
- **Service Worker**: `chrome://extensions/` > extension card > "service worker" link

## License

MIT
