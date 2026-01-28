# Status Indicators

Status colors and visual indicators for standards progress.

## Status Types

The app uses three status types:
- **Met** - Standard has been met for the period
- **In Progress** - Standard is in progress but not yet met
- **Missed** - Standard was not met for the period

## Status Colors

Each status has dedicated colors for background, text, and progress bars:

```typescript
interface StatusColors {
  background: string;  // Status background color
  text: string;        // Status text color
  bar: string;         // Progress bar color
  // Met status also includes:
  barComplete?: string;    // Completed bar color
  barOverflow?: string;    // Overflow bar color
}
```

## Using Status Colors

Use the `getStatusColors()` helper to get colors for a status:

```typescript
import { getStatusColors } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();
const statusColors = getStatusColors(theme, 'Met');
// Returns: { background, text, bar, barComplete, barOverflow }

<View style={{ backgroundColor: statusColors.background }}>
  <Text style={{ color: statusColors.text }}>Met</Text>
</View>
```

## Status Badge Example

```typescript
import { getStatusColors } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

function StatusBadge({ status }: { status: 'Met' | 'In Progress' | 'Missed' }) {
  const theme = useTheme();
  const colors = getStatusColors(theme, status);
  
  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.background }
    ]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {status}
      </Text>
    </View>
  );
}
```

## Progress Bar Example

```typescript
function ProgressBar({ 
  progress, 
  status 
}: { 
  progress: number; 
  status: 'Met' | 'In Progress' | 'Missed' 
}) {
  const theme = useTheme();
  const colors = getStatusColors(theme, status);
  
  return (
    <View style={styles.progressContainer}>
      <View style={[
        styles.progressBar,
        {
          width: `${progress}%`,
          backgroundColor: colors.bar,
        }
      ]} />
    </View>
  );
}
```

## Archive Colors

Archive/destructive actions use dedicated colors:

```typescript
interface ArchiveColors {
  background: string;        // Archive background
  text: string;             // Archive text
  badgeBackground: string;   // Archive badge background
  badgeText: string;         // Archive badge text
}
```

Usage:
```typescript
const theme = useTheme();

<View style={{ backgroundColor: theme.archive.background }}>
  <Text style={{ color: theme.archive.text }}>Archived</Text>
</View>
```

## Implementation

Status color helpers are exported from `@nine4/ui-kit`:

```typescript
import { getStatusColors, type ColorTheme } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
```
