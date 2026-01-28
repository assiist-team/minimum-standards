# Typography

Typography tokens define font sizes and weights for consistent text styling across the app.

## Typography Theme Structure

```typescript
interface TypographyTheme {
  button: {
    primary: { fontSize, fontWeight };
    secondary: { fontSize, fontWeight };
    small: { fontSize, fontWeight };
    pill: { fontSize, fontWeight };
  };
  
  text: {
    large: { fontSize, fontWeight };
    body: { fontSize, fontWeight };
    small: { fontSize, fontWeight };
    tiny: { fontSize, fontWeight };
  };
  
  header: {
    large: { fontSize, fontWeight };
    medium: { fontSize, fontWeight };
    small: { fontSize, fontWeight };
  };
  
  input: { fontSize, fontWeight };
  label: { fontSize, fontWeight };
}
```

## Font Sizes and Weights

### Buttons
- **Primary/Secondary**: 16px, weight 600
- **Small**: 14px, weight 600
- **Pill**: 14px, weight 600

### Text
- **Large**: 20px, weight 700
- **Body**: 16px, weight 400
- **Small**: 14px, weight 400
- **Tiny**: 12px, weight 400

### Headers
- **Large**: 20px, weight 700
- **Medium**: 18px, weight 700
- **Small**: 16px, weight 600

### Form Elements
- **Input**: 16px, weight 400
- **Label**: 14px, weight 600

## Usage Guidelines

### Headers
Use header styles for screen titles and section headings:

```typescript
import { typography } from '@nine4/ui-kit';

<Text style={[styles.title, typography.header.large]}>
  Screen Title
</Text>
```

### Body Text
Use text styles for content:

```typescript
<Text style={[styles.content, typography.text.body]}>
  Main content text
</Text>
```

### Buttons
Button typography is typically combined with button colors:

```typescript
import { typography } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();
<Text style={[
  { color: theme.button.primary.text },
  typography.button.primary
]}>
  Button Text
</Text>
```

### Labels
Use label style for form labels and section titles:

```typescript
<Text style={[styles.label, typography.label]}>
  Field Label
</Text>
```

## Implementation

Typography tokens are exported from `@nine4/ui-kit`:

```typescript
import { typography, type TypographyTheme } from '@nine4/ui-kit';
```

Typography values are theme-agnostic (they don't change between light and dark modes). Color is handled separately through the color theme.
