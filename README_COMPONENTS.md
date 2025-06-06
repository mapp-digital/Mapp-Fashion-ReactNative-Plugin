# Simplified Component System

This project uses a simplified component system built with React Native and NativeWind (Tailwind CSS). The components are designed to be lightweight, flexible, and leverage Tailwind's utility classes directly.

## Components Overview

### Button Component (`components/Button.tsx`)
A simple TouchableOpacity wrapper with basic styling and full Tailwind customization support.

**Usage:**
```tsx
// Primary button
<Button
  title="Submit"
  className="bg-primary-500 active:bg-primary-600 w-full px-8 py-4"
  textClassName="text-white text-lg"
  onPress={handleSubmit}
/>

// Outline button
<Button
  title="Cancel"
  className="bg-transparent border-2 border-primary-500 active:bg-primary-50"
  textClassName="text-primary-500"
  onPress={handleCancel}
/>

// Ghost button
<Button
  title="Secondary Action"
  className="bg-transparent active:bg-neutral-100"
  textClassName="text-neutral-700"
  onPress={handleAction}
/>
```

### Typography Components (`components/Typography.tsx`)
Simple Text wrappers with preset styling that can be easily customized with Tailwind classes.

**Available Components:**
- `Typography` - Base text component
- `Heading1` - Large heading (text-4xl font-bold)
- `Heading2` - Medium heading (text-3xl font-bold)
- `Heading3` - Small heading (text-2xl font-semibold)
- `Heading4` - Subtitle (text-xl font-semibold)
- `Body` - Body text (text-base)
- `Caption` - Small text (text-sm)

**Usage:**
```tsx
// Basic headings
<Heading1 className="text-primary-600 mb-4">Page Title</Heading1>
<Heading3 className="text-neutral-800">Section Title</Heading3>

// Body text with custom styling
<Body className="text-neutral-600 text-center mb-4">
  This is body text with custom styling.
</Body>

// Small caption text
<Caption className="text-neutral-500 italic">
  Additional information
</Caption>
```

### Card Component (`components/Card.tsx`)
A simple View wrapper with default card styling that can be customized with Tailwind classes.

**Usage:**
```tsx
// Basic elevated card
<Card className="border border-neutral-100 mb-6">
  <Heading4>Card Title</Heading4>
  <Body>Card content goes here</Body>
</Card>

// Outlined card
<Card className="border-2 border-neutral-200 p-6">
  <Body>Content with custom padding</Body>
</Card>

// Custom styled card
<Card className="bg-primary-50 border border-primary-200 rounded-xl">
  <Body className="text-primary-800">Custom colored card</Body>
</Card>
```

## Design System

### Color Palette
- **Primary:** Violet scale (`primary-50` to `primary-900`)
- **Secondary:** Cyan scale (`secondary-50` to `secondary-900`)
- **Accent:** Amber scale (`accent-50` to `accent-900`)
- **Neutral:** Gray scale (`neutral-50` to `neutral-900`)
- **Semantic:** Success, Error, Warning colors

### Common Patterns

**Button Variants:**
```tsx
// Primary action
className="bg-primary-500 active:bg-primary-600"
textClassName="text-white"

// Secondary action
className="bg-secondary-500 active:bg-secondary-600"
textClassName="text-white"

// Outline style
className="bg-transparent border-2 border-primary-500 active:bg-primary-50"
textClassName="text-primary-500"

// Ghost style
className="bg-transparent active:bg-neutral-100"
textClassName="text-neutral-700"
```

**Card Variants:**
```tsx
// Elevated card
className="border border-neutral-100"

// Outlined card
className="border-2 border-neutral-200"

// Custom background
className="bg-primary-50 border border-primary-200"
```

**Text Colors:**
```tsx
// Primary text
className="text-primary-600"

// Body text
className="text-neutral-800"

// Muted text
className="text-neutral-600"

// Light text
className="text-neutral-500"
```

## Benefits of This Approach

1. **Simplicity:** Minimal component APIs with maximum flexibility
2. **Performance:** No complex variant calculation functions
3. **Transparency:** Direct Tailwind classes are visible and customizable
4. **Maintainability:** Less abstraction means easier debugging and modification
5. **Consistency:** Leverages Tailwind's design tokens for consistent spacing, colors, and typography
6. **Efficiency:** Components are lightweight and focused on their core functionality

## Usage Guidelines

1. **Use the preset components** for common use cases
2. **Customize with className** for specific styling needs
3. **Follow the color palette** defined in the Tailwind config
4. **Use consistent spacing** with the custom spacing scale (page, card, section)
5. **Leverage Tailwind's responsive prefixes** when needed
