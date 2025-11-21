# Component Library Documentation

This document provides comprehensive documentation for all UI components in the AI Debate Arena platform.

## Overview

The component library includes reusable, accessible, and performant React components built with TypeScript, Tailwind CSS, and Framer Motion.

## Component Index

- [Button](#button)
- [Card](#card)
- [Badge](#badge)
- [Alert](#alert)
- [Tabs](#tabs)
- [LoadingSpinner](#loadingspinner)
- [Skeleton](#skeleton)
- [Toast](#toast)
- [Container](#container)
- [ThemeProvider](#themeprovider)

---

## Button

A versatile button component with multiple variants, sizes, and states.

### Import

```tsx
import { Button } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'outline'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Shows loading spinner |
| `fullWidth` | `boolean` | `false` | Makes button full width |
| `leftIcon` | `ReactNode` | - | Icon on the left side |
| `rightIcon` | `ReactNode` | - | Icon on the right side |
| `disabled` | `boolean` | `false` | Disables the button |

### Examples

```tsx
// Basic button
<Button>Click Me</Button>

// With variant
<Button variant="danger">Delete</Button>

// With loading state
<Button isLoading>Saving...</Button>

// With icons
<Button leftIcon={<Play />}>Play Debate</Button>

// Full width
<Button fullWidth>Submit</Button>
```

### Accessibility

- Uses semantic `<button>` element
- Includes `aria-busy` when loading
- Proper focus indicators
- Keyboard accessible

---

## Card

A container component for grouping related content.

### Import

```tsx
import { Card } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `hover` | `boolean` | `false` | Enables hover animation |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

```tsx
// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Hoverable card
<Card hover>
  <h3>Hover Me!</h3>
</Card>

// Clickable card
<Card hover onClick={() => navigate('/debate/123')}>
  <h3>Debate #123</h3>
</Card>

// Custom padding
<Card padding="lg">
  <h3>Large Padding</h3>
</Card>
```

### Animations

- Scale animation on hover (when `hover` is true)
- Tap animation on click (when `onClick` is provided)

---

## Badge

A small label for displaying status, categories, or metadata.

### Import

```tsx
import { Badge } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

```tsx
// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>

// Size variants
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>

// Use in context
<div className="flex items-center gap-2">
  <span>GPT-4</span>
  <Badge variant="info">OpenAI</Badge>
</div>
```

### Use Cases

- Model status indicators
- Debate state labels
- Provider tags
- Fact-check results
- Category labels

---

## Alert

A component for displaying important messages to users.

### Import

```tsx
import { Alert } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Alert type |
| `title` | `string` | - | Optional title |
| `onClose` | `() => void` | - | Close handler (makes alert dismissible) |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

```tsx
// Basic alert
<Alert variant="info">
  This is an informational message.
</Alert>

// With title
<Alert variant="success" title="Success!">
  Your debate has been created.
</Alert>

// Dismissible alert
<Alert 
  variant="warning" 
  title="Warning"
  onClose={() => setShowAlert(false)}
>
  This action cannot be undone.
</Alert>
```

### Accessibility

- Uses `role="alert"` for screen readers
- Icons have `aria-hidden="true"`
- Close button has `aria-label`

---

## Tabs

A tabbed interface for organizing content into sections.

### Import

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/layout'
```

### Components

- `Tabs`: Container component
- `TabsList`: Container for tab triggers
- `TabsTrigger`: Individual tab button
- `TabsContent`: Content panel for each tab

### Props

#### Tabs

| Prop | Type | Description |
|------|------|-------------|
| `defaultValue` | `string` | Initially active tab |
| `className` | `string` | Additional CSS classes |

#### TabsTrigger

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Unique tab identifier |
| `className` | `string` | Additional CSS classes |

#### TabsContent

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Tab identifier (matches trigger) |
| `className` | `string` | Additional CSS classes |

### Example

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="statistics">Statistics</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <h2>Overview Content</h2>
  </TabsContent>

  <TabsContent value="statistics">
    <h2>Statistics Content</h2>
  </TabsContent>

  <TabsContent value="history">
    <h2>History Content</h2>
  </TabsContent>
</Tabs>
```

### Animations

- Smooth sliding indicator for active tab
- Fade in/out transitions for content

### Accessibility

- Uses proper ARIA roles (`tablist`, `tab`, `tabpanel`)
- Keyboard navigation support
- `aria-selected` for active tab

---

## LoadingSpinner

A spinner component for indicating loading states.

### Import

```tsx
import { LoadingSpinner } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| `text` | `string` | - | Optional loading text |

### Examples

```tsx
// Basic spinner
<LoadingSpinner />

// With size
<LoadingSpinner size="lg" />

// With text
<LoadingSpinner size="md" text="Loading debate..." />
```

### Use Cases

- Page loading states
- Button loading states
- Data fetching indicators
- Form submission feedback

---

## Skeleton

Placeholder components for loading states.

### Import

```tsx
import { Skeleton, DebateCardSkeleton, LeaderboardRowSkeleton } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular'` | `'rectangular'` | Skeleton shape |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

```tsx
// Text skeleton
<Skeleton variant="text" className="w-full" />
<Skeleton variant="text" className="w-3/4" />

// Circular skeleton (for avatars)
<Skeleton variant="circular" className="w-12 h-12" />

// Rectangular skeleton
<Skeleton variant="rectangular" className="w-full h-32" />

// Specialized skeletons
<DebateCardSkeleton />
<LeaderboardRowSkeleton />
```

### Use Cases

- Loading placeholders
- Optimistic UI updates
- Progressive content loading
- Better perceived performance

---

## Toast

Notification system for user feedback.

### Import

```tsx
import { ToastProvider, useToast } from '@/components/layout'
```

### Setup

Wrap your app with `ToastProvider`:

```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

### Usage

```tsx
function MyComponent() {
  const { showToast } = useToast()

  return (
    <button onClick={() => showToast('success', 'Saved successfully!')}>
      Save
    </button>
  )
}
```

### API

```tsx
showToast(type: 'success' | 'error' | 'info', message: string)
```

### Features

- Auto-dismiss after 5 seconds
- Manual dismiss option
- Stacked notifications
- Animated entrance/exit
- 3 variants (success, error, info)

---

## Container

A responsive container component for consistent page layouts.

### Import

```tsx
import { Container } from '@/components/layout'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'xl'` | Maximum width |
| `className` | `string` | `''` | Additional CSS classes |

### Examples

```tsx
// Default container
<Container>
  <h1>Page Content</h1>
</Container>

// Small container
<Container size="sm">
  <form>...</form>
</Container>

// Full width
<Container size="full">
  <div>Full width content</div>
</Container>
```

### Responsive Behavior

- Automatic horizontal padding
- Responsive max-width
- Centered content

---

## ThemeProvider

Context provider for theme management.

### Import

```tsx
import { ThemeProvider, useTheme } from '@/components/layout'
```

### Setup

Wrap your app with `ThemeProvider`:

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

### Usage

```tsx
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current: {resolvedTheme}
    </button>
  )
}
```

### API

```tsx
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}
```

### Features

- Light/Dark/System modes
- Persistent storage (localStorage)
- System preference detection
- Smooth transitions

---

## Best Practices

### Component Composition

```tsx
// Good: Compose components
<Card hover>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-white font-semibold">Debate #123</h3>
    <Badge variant="success">Active</Badge>
  </div>
  <p className="text-slate-400 text-sm mb-4">
    GPT-4 vs Claude 3.5 on AI Ethics
  </p>
  <Button fullWidth>View Debate</Button>
</Card>
```

### Accessibility

```tsx
// Good: Proper ARIA labels
<Button 
  aria-label="Delete debate"
  leftIcon={<Trash />}
>
  Delete
</Button>

// Good: Semantic HTML
<Alert variant="error" title="Error">
  Failed to load data
</Alert>
```

### Performance

```tsx
// Good: Memoize expensive components
const MemoizedCard = React.memo(DebateCard)

// Good: Use loading states
{isLoading ? <LoadingSpinner /> : <DebateList />}

// Good: Use skeletons for better UX
{isLoading ? <DebateCardSkeleton /> : <DebateCard />}
```

### Theming

```tsx
// Good: Use theme-aware classes
<div className="bg-slate-800 dark:bg-slate-900">
  <p className="text-slate-200 dark:text-slate-300">Content</p>
</div>
```

## Component Showcase

Visit `/components-showcase` (in development mode) to see all components in action with interactive examples.

## Contributing

When adding new components:

1. Follow existing patterns and conventions
2. Include TypeScript types
3. Add accessibility features
4. Document props and usage
5. Add to component showcase
6. Update this documentation

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
