# Cards

Cards are the primary container component for displaying grouped content. All cards follow a standardized border and styling pattern.

## Card Border Standard

All card-like surfaces use:
- **Border width**: `1`
- **Border color**: `theme.border.secondary`
- **Border radius**: `12` (standard)
- **Overflow**: `hidden` (to contain rounded corners)

## Card Style Helpers

The UI kit provides helpers for consistent card styling:

```typescript
import { getCardBorderStyle, getCardBaseStyle } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();

// Get border style only
const borderStyle = getCardBorderStyle(theme);
// Returns: { borderWidth: 1, borderColor: theme.border.secondary }

// Get complete card base style
const cardStyle = getCardBaseStyle({ radius: 12 });
// Returns: { borderRadius: 12, overflow: 'hidden' }
```

## Usage Examples

### Basic Card
```typescript
import { getCardBorderStyle, getCardBaseStyle, CARD_PADDING } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();

<View style={[
  getCardBaseStyle({ radius: 12 }),
  getCardBorderStyle(theme),
  { backgroundColor: theme.background.surface, padding: CARD_PADDING }
]}>
  {/* Card content */}
</View>
```

### Card List
```typescript
import { CARD_LIST_GAP } from '@nine4/ui-kit';

<FlatList
  data={items}
  renderItem={({ item }) => (
    <View style={[cardStyle, borderStyle, { backgroundColor: theme.background.surface }]}>
      {/* Card content */}
    </View>
  )}
  contentContainerStyle={{ gap: CARD_LIST_GAP }}
/>
```

## What Counts as a Card

A component/container is considered a "card" if it has most of these characteristics:
- Rounded corners (`borderRadius`)
- A surface background (`theme.background.card` or `theme.background.surface`)
- Often has elevation/shadow or is used as a grouped container

Examples:
- `StandardCard` (Standards library)
- `StandardProgressCard` (Dashboard)
- `ActivityLogEntry` (Logs list)
- Settings screen grouped cards
- Stats panels
- Period history list rows

## Card Components

### StandardCard
Displays a standard with its activity, volume/period, and actions.

### StandardProgressCard
Shows progress toward a standard with status indicators, progress bars, and action buttons.

### ActivityLogEntry
Displays a single log entry with timestamp, value, and optional note.

## Visual Consistency

All cards should:
- Use the same border width and color
- Be clearly visible in both light and dark modes
- Match the Settings card border weight and tone
- Maintain shadows/elevation if present (border doesn't replace them)

## Related Documentation

- [Card Border Normalization Plan](../../ui-card-border-normalization-plan.md) - Historical context on standardization
