# Standards Session-Based Redesign Plan

## Overview
Redesign standards to support session-based organization with per-session volume and frequency, enabling better progress tracking and feedback features.

## Goals
1. Support session-based standards (e.g., "5 sessions/week × 15 minutes = 75 minutes/week")
2. Enable long-term aggregation tracking (e.g., total hours meditated)
3. Provide intuitive UI for configuring session-based standards
4. **No backward compatibility required** - Can redesign data model freely

## Current State Analysis

### Current Data Model
- **Activity**: Has `unit` (base unit like "minutes", "miles", "calls")
- **Standard**: Has `minimum` (total), `unit`, `cadence` (frequency)
- **ActivityLog**: Has `value` (logged amount in base unit)

### Current Limitations
- No way to express "5 sessions of 15 minutes each"
- No distinction between session frequency and session volume
- Cannot track session-level progress separately from total volume
- Summary strings don't show session breakdown

## Proposed Data Model Changes

### Standard Type Enhancement
Add session-based configuration to `Standard`:

```typescript
export type Standard = {
  // ... existing fields ...
  
  // NEW: Session-based configuration (required)
  sessionConfig: {
    // User-friendly label for the “count” dimension.
    // Examples: "session", "run", "workout", "practice"
    sessionLabel: string;
    sessionsPerCadence: number;  // e.g., 5 sessions per week
    volumePerSession: number;     // e.g., 15 minutes per session
  };
  
  // minimum is ALWAYS calculated from sessionConfig
  // minimum = sessionsPerCadence × volumePerSession
  // This ensures consistency and enables session-level tracking
}
```

**Note**: Since backward compatibility isn't required, we can make `sessionConfig` required. However, we may still want to support a "simple" mode where users can think of it as just entering a total, but it's still stored as session config internally (e.g., 1 session × 75 minutes).

### Key Design Decisions Needed

#### Decision 1: Session Configuration Required vs Optional
**Question**: Should session-based configuration be required, or optional?

**Decision**: **Required in data model, but two UI modes** - Since backward compatibility isn't needed, we can require `sessionConfig` in the data model. However, we'll keep two UI modes:
- **Session-based mode**: User explicitly enters sessions per cadence and volume per session
- **Direct minimum mode**: User enters total directly, stored internally as `1 session × total`

**Impact**: 
- Simpler data model (always has sessionConfig)
- UI offers two modes: "Session-based" (explicit) and "Direct minimum" (implicit single session)
- All standards support session-level tracking
- Better UX: users can choose the mode that makes sense for their activity

#### Decision 2: Minimum Calculation Strategy
**Question**: Should `minimum` be calculated automatically from session config, or stored separately?

**Recommendation**: **Calculate automatically** - Store `sessionConfig` and derive `minimum` when saving. This ensures consistency and reduces data duplication.

**Impact**:
- Need validation: if `sessionConfig` exists, `minimum` must equal `sessionsPerCadence × volumePerSession`
- When editing, if user changes session config, minimum updates automatically
- When editing, if user changes minimum directly, session config may need to be cleared or recalculated

#### Decision 3: Session Unit Handling
**Question**: Should sessions have their own unit, or always use Activity's base unit?

**Recommendation**: **Use Activity's base unit** - Sessions are just a way to organize volume. The base unit (from Activity) is what gets logged and aggregated.

**Example**: 
- Activity: "Meditation" with unit "minutes"
- Session: 15 minutes per session
- Log: User logs "15" (minutes) - this is one session's worth

**Alternative Consideration**: Some activities might want "sessions" as a unit (e.g., "5 sessions/week" where each session is just counted, not measured). But this seems less useful for aggregation tracking.

#### Decision 4: UI Flow for Session-Based Standards
**Question**: How should users configure session-based standards?

**Decision**: **Goal first, optional breakdown (two modes, same data model)**:

1. User selects activity (with base unit)
2. User defines the **Goal** (always):
   - “Total per period”: `[ 75 ] [ minutes ] / [ week ]`
3. User optionally adds a **Breakdown**:
   - Toggle: “Break this goal into sessions”
   - If OFF: this is **Direct minimum mode**
   - If ON: this is **Session-based mode**
4. If breakdown is ON (session-based):
   - “Call it a”: `[ session ]` (user-named; examples: run, workout)
   - “Each session is”: `[ 15 ] minutes`
   - “Sessions per week”: `[ 5 ]`
   - Live preview: “5 sessions × 15 minutes = 75 minutes / week”
5. If breakdown is OFF (direct minimum):
   - No extra inputs
   - Stored internally as: `1 {sessionLabel} × {total}` (e.g., `1 session × 1000 calls`)
   - Displayed as: “1000 calls / week” (no session breakdown shown)

**UI Considerations**:
- Default to the simplest mental model (Goal) and let users opt into Breakdown
- The “Break into sessions” toggle is the primary mode switch (instead of two competing tabs)
- Session naming should be optional but supported; default to “session”
- Use the session label throughout UI when breakdown is enabled (e.g., “3/5 runs”)

#### Decision 5: Summary String Format
**Question**: How should summary strings display session-based standards?

**Recommendation**: **Show session breakdown when applicable**:
- Session-based: `"5 sessions × 15 minutes = 75 minutes / week"`
- Direct: `"75 minutes / week"` (current format)

**Alternative**: Could show just the total: `"75 minutes / week"` and show session breakdown in detail view.

#### Decision 6: Logging Behavior
**Question**: Should logging change for session-based standards?

**Recommendation**: **No change** - Users still log in base units. A session-based standard just defines the target differently.

**Example**:
- Standard: 5 sessions/week × 15 minutes = 75 minutes/week
- User logs: "15 minutes" (one session)
- System: Adds 15 to period total, compares to 75

**Future Enhancement**: Could add "Quick log session" button that logs `volumePerSession` automatically.

## Implementation Plan

### Phase 1: Data Model Updates

#### 1.1 Update TypeScript Types
- [ ] Add `sessionConfig` to `Standard` type (required)
- [ ] Add `sessionConfig.sessionLabel` (required; default “session” at creation time)
- [ ] Update `standardSchema` in Zod to include required `sessionConfig`
- [ ] Add validation: `minimum === sessionsPerCadence × volumePerSession` (always enforced)
- [ ] Remove old direct minimum logic

#### 1.2 Update Firestore Converters
- [ ] Update `standardConverter` to handle `sessionConfig` (required)
- [ ] Calculate `minimum` from `sessionConfig` when saving
- [ ] No migration needed - fresh start

#### 1.3 Update Summary Formatting
- [ ] Enhance `formatStandardSummary` to accept `sessionConfig`
- [ ] Generate session-based summary: `"5 sessions × 15 minutes = 75 minutes / week"`
- [ ] For simple mode (1 session): Show just `"{minimum} {unit} / {cadence}"`

### Phase 2: Builder UI Updates

#### 2.1 Update Standards Builder Store
- [ ] Add state for Goal inputs (total + cadence + unit)
- [ ] Add state for Breakdown toggle (on/off)
- [ ] Add state for Breakdown inputs (`sessionLabel`, `sessionsPerCadence`, `volumePerSession`)
- [ ] Add state for `sessionsPerCadence` and `volumePerSession`
- [ ] Update `generatePayload` to always calculate `minimum` from session config
- [ ] For direct-minimum mode: Store as `1 session × total`
- [ ] Update `getSummaryPreview` to show session breakdown (or direct total)

#### 2.2 Update Standards Builder Screen
- [ ] Reframe Step 2 as **Goal**: total per period (this is always present)
- [ ] Add “Break this goal into sessions” toggle (this is the mode selector)
- [ ] If breakdown ON: show session configuration inputs (session label, sessions per cadence, volume per session)
- [ ] Show calculated minimum preview
- [ ] Add helpful instruction text to guide mode selection (see "UI Guidance Text" section below)
- [ ] Update validation logic

#### 2.3 Update Summary Display
- [ ] Update summary preview to show session breakdown
- [ ] Update standard cards/list views to show session info
- [ ] Update detail screens to show session configuration

### Phase 3: Testing & Validation

#### 3.1 Data Model Testing
- [ ] Test that all standards have `sessionConfig`
- [ ] Test that `minimum` always equals `sessionsPerCadence × volumePerSession`
- [ ] Test validation errors for invalid session configs

#### 3.2 UI Testing
- [ ] Test session-based mode (multiple sessions)
- [ ] Test simple mode (single total, stored as 1 session)
- [ ] Test editing existing standards
- [ ] Test summary display for both modes

### Phase 4: Enhanced Features (Future)

#### 4.1 Progress Tracking
- [ ] Add "Total [unit] logged" display (e.g., "Total: 10,000 minutes meditated")
- [ ] Add session completion tracking (e.g., "3 of 5 sessions completed this week")
- [ ] Add progress visualization

#### 4.2 Quick Logging
- [ ] Add "Log session" quick action that logs `volumePerSession`
- [ ] Add session counter in logging UI

## Questions for User

1. **Session Unit**: Should sessions always use the Activity's base unit, or do you want the option to have "sessions" as a unit (where you just count sessions, not measure them)?

2. **Summary Display**: Do you want the summary to always show the session breakdown (e.g., "5 sessions × 15 minutes = 75 minutes / week"), or just show the total with session info available in detail view?

3. **Mode Selection**: Should the UI default to session-based mode for certain activities (e.g., meditation, running), or always let the user choose?

4. **Minimum Editing**: If a user has a session-based standard and wants to change the total, should they:
   - Edit the session config (sessions or volume per session)?
   - Switch to direct mode?
   - Both options available?

5. **Logging UI**: Should logging change for session-based standards? For example, show "Log 1 session (15 minutes)" button?

6. **Backward Compatibility**: Do you want existing standards to be editable to add session config, or should session config only be available for new standards initially?

## UI Guidance Text

### Mode Selection Guidance

**Goal (always)**:
- Title: “Goal”
- Description: “Set your total target for the period.”
- Example: “75 minutes / week”

**Breakdown (optional)**:
- Toggle label: “Break this goal into sessions”
- Helper text: “Recommended for habits you do multiple times per period. You’ll see progress like ‘3 of 5 sessions done’.”
- Example: “5 sessions × 15 minutes = 75 minutes / week”

### Input Field Labels

**Goal**:
- “Total per [cadence]”: e.g., “Total per week”

**Breakdown**:
- “Call it a”: e.g., “session”, “run”, “workout”
- “Each [sessionLabel] is”: e.g., “Each run is 3 miles”
- “[sessionLabel]s per [cadence]”: e.g., “Runs per week”

**Direct minimum mode (breakdown OFF)**:
- No extra labels; users just set the Goal

## Technical Considerations

### Validation Rules
- `sessionConfig` is **required**
- `minimum === sessionsPerCadence × volumePerSession` (always enforced)
- `sessionsPerCadence` must be positive integer (≥ 1)
- `volumePerSession` must be positive number (> 0)

### Summary String Format
- Session-based mode (sessionsPerCadence > 1): `"{sessionsPerCadence} {sessionLabel}s × {volumePerSession} {unit} = {minimum} {unit} / {cadence}"`
- Direct minimum mode (sessionsPerCadence === 1): `"{minimum} {unit} / {cadence}"` (no session breakdown shown)

### Example Standards

**Session-Based (Meditation)**:
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

**Direct Minimum Mode (Sales Calls)** - Stored as 1 session internally:
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

1. **Finalize UI guidance text** - Need to write clear instructions for when to use each mode
2. Finalize data model design (sessionConfig required, but two UI modes)
3. Implement Phase 1 (data model)
4. Implement Phase 2 (UI with both modes)
5. Test and validate
6. Deploy

## Key Simplification

Since backward compatibility isn't required:
- ✅ `sessionConfig` can be **required** (simpler data model)
- ✅ No migration concerns
- ✅ Can redesign UI freely
- ✅ All standards support session-level tracking
- ✅ Two UI modes: "Session-based" and "Direct minimum" (user choice)
