# UI Mockup: Session-Based Standards Builder

## Current UI Flow (Step 2: Minimum + Unit)

```
┌─────────────────────────────────────┐
│ Step 2                              │
│ Minimum + unit                      │
├─────────────────────────────────────┤
│ [Minimum Qty] [Unit]                │
│   75          minutes                │
└─────────────────────────────────────┘
```

## Proposed UI Flow (Step 2: Minimum Configuration)

### Option A: Mode Toggle at Top

```
┌─────────────────────────────────────┐
│ Step 2                              │
│ Minimum + unit                      │
├─────────────────────────────────────┤
│ How do you want to define your      │
│ minimum?                             │
│                                      │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Session-based│ │ Direct total │  │
│ │    (●)       │ │    ( )       │  │
│ └──────────────┘ └──────────────┘  │
│                                      │
│ Sessions per week: [5]               │
│ Volume per session: [15] minutes     │
│                                      │
│ Calculated total: 75 minutes / week  │
└─────────────────────────────────────┘
```

### Option B: Radio Buttons (Recommended)

```
┌─────────────────────────────────────┐
│ Step 2                              │
│ Minimum + unit                      │
├─────────────────────────────────────┤
│ Define by sessions or total?        │
│                                      │
│ (●) Session-based                   │
│     Set frequency and volume per     │
│     session                          │
│                                      │
│ ( ) Direct total                    │
│     Enter the total amount directly  │
│                                      │
│ ─────────────────────────────────── │
│                                      │
│ Sessions per week: [5]               │
│ Volume per session: [15] minutes     │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Preview: 5 sessions × 15 minutes│ │
│ │          = 75 minutes / week     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Option C: Collapsible Sections

```
┌─────────────────────────────────────┐
│ Step 2                              │
│ Minimum + unit                      │
├─────────────────────────────────────┤
│                                      │
│ ▼ Session-based (recommended)       │
│   ┌───────────────────────────────┐ │
│   │ Sessions per week: [5]        │ │
│   │ Volume per session: [15] min  │ │
│   │                               │ │
│   │ Total: 75 minutes / week      │ │
│   └───────────────────────────────┘ │
│                                      │
│ ▶ Direct total                       │
│                                      │
└─────────────────────────────────────┘
```

## Recommended Approach: Option B with Enhancements

### Full Step 2 UI Design

```
┌─────────────────────────────────────┐
│ Step 2                              │
│ Minimum + unit                      │
├─────────────────────────────────────┤
│ How would you like to define your   │
│ standard?                            │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ (●) Session-based                │ │
│ │                                  │ │
│ │ Perfect for activities like      │ │
│ │ meditation, running, or workouts │ │
│ │ where you do multiple sessions   │ │
│ │ per week.                        │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ ( ) Direct total                │ │
│ │                                  │ │
│ │ Enter the total amount directly  │ │
│ │ (e.g., "1000 calls per week")    │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ─────────────────────────────────── │
│                                      │
│ Sessions per week:                   │
│ [5]                                  │
│                                      │
│ Volume per session:                  │
│ [15] [minutes ▼]                     │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Preview                          │ │
│ │ 5 sessions × 15 minutes         │ │
│ │ = 75 minutes / week              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### When Direct Mode is Selected

```
┌─────────────────────────────────────┐
│ Step 2                              │
│ Minimum + unit                      │
├─────────────────────────────────────┤
│ How would you like to define your   │
│ standard?                            │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ ( ) Session-based                │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ (●) Direct total                │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ─────────────────────────────────── │
│                                      │
│ Minimum quantity:                   │
│ [75]                                 │
│                                      │
│ Unit:                                │
│ [minutes]                            │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Preview                          │ │
│ │ 75 minutes / week                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Summary Display Updates

### Standard Card (Dashboard)

**Session-based standard:**
```
┌─────────────────────────────────────┐
│ Meditation                          │
│ 5 sessions × 15 min = 75 min/week   │
│ ▓▓▓▓▓▓▓▓░░░░ 60/75                  │
└─────────────────────────────────────┘
```

**Direct standard:**
```
┌─────────────────────────────────────┐
│ Sales Calls                         │
│ 1000 calls / week                   │
│ ▓▓▓▓▓▓▓▓░░░░ 750/1000              │
└─────────────────────────────────────┘
```

### Detail Screen

**Session-based standard:**
```
┌─────────────────────────────────────┐
│ Meditation                          │
│                                      │
│ Standard:                            │
│ 5 sessions × 15 minutes             │
│ = 75 minutes / week                  │
│                                      │
│ This Week:                           │
│ • 3 sessions completed               │
│ • 45 minutes logged                  │
│ • 30 minutes remaining               │
│                                      │
│ All Time:                            │
│ • 1,250 sessions completed           │
│ • 18,750 minutes (312.5 hours)      │
└─────────────────────────────────────┘
```

## Implementation Notes

### Component Structure
```typescript
<View>
  <Text>How would you like to define your standard?</Text>
  
  <RadioButtonGroup>
    <RadioButton 
      selected={mode === 'session'}
      onPress={() => setMode('session')}
      label="Session-based"
      description="Perfect for activities..."
    />
    <RadioButton 
      selected={mode === 'direct'}
      onPress={() => setMode('direct')}
      label="Direct total"
      description="Enter the total amount..."
    />
  </RadioButtonGroup>
  
  {mode === 'session' ? (
    <SessionConfigInputs
      sessionsPerCadence={sessionsPerCadence}
      volumePerSession={volumePerSession}
      unit={unit}
      cadence={cadence}
      onChange={handleSessionChange}
    />
  ) : (
    <DirectMinimumInputs
      minimum={minimum}
      unit={unit}
      onChange={handleDirectChange}
    />
  )}
  
  <SummaryPreview 
    mode={mode}
    sessionConfig={sessionConfig}
    minimum={minimum}
    unit={unit}
    cadence={cadence}
  />
</View>
```

### State Management Updates

```typescript
interface StandardsBuilderState {
  // ... existing fields ...
  
  // NEW: Mode selection
  minimumMode: 'session' | 'direct';
  setMinimumMode: (mode: 'session' | 'direct') => void;
  
  // NEW: Session configuration
  sessionsPerCadence: number | null;
  setSessionsPerCadence: (value: number | null) => void;
  volumePerSession: number | null;
  setVolumePerSession: (value: number | null) => void;
  
  // Updated: minimum calculation
  getCalculatedMinimum: () => number | null;
}
```

### Validation Logic

```typescript
function validateSessionConfig(
  sessionsPerCadence: number | null,
  volumePerSession: number | null
): { isValid: boolean; error?: string } {
  if (sessionsPerCadence === null || sessionsPerCadence <= 0) {
    return { isValid: false, error: 'Enter number of sessions' };
  }
  if (volumePerSession === null || volumePerSession <= 0) {
    return { isValid: false, error: 'Enter volume per session' };
  }
  return { isValid: true };
}
```

## Accessibility Considerations

- Radio buttons should be keyboard navigable
- Screen reader should announce mode changes
- Preview should update live as user types
- Error messages should be clearly associated with inputs

## Mobile Considerations

- Radio buttons should be large enough for touch targets (min 44x44pt)
- Input fields should use appropriate keyboards (numeric for numbers)
- Consider using steppers for numeric inputs on iOS
- Preview should be visible without scrolling
