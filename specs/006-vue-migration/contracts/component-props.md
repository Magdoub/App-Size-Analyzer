# Component Props Contracts

**Feature**: Vue.js Migration | **Date**: 2025-11-10

## Overview

This document defines the prop interfaces for all Vue components in the migrated application. Since TypeScript is not used, these contracts serve as:
1. **Documentation**: Reference for component API
2. **Runtime validation**: Vue PropTypes will enforce these contracts in dev mode
3. **Editor hints**: JSDoc annotations provide autocomplete

---

## Upload Components

### UploadZone.vue

**Purpose**: Drag-and-drop file upload zone with validation

**Props**:

```javascript
{
  /**
   * Callback fired when a valid file is selected
   * @type {Function}
   * @param {File} file - The selected file
   * @required
   */
  onFileSelect: {
    type: Function,
    required: true,
    validator: (fn) => typeof fn === 'function'
  },

  /**
   * Maximum file size in bytes (default: 2GB)
   * @type {Number}
   */
  maxSize: {
    type: Number,
    default: 2 * 1024 * 1024 * 1024,
    validator: (size) => size > 0
  },

  /**
   * Accepted file extensions
   * @type {String[]}
   */
  acceptedFormats: {
    type: Array,
    default: () => ['.ipa', '.apk', '.aab', '.xapk'],
    validator: (formats) => formats.every(f => typeof f === 'string' && f.startsWith('.'))
  },

  /**
   * Whether upload is disabled (e.g., during parsing)
   * @type {Boolean}
   */
  disabled: {
    type: Boolean,
    default: false
  }
}
```

**Events Emitted**:
- `file-selected` - Emitted when valid file selected (payload: `File` object)
- `validation-error` - Emitted when validation fails (payload: `string[]` error messages)

---

### FileValidator.vue

**Purpose**: Displays validation errors to user

**Props**:

```javascript
{
  /**
   * Array of validation error messages
   * @type {String[]}
   * @required
   */
  errors: {
    type: Array,
    required: true,
    validator: (errors) => errors.every(e => typeof e === 'string')
  },

  /**
   * Whether to show dismiss button
   * @type {Boolean}
   */
  dismissible: {
    type: Boolean,
    default: true
  }
}
```

**Events Emitted**:
- `dismiss` - Emitted when user dismisses error message

---

## Breakdown Components

### BreakdownView.vue

**Purpose**: Container for breakdown tab (table + sorting)

**Props**:

```javascript
{
  /**
   * Root breakdown node (file tree)
   * @type {Object}
   * @required
   */
  data: {
    type: Object,
    required: true,
    validator: (node) => {
      return node && typeof node.name === 'string' && typeof node.size === 'number';
    }
  }
}
```

**Events Emitted**: None (uses Pinia store for state)

---

### BreakdownTable.vue

**Purpose**: Virtualized sortable table of files/directories

**Props**:

```javascript
{
  /**
   * Flattened array of breakdown nodes
   * @type {Object[]}
   * @required
   */
  items: {
    type: Array,
    required: true,
    validator: (items) => items.every(item => item.name && typeof item.size === 'number')
  },

  /**
   * Current sort column
   * @type {String}
   */
  sortColumn: {
    type: String,
    default: 'name',
    validator: (col) => ['name', 'size', 'percentage'].includes(col)
  },

  /**
   * Current sort direction
   * @type {String}
   */
  sortDirection: {
    type: String,
    default: 'desc',
    validator: (dir) => ['asc', 'desc'].includes(dir)
  },

  /**
   * Set of expanded directory paths (for tree view)
   * @type {Set<String>}
   */
  expandedPaths: {
    type: Set,
    default: () => new Set()
  }
}
```

**Events Emitted**:
- `sort-change` - Emitted when column header clicked (payload: `{ column: string, direction: string }`)
- `toggle-expand` - Emitted when directory row clicked (payload: `{ path: string }`)

---

### BreakdownTabs.vue

**Purpose**: Tab navigation (Breakdown, X-Ray, Insights)

**Props**:

```javascript
{
  /**
   * Currently active tab
   * @type {String}
   * @required
   */
  modelValue: {
    type: String,
    required: true,
    validator: (tab) => ['breakdown', 'xray', 'insights'].includes(tab)
  },

  /**
   * Number of insights (for badge)
   * @type {Number}
   */
  insightCount: {
    type: Number,
    default: 0,
    validator: (count) => count >= 0
  }
}
```

**Events Emitted**:
- `update:modelValue` - Emitted when tab clicked (v-model support) (payload: `string`)

---

## X-Ray (Treemap) Components

### XRayView.vue

**Purpose**: Container for X-Ray tab (treemap + filters)

**Props**:

```javascript
{
  /**
   * Treemap data (hierarchical)
   * @type {Object}
   * @required
   */
  data: {
    type: Object,
    required: true,
    validator: (node) => node && node.children && Array.isArray(node.children)
  }
}
```

**Events Emitted**: None

---

### Treemap.vue

**Purpose**: Interactive treemap visualization (wraps @nivo/treemap)

**Props**:

```javascript
{
  /**
   * Hierarchical treemap data
   * @type {Object}
   * @required
   */
  data: {
    type: Object,
    required: true
  },

  /**
   * Treemap width in pixels
   * @type {Number}
   * @required
   */
  width: {
    type: Number,
    required: true,
    validator: (w) => w > 0
  },

  /**
   * Treemap height in pixels
   * @type {Number}
   * @required
   */
  height: {
    type: Number,
    required: true,
    validator: (h) => h > 0
  },

  /**
   * Current navigation path (breadcrumb)
   * @type {String[]}
   */
  currentPath: {
    type: Array,
    default: () => []
  },

  /**
   * Color scheme for categories
   * @type {Object}
   */
  colorScheme: {
    type: Object,
    default: () => ({
      executable: '#EF4444',
      framework: '#F59E0B',
      resource: '#10B981',
      asset: '#3B82F6',
      other: '#6B7280'
    })
  }
}
```

**Events Emitted**:
- `node-click` - Emitted when treemap node clicked (payload: `{ path: string, node: object }`)
- `node-hover` - Emitted when mouse enters node (payload: `{ path: string, node: object }`)
- `node-leave` - Emitted when mouse leaves node (payload: `null`)

---

### CategoryFilter.vue

**Purpose**: Filter treemap by file category

**Props**:

```javascript
{
  /**
   * Currently selected category
   * @type {String|null}
   */
  modelValue: {
    type: String,
    default: null,
    validator: (cat) => cat === null || ['executable', 'framework', 'resource', 'asset', 'other'].includes(cat)
  },

  /**
   * Available categories with counts
   * @type {Object}
   */
  categories: {
    type: Object,
    default: () => ({
      executable: 0,
      framework: 0,
      resource: 0,
      asset: 0,
      other: 0
    })
  }
}
```

**Events Emitted**:
- `update:modelValue` - Emitted when category selected (v-model support) (payload: `string | null`)

---

## Insights Components

### InsightsView.vue

**Purpose**: Container for Insights tab (list + filters)

**Props**:

```javascript
{
  /**
   * Array of insights
   * @type {Object[]}
   * @required
   */
  insights: {
    type: Array,
    required: true,
    validator: (insights) => insights.every(i => i.id && i.severity && i.title)
  }
}
```

**Events Emitted**: None

---

### InsightCard.vue

**Purpose**: Single insight card (expandable)

**Props**:

```javascript
{
  /**
   * Insight data
   * @type {Object}
   * @required
   */
  insight: {
    type: Object,
    required: true,
    validator: (i) => {
      return i.id && i.severity && i.title && i.description && i.category;
    }
  },

  /**
   * Whether card is expanded by default
   * @type {Boolean}
   */
  expanded: {
    type: Boolean,
    default: false
  }
}
```

**Events Emitted**:
- `toggle-expand` - Emitted when card header clicked (payload: `{ id: string, expanded: boolean }`)
- `file-click` - Emitted when affected file link clicked (payload: `{ path: string }`)

---

### InsightFilters.vue

**Purpose**: Filter insights by severity, category, search

**Props**:

```javascript
{
  /**
   * Selected severity filter
   * @type {String}
   */
  severity: {
    type: String,
    default: 'all',
    validator: (s) => ['all', 'critical', 'warning', 'info'].includes(s)
  },

  /**
   * Selected category filter
   * @type {String}
   */
  category: {
    type: String,
    default: 'all',
    validator: (c) => ['all', 'optimization', 'structure', 'compatibility'].includes(c)
  },

  /**
   * Search query
   * @type {String}
   */
  searchQuery: {
    type: String,
    default: ''
  },

  /**
   * Insight counts per severity
   * @type {Object}
   */
  severityCounts: {
    type: Object,
    default: () => ({
      critical: 0,
      warning: 0,
      info: 0
    })
  }
}
```

**Events Emitted**:
- `update:severity` - Emitted when severity filter changed (payload: `string`)
- `update:category` - Emitted when category filter changed (payload: `string`)
- `update:searchQuery` - Emitted when search input changed (payload: `string`)

---

### SeveritySection.vue

**Purpose**: Groups insights by severity level

**Props**:

```javascript
{
  /**
   * Severity level
   * @type {String}
   * @required
   */
  severity: {
    type: String,
    required: true,
    validator: (s) => ['critical', 'warning', 'info'].includes(s)
  },

  /**
   * Insights for this severity
   * @type {Object[]}
   * @required
   */
  insights: {
    type: Array,
    required: true
  },

  /**
   * Whether section is collapsed
   * @type {Boolean}
   */
  collapsed: {
    type: Boolean,
    default: false
  }
}
```

**Events Emitted**:
- `toggle-collapse` - Emitted when section header clicked (payload: `{ severity: string, collapsed: boolean }`)

---

## Shared Components

### Breadcrumb.vue

**Purpose**: Hierarchical navigation breadcrumb (for X-Ray)

**Props**:

```javascript
{
  /**
   * Breadcrumb path segments
   * @type {String[]}
   * @required
   */
  path: {
    type: Array,
    required: true,
    validator: (path) => path.every(p => typeof p === 'string')
  },

  /**
   * Separator character
   * @type {String}
   */
  separator: {
    type: String,
    default: '/'
  }
}
```

**Events Emitted**:
- `navigate` - Emitted when breadcrumb segment clicked (payload: `{ index: number, path: string[] }`)

---

### ErrorBoundary.vue

**Purpose**: Catches and displays component errors

**Props**:

```javascript
{
  /**
   * Fallback message when error occurs
   * @type {String}
   */
  fallbackMessage: {
    type: String,
    default: 'Something went wrong. Please try again.'
  },

  /**
   * Whether to show retry button
   * @type {Boolean}
   */
  showRetry: {
    type: Boolean,
    default: true
  }
}
```

**Events Emitted**:
- `error` - Emitted when error captured (payload: `{ error: Error, info: string }`)
- `retry` - Emitted when retry button clicked (payload: `null`)

---

### LoadingSpinner.vue

**Purpose**: Loading indicator with progress

**Props**:

```javascript
{
  /**
   * Loading message
   * @type {String}
   */
  message: {
    type: String,
    default: 'Loading...'
  },

  /**
   * Progress percentage (0-100)
   * @type {Number|null}
   */
  progress: {
    type: Number,
    default: null,
    validator: (p) => p === null || (p >= 0 && p <= 100)
  },

  /**
   * Spinner size (small, medium, large)
   * @type {String}
   */
  size: {
    type: String,
    default: 'medium',
    validator: (s) => ['small', 'medium', 'large'].includes(s)
  }
}
```

**Events Emitted**: None

---

## Root Component

### App.vue

**Purpose**: Root application component

**Props**: None (root component doesn't receive props)

**Events Emitted**: None

---

## PropTypes Implementation Example

```vue
<!-- InsightCard.vue -->
<script>
export default {
  name: 'InsightCard',
  props: {
    insight: {
      type: Object,
      required: true,
      validator: (insight) => {
        // Runtime validation in dev mode
        const requiredFields = ['id', 'severity', 'title', 'description', 'category'];
        return requiredFields.every(field => insight[field] !== undefined);
      }
    },
    expanded: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-expand', 'file-click'], // Explicit event declarations
  setup(props, { emit }) {
    const handleToggle = () => {
      emit('toggle-expand', { id: props.insight.id, expanded: !props.expanded });
    };
    return { handleToggle };
  }
};
</script>
```

---

## Testing Strategy

**Component Tests** (Vue Test Utils):

```javascript
import { mount } from '@vue/test-utils';
import InsightCard from './InsightCard.vue';

describe('InsightCard', () => {
  it('validates required props', () => {
    // Should throw in dev mode if insight is missing required fields
    expect(() => {
      mount(InsightCard, {
        props: { insight: { id: '1' } } // Missing severity, title, etc.
      });
    }).toThrow();
  });

  it('emits toggle-expand on click', async () => {
    const wrapper = mount(InsightCard, {
      props: {
        insight: { id: '1', severity: 'warning', title: 'Test', description: 'Desc', category: 'optimization' }
      }
    });
    await wrapper.find('.header').trigger('click');
    expect(wrapper.emitted('toggle-expand')).toHaveLength(1);
  });
});
```

---

## Summary

- **20 Vue components** with defined prop contracts
- **Runtime validation** via Vue PropTypes (dev mode only)
- **Event-driven communication** with explicit `emits` declarations
- **v-model support** for two-way binding where applicable (tabs, filters)
- **No TypeScript** - PropTypes + JSDoc provide type safety
