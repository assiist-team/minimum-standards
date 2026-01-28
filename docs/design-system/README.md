# Design System

Welcome to the Minimum Standards design system. This is the single source of truth for the app's visual language, reusable components, and UI patterns.

## Overview

This design system provides:
- **Design tokens** (colors, typography, spacing, radius)
- **Reusable components** and their usage patterns
- **Navigation patterns** and screen layouts
- **Adoption guide** for integrating into other React Native apps

## Structure

- **[Foundations](./foundations/)** - Core design tokens and principles
  - [Colors](./foundations/colors.md) - Color palette and theme tokens
  - [Typography](./foundations/typography.md) - Font sizes, weights, and text styles
  - [Spacing](./foundations/spacing.md) - Layout spacing constants
  - [Radius](./foundations/radius.md) - Border radius tokens
- **[Components](./components/)** - Reusable UI building blocks
  - [Cards](./components/cards.md) - Card components and styling patterns
  - [Buttons](./components/buttons.md) - Button styles and variants
  - [Inputs](./components/inputs.md) - Form input styling
  - [Status Indicators](./components/status-indicators.md) - Status colors and badges
- **[Patterns](./patterns/)** - Navigation and layout patterns
  - [Bottom Tab Navigation](./patterns/bottom-tab-navigation.md) - Tab bar styling and behavior
  - [Screen Layouts](./patterns/screen-layouts.md) - Common screen container patterns
- **[Adoption](./adoption/)** - How to use this design system
  - [Getting Started](./adoption/getting-started.md) - Installation and setup
  - [Theme Selection](./adoption/theme-selection.md) - Light/dark mode implementation
  - [Migration Guide](./adoption/migration-guide.md) - Migrating from app-specific themes

## Package

The design tokens and style helpers are available as a reusable package.
In docs we use the `@nine4/ui-kit` package name.

```bash
npm install @nine4/ui-kit
```

See the [adoption guide](./adoption/getting-started.md) for details on integrating this package into your React Native app.

## Design Principles

1. **Consistency** - Use tokens and documented patterns to maintain visual consistency
2. **Accessibility** - Colors and typography meet WCAG contrast requirements
3. **Theme Support** - Full light and dark mode support with system preference detection
4. **Reusability** - Components and patterns are designed to be portable across apps

## Related Documentation

- [Card Border Normalization Plan](../ui-card-border-normalization-plan.md) - Historical context on card border standardization
