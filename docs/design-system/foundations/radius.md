# Border Radius

Border radius tokens define consistent rounded corners throughout the app.

## Radius Constants

```typescript
export const BUTTON_BORDER_RADIUS = 8;  // Standard button radius
```

## Usage Guidelines

### Buttons
Use `BUTTON_BORDER_RADIUS` for all buttons to maintain consistency:

```typescript
import { BUTTON_BORDER_RADIUS } from '@nine4/ui-kit';

<TouchableOpacity
  style={[
    styles.button,
    { borderRadius: BUTTON_BORDER_RADIUS }
  ]}
>
  <Text>Button</Text>
</TouchableOpacity>
```

### Cards
Cards typically use a larger radius (12px) for a softer appearance. This is defined in the card style helpers (see [Cards](../components/cards.md)).

## Implementation

Radius constants are exported from `@nine4/ui-kit`:

```typescript
import { BUTTON_BORDER_RADIUS } from '@nine4/ui-kit';
```

## Design Rationale

The button radius of 8px matches the Activity Library "Create" button and provides a consistent, modern appearance without being too rounded.
