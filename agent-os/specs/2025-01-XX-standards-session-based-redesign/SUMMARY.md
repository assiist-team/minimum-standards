# Standards Session-Based Redesign - Summary & Questions

## Overview
This redesign introduces session-based organization for standards, allowing users to define standards like "5 sessions per week × 15 minutes per session = 75 minutes per week" instead of just "75 minutes per week".

## Key Benefits
1. **Better organization**: Natural fit for activities like meditation, running, workouts
2. **Progress tracking**: Can track both session completion and total volume
3. **Intuitive setup**: Matches how people think about their habits
4. **Long-term aggregation**: Enables "total hours meditated" type features

## Proposed Solution

### Data Model
Add **required** `sessionConfig` to `Standard`:
```typescript
sessionConfig: {
  sessionsPerCadence: number;  // e.g., 5 sessions per week
  volumePerSession: number;     // e.g., 15 minutes per session
}
```

- **Required**: No backward compatibility needed - simpler data model
- **Auto-calculates minimum**: `minimum = sessionsPerCadence × volumePerSession` (always enforced)
- **Uses Activity's base unit**: Sessions use the same unit as the activity

### UI Flow
1. User selects activity (with base unit like "minutes")
2. User chooses mode: "Session-based" or "Direct minimum"
3. If session-based:
   - Enter sessions per cadence (e.g., "5 sessions")
   - Enter volume per session (e.g., "15 minutes")
   - Preview shows: "5 sessions × 15 minutes = 75 minutes / week"
4. If direct minimum:
   - Enter total directly (e.g., "1000 calls")
   - Stored internally as: `1 session × 1000 calls`
   - Preview shows: "1000 calls / week" (no session breakdown)

## Questions for You

### 1. Session Unit Strategy ⭐ **IMPORTANT**
**Question**: Should sessions always use the Activity's base unit, or do you want the option to have "sessions" as a unit (where you just count sessions, not measure them)?

**Example A (Recommended)**: 
- Activity: "Meditation" with unit "minutes"
- Standard: 5 sessions/week × 15 minutes/session
- Logging: User logs "15" (minutes) - this is one session

**Example B (Alternative)**:
- Activity: "Meditation" with unit "sessions"  
- Standard: 5 sessions/week
- Logging: User logs "1" (session) - no volume measurement

**Recommendation**: **Option A** - Use Activity's base unit. This enables volume tracking and aggregation (e.g., "10,000 hours meditated"). If you just want to count sessions without measuring them, you can use direct mode with "sessions" as the unit.

**Your decision**: [ ]

---

### 2. Summary Display Format
**Question**: How should summary strings display session-based standards?

**Option A**: Always show breakdown
- `"5 sessions × 15 minutes = 75 minutes / week"`

**Option B**: Show total, breakdown in detail view
- Summary: `"75 minutes / week"`
- Detail: Shows "5 sessions × 15 minutes"

**Recommendation**: **Option A** - Show breakdown in summary. It's more informative and helps users understand their standard at a glance.

**Your decision**: [ ]

---

### 3. Default Mode Selection
**Question**: Should the UI default to session-based mode for certain activities, or always let the user choose?

**Option A**: Always show choice (no default)
**Option B**: Default to session-based for activities like "Meditation", "Running", "Workout"
**Option C**: Default to direct minimum mode, but suggest session-based

**Decision**: **Option A** - Always show choice, no default. User explicitly selects the mode that makes sense for their activity.

**Note**: We'll need clear guidance text to help users understand when to use each mode.

---

### 4. Editing Behavior
**Question**: If a user has a session-based standard and wants to change the total, should they:
- A) Edit the session config (sessions or volume per session)?
- B) Switch to direct mode?
- C) Both options available?

**Recommendation**: **Option C** - Allow both. When editing:
- Show current mode (session-based or direct)
- Allow switching modes
- If in session mode, editing sessions/volume updates minimum automatically
- If in direct mode, editing minimum clears session config (with confirmation)

**Your decision**: [ ]

---

### 5. Logging UI Enhancement
**Question**: Should logging change for session-based standards?

**Option A**: No change - users log in base units as before
**Option B**: Add "Log 1 session" quick button that logs `volumePerSession`
**Option C**: Show session context (e.g., "Log 15 minutes (1 session)")

**Recommendation**: **Option C** - Show helpful context but don't change core logging. Future enhancement could add quick "Log session" button.

**Your decision**: [ ]

---

### 6. Backward Compatibility Strategy
**Question**: Should existing standards be editable to add session config, or should session config only be available for new standards initially?

**Decision**: **Not applicable** - No backward compatibility needed. All new standards will use the session-based data model (with two UI modes).

---

## Implementation Phases

### Phase 1: Data Model (Backend)
- Update TypeScript types
- Update Zod schemas
- Update Firestore converters
- Update summary formatting

### Phase 2: Builder UI
- Add mode selection
- Add session configuration inputs
- Update validation
- Update preview

### Phase 3: Display Updates
- Update standard cards
- Update detail screens
- Update summary strings

### Phase 4: Testing & Polish
- Test data model (all standards have sessionConfig)
- Test editing flows (both modes)
- Add helpful instruction text to guide mode selection
- Polish UI/UX

## Example Standards

### Session-Based (Meditation)
```typescript
{
  activityId: "meditation-id",
  minimum: 75,  // calculated: 5 × 15
  unit: "minutes",
  cadence: { interval: 1, unit: "week" },
  sessionConfig: {
    sessionsPerCadence: 5,
    volumePerSession: 15
  },
  summary: "5 sessions × 15 minutes = 75 minutes / week"
}
```

### Direct Minimum Mode (Sales Calls) - Stored as 1 session internally
```typescript
{
  activityId: "sales-calls-id",
  minimum: 1000,  // calculated: 1 × 1000
  unit: "calls",
  cadence: { interval: 1, unit: "week" },
  sessionConfig: {
    sessionsPerCadence: 1,
    volumePerSession: 1000
  },
  summary: "1000 calls / week"  // Direct minimum mode - no session breakdown shown
}
```

## Next Steps

1. **Review this document** and answer the questions above
2. **Finalize design decisions** based on your answers
3. **Approve implementation plan** in `plan.md`
4. **Begin Phase 1** (data model updates)

## Files Created

- `plan.md` - Detailed implementation plan
- `ui-mockup.md` - UI design mockups and component structure
- `SUMMARY.md` - This file (questions and decisions)

All files are in: `agent-os/specs/2025-01-XX-standards-session-based-redesign/`
