# Spacing

Spacing tokens provide consistent layout spacing throughout the app.

## Spacing Constants

```typescript
export const SCREEN_PADDING = 16;    // Padding for screen edges
export const CARD_LIST_GAP = 12;     // Gap between cards in lists
export const CARD_PADDING = 16;      // Padding inside cards
```

## Usage Guidelines

### Screen Padding
Use `SCREEN_PADDING` for consistent padding at screen edges:

```typescript
import { SCREEN_PADDING } from '@nine4/ui-kit';

<View style={{ padding: SCREEN_PADDING }}>
  {/* Screen content */}
</View>
```

### Card Lists
Use `CARD_LIST_GAP` for spacing between cards in vertical lists:

```typescript
import { CARD_LIST_GAP } from '@nine4/ui-kit';

<FlatList
  data={items}
  renderItem={renderCard}
  contentContainerStyle={{ gap: CARD_LIST_GAP }}
/>
```

### Card Padding
Use `CARD_PADDING` for consistent internal padding within cards:

```typescript
import { CARD_PADDING } from '@nine4/ui-kit';

<View style={styles.card}>
  <View style={{ padding: CARD_PADDING }}>
    {/* Card content */}
  </View>
</View>
```

## Implementation

Spacing constants are exported from `@nine4/ui-kit`:

```typescript
import { SCREEN_PADDING, CARD_LIST_GAP, CARD_PADDING } from '@nine4/ui-kit';
```

## Design Rationale

These values were chosen to:
- Keep screen padding stable across all screens
- Standardize the space between cards in card list surfaces (Active Standards, Standards Library, History, etc.)
- Maintain consistent internal card padding for readability
