# Inputs

Form input styling and patterns.

## Input Colors

Inputs use dedicated theme colors:

```typescript
interface InputColors {
  background: string;      // Input background
  border: string;          // Default border
  borderError: string;     // Error state border
  text: string;           // Input text color
  placeholder: string;    // Placeholder text color
}
```

## Basic Input

```typescript
import { typography, BUTTON_BORDER_RADIUS } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();

<TextInput
  style={[
    styles.input,
    {
      backgroundColor: theme.input.background,
      borderColor: theme.input.border,
      color: theme.input.text,
      borderRadius: BUTTON_BORDER_RADIUS,
    },
    typography.input
  ]}
  placeholder="Enter text"
  placeholderTextColor={theme.input.placeholder}
/>
```

## Input with Error State

```typescript
const [hasError, setHasError] = useState(false);

<TextInput
  style={[
    styles.input,
    {
      backgroundColor: theme.input.background,
      borderColor: hasError ? theme.input.borderError : theme.input.border,
      color: theme.input.text,
      borderRadius: BUTTON_BORDER_RADIUS,
    },
    typography.input
  ]}
  placeholder="Enter text"
  placeholderTextColor={theme.input.placeholder}
/>
```

## Labeled Input

```typescript
import { typography } from '@nine4/ui-kit';

<View>
  <Text style={[
    styles.label,
    { color: theme.text.primary },
    typography.label
  ]}>
    Field Label
  </Text>
  <TextInput
    style={[
      styles.input,
      {
        backgroundColor: theme.input.background,
        borderColor: theme.input.border,
        color: theme.input.text,
        borderRadius: BUTTON_BORDER_RADIUS,
      },
      typography.input
    ]}
    placeholder="Enter value"
    placeholderTextColor={theme.input.placeholder}
  />
</View>
```

## Usage Guidelines

- Always provide clear labels for inputs
- Use error border color when validation fails
- Ensure placeholder text is readable but clearly distinct from actual input
- Maintain consistent border radius with buttons (8px)
- Use input typography for consistent font sizing

## Implementation

Input colors and typography are exported from `@nine4/ui-kit`:

```typescript
import { typography, BUTTON_BORDER_RADIUS } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
```
