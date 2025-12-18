# Concept Diagram: Session-Based Standards

## Current Model (Direct Minimum)

```
Activity: "Meditation"
  └─ unit: "minutes"

Standard: "Meditation Standard"
  ├─ activityId: "meditation-id"
  ├─ minimum: 75
  ├─ unit: "minutes"
  ├─ cadence: { interval: 1, unit: "week" }
  └─ summary: "75 minutes / week"

User logs:
  ├─ Log 1: 15 minutes
  ├─ Log 2: 20 minutes
  ├─ Log 3: 15 minutes
  ├─ Log 4: 25 minutes
  └─ Total: 75 minutes ✓ (met standard)
```

## Proposed Model (Session-Based)

```
Activity: "Meditation"
  └─ unit: "minutes" (base unit for aggregation)

Standard: "Meditation Standard"
  ├─ activityId: "meditation-id"
  ├─ minimum: 75 (calculated: 5 × 15)
  ├─ unit: "minutes"
  ├─ cadence: { interval: 1, unit: "week" }
  ├─ sessionConfig:
  │   ├─ sessionsPerCadence: 5
  │   └─ volumePerSession: 15
  └─ summary: "5 sessions × 15 minutes = 75 minutes / week"

User logs:
  ├─ Session 1: 15 minutes (1 session completed)
  ├─ Session 2: 15 minutes (2 sessions completed)
  ├─ Session 3: 15 minutes (3 sessions completed)
  ├─ Session 4: 15 minutes (4 sessions completed)
  ├─ Session 5: 15 minutes (5 sessions completed) ✓
  └─ Total: 75 minutes ✓ (met standard)
  
Progress tracking:
  ├─ Sessions completed: 5/5 ✓
  ├─ Volume logged: 75/75 minutes ✓
  └─ All-time total: 18,750 minutes (312.5 hours)
```

## Comparison: Direct vs Session-Based

### Direct Minimum (Current)
```
┌─────────────────────────────────┐
│ Standard: 75 minutes / week     │
│                                 │
│ This Week:                      │
│ • 60 minutes logged             │
│ • 15 minutes remaining          │
│                                 │
│ All Time:                       │
│ • 18,750 minutes total          │
└─────────────────────────────────┘
```

### Session-Based (Proposed)
```
┌─────────────────────────────────┐
│ Standard:                       │
│ 5 sessions × 15 min = 75 min/wk │
│                                 │
│ This Week:                      │
│ • 4 sessions completed           │
│ • 60 minutes logged             │
│ • 1 session remaining (15 min)  │
│                                 │
│ All Time:                       │
│ • 1,250 sessions completed      │
│ • 18,750 minutes (312.5 hours)  │
└─────────────────────────────────┘
```

## Data Flow

### Creating a Session-Based Standard

```
User selects Activity
  └─ Activity: "Meditation" (unit: "minutes")
      │
      ├─ User chooses "Session-based" mode
      │   ├─ Enters: 5 sessions per week
      │   ├─ Enters: 15 minutes per session
      │   └─ System calculates: 5 × 15 = 75 minutes
      │
      └─ Standard saved:
          ├─ minimum: 75
          ├─ sessionConfig: { sessionsPerCadence: 5, volumePerSession: 15 }
          └─ summary: "5 sessions × 15 minutes = 75 minutes / week"
```

### Logging Activity

```
User logs activity
  └─ Standard: "5 sessions × 15 minutes = 75 minutes / week"
      │
      ├─ User enters: 15 minutes
      │   └─ System records:
      │       ├─ value: 15 (in base unit: minutes)
      │       ├─ occurredAt: timestamp
      │       └─ Updates period total: +15 minutes
      │
      └─ Progress updated:
          ├─ Period total: 15/75 minutes
          ├─ Sessions completed: 1/5 (if 15 = volumePerSession)
          └─ All-time total: +15 minutes
```

## Use Cases

### Use Case 1: Meditation
- **Activity**: Meditation (unit: minutes)
- **Standard**: 5 sessions/week × 15 minutes = 75 minutes/week
- **Logging**: User logs "15 minutes" for each meditation session
- **Tracking**: Can see "3 of 5 sessions completed" and "45 of 75 minutes"

### Use Case 2: Running
- **Activity**: Running (unit: miles)
- **Standard**: 3 sessions/week × 3 miles = 9 miles/week
- **Logging**: User logs "3 miles" for each run
- **Tracking**: Can see "2 of 3 runs completed" and "6 of 9 miles"

### Use Case 3: Sales Calls (Direct - No Sessions)
- **Activity**: Sales Calls (unit: calls)
- **Standard**: 1000 calls/week (direct minimum)
- **Logging**: User logs "50 calls" (no session concept)
- **Tracking**: Just shows "750 of 1000 calls"

## Benefits Visualization

```
Before (Direct Only):
┌──────────────────────────────┐
│ "I want to meditate 75 min/wk"│
│ How do I break this down?     │
│ • 5 sessions of 15 min?       │
│ • 3 sessions of 25 min?       │
│ • 7 sessions of ~11 min?      │
└──────────────────────────────┘

After (Session-Based):
┌──────────────────────────────┐
│ "I want to meditate           │
│  5 sessions/week × 15 min"    │
│                              │
│ Clear structure!             │
│ • Track session completion   │
│ • Track total volume         │
│ • See progress both ways     │
└──────────────────────────────┘
```
