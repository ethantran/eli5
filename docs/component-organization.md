# Component Organization Guide

## Overview

This project uses a **two-tier component structure** to maintain clear separation between reusable and application-specific components.

## Folder Structure

```
/
├── components/          # Global, reusable components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── thread.tsx      # Reusable assistant-ui components
│   ├── markdown-text.tsx
│   └── tooltip-icon-button.tsx
│
└── app/
    └── components/     # App-specific, route-specific components
        ├── guest-landing.tsx
        ├── guest-chat-interface.tsx
        ├── message-bubble.tsx
        └── DefaultCatchBoundary.tsx
```

## When to Use Each Folder

### `/components` (Root Level) 🌐
**Purpose**: Global, reusable components that could be used across different parts of the application or even in other projects.

**Use for**:
- **UI Library Components** (`/ui/`): Base design system components (buttons, cards, tooltips, etc.)
- **Reusable Business Components**: Generic components that implement common patterns
- **Third-party Integrations**: Wrappers around external libraries (assistant-ui, etc.)

**Examples**:
- `components/ui/button.tsx` - Base button component used everywhere
- `components/tooltip-icon-button.tsx` - Reusable button + tooltip pattern
- `components/thread.tsx` - Generic chat thread component
- `components/markdown-text.tsx` - Reusable markdown renderer

**Import pattern**: `@/components/...`

### `/app/components` (App Level) 🎯
**Purpose**: Application-specific components tied to particular features, routes, or business logic.

**Use for**:
- **Page Components**: Components specific to certain routes/pages
- **Feature Components**: Components tied to specific app features
- **Route Boundaries**: Error boundaries, loading states specific to routes
- **Complex Compositions**: Components that combine multiple UI components for specific use cases

**Examples**:
- `app/components/guest-landing.tsx` - Landing page specific to guest flow
- `app/components/guest-chat-interface.tsx` - Chat interface for guest users
- `app/components/level-dropdown.tsx` - Education level selector (app-specific)
- `app/components/DefaultCatchBoundary.tsx` - Route-specific error boundary

**Import pattern**: `~/components/...` (using the `~` alias for app directory)

## Decision Tree

When creating a new component, ask yourself:

```
Is this component...

├─ A base UI element (button, card, input)?
│  └─ 📁 `/components/ui/`
│
├─ Reusable across multiple features/routes?
│  └─ 📁 `/components/`
│
├─ Specific to one feature or route?
│  └─ 📁 `/app/components/`
│
└─ A composition of multiple components for a specific use case?
   └─ 📁 `/app/components/`
```

## Import Aliases

The project uses three main import aliases:

- `@/*` → Points to root directory (for global components)
- `~/*` → Points to `app/` directory (for app-specific imports)
- `convex/*` → Points to `convex/` directory (for Convex backend imports)

### Examples:

```typescript
// ✅ Importing global UI components
import { Button } from '@/components/ui/button';
import { TooltipIconButton } from '@/components/tooltip-icon-button';

// ✅ Importing app-specific components (from within app/)
import { GuestLanding } from '~/components/guest-landing';

// ✅ Importing app utilities
import { LEVEL_DEFINITIONS } from '~/lib/types';

// ✅ Importing Convex API and functions
import { api } from 'convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
```

## Best Practices

### 1. **Start Global, Move Specific**
When in doubt, start in `/components`. If you find the component becomes too specific to one feature, move it to `/app/components`.

### 2. **Composition Over Duplication**
Before creating app-specific components, consider if you can compose existing global components:

```typescript
// ✅ Good: Compose global components
function FeatureCard() {
  return (
    <Card>
      <CardHeader>
        <Button variant="outline">Action</Button>
      </CardHeader>
    </Card>
  );
}

// ❌ Avoid: Creating app-specific versions of UI components
function FeatureButton() { /* custom button logic */ }
```

### 3. **Clear Naming**
- Global components: Generic names (`Button`, `Card`, `Thread`)
- App components: Specific names (`GuestLanding`, `ChatInterface`)

### 4. **Dependencies Direction**
- ✅ App components can import from global components
- ❌ Global components should NOT import from app components

## Migration Guide

If you need to move a component:

### From Global → App-Specific
1. Move file from `/components/` to `/app/components/`
2. Update imports from `@/components/...` to `~/components/...`
3. Update any files importing this component

### From App-Specific → Global
1. Remove app-specific logic/dependencies
2. Make component more generic/reusable
3. Move file from `/app/components/` to `/components/`
4. Update imports from `~/components/...` to `@/components/...`

## Summary

This structure provides:
- **Clear separation** between reusable and specific code
- **Better maintainability** as the app grows
- **Easier testing** of isolated components
- **Potential for component library extraction** from `/components` 