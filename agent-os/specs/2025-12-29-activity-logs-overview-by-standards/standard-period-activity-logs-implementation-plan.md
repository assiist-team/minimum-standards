# Standard Period Activity Logs Implementation Plan

## Overview

Implement a new screen that displays chronologically ordered activity logs scoped to a specific Standard period. Users can tap on any standard period (active or historical) to view all individual activity log entries for that time window.

### Key Requirements
- **Standard Period Scope**: Activity logs are filtered to a specific standard's period window
- **Chronological Display**: Activity logs ordered by timestamp within the period
- **Universal Access**: Works for both active standards and historical standards
- **Individual Log Entries**: Shows raw activity logs, not aggregated summaries

## Current System Analysis

### Data Structures
- **Standards**: Reference activities and define period boundaries via cadence
- **Activity Logs**: Individual entries with `standardId`, `value`, `occurredAtMs`, `note`
- **Activity History Documents**: Store period rollups but not individual logs

### Existing Screens
- **ActivityHistoryScreen**: Shows period summaries for one activity across multiple standards

### Navigation Context
Users should be able to access period logs from:
1. **Active Standards Dashboard**: Tap on current period
2. **Activity History**: Tap on period cards to drill down to logs

## Implementation Plan

### Phase 1: Core Data Fetching and Screen Structure

#### 1. Create StandardPeriodActivityLogsScreen Component
**Location**: `apps/mobile/src/screens/StandardPeriodActivityLogsScreen.tsx`

**Responsibilities**:
- Accept `standardId` and optional `periodStartMs`/`periodEndMs` parameters
- Fetch activity logs for the specified standard within the period window
- Display logs in chronological order
- Handle both current and historical periods

**Route Definition**:
```typescript
export type ActivitiesStackParamList = {
  // ... existing routes
  StandardPeriodActivityLogs: {
    standardId: string;
    periodStartMs?: number;
    periodEndMs?: number;
  };
};
```

#### 2. Create Data Fetching Hook
**Location**: `apps/mobile/src/hooks/useStandardPeriodActivityLogs.ts`

**Features**:
- Query activity logs by `standardId` and timestamp range
- Handle pagination for periods with many logs
- Support loading states and error handling
- Calculate period boundaries if not provided (for current periods)

**Query Logic**:
```typescript
// For current period: calculate boundaries
const window = calculatePeriodWindow(
  Date.now(),
  standard.cadence,
  timezone,
  { periodStartPreference: standard.periodStartPreference }
);

// For historical periods: use provided boundaries
const logsQuery = query(
  collection(doc(firebaseFirestore, 'users', userId), 'activityLogs'),
  where('standardId', '==', standardId),
  where('occurredAt', '>=', Timestamp.fromMillis(startMs)),
  where('occurredAt', '<', Timestamp.fromMillis(endMs)),
  where('deletedAt', '==', null)
);
```

#### 3. Update StandardProgressCard Component
**Location**: `apps/mobile/src/components/StandardProgressCard.tsx`

**Changes**:
- Add navigation to period logs when tapped
- Pass period boundaries for historical standards
- Update tap handler to navigate to logs instead of showing details

### Phase 2: Period Selection and Navigation

#### 1. Update ActivityHistoryScreen Navigation
**Location**: `apps/mobile/src/screens/ActivityHistoryScreen.tsx`

**Changes**:
- Update period cards to navigate to `StandardPeriodActivityLogsScreen` when tapped
- Pass period boundaries (`periodStartMs`, `periodEndMs`) and `standardId`

#### 2. Update Navigation Flow

**From Active Standards Dashboard**:
```
ActiveStandardsDashboardScreen → StandardPeriodActivityLogsScreen (current period)
```

**From Activity History**:
```
ActivityHistoryScreen → StandardPeriodActivityLogsScreen (specific historical period)
```

#### 3. Update Route Definitions
```typescript
export type ActivitiesStackParamList = {
  // ... existing routes
  StandardPeriodActivityLogs: {
    standardId: string;
    periodStartMs?: number;
    periodEndMs?: number;
  };
};
```

### Phase 3: UI Components and User Experience

#### 1. Activity Log Entry Component
**Location**: `apps/mobile/src/components/ActivityLogEntry.tsx`

**Features**:
- Display log value, timestamp, and optional note
- Show edit/delete actions for modifiable logs
- Consistent styling with existing log interfaces

#### 2. Period Header Component
**Location**: `apps/mobile/src/components/StandardPeriodHeader.tsx`

**Features**:
- Display period label (e.g., "Dec 16-22, 2025")
- Show period progress summary
- Include navigation breadcrumbs

#### 3. Logs List Component
**Location**: `apps/mobile/src/components/ActivityLogsList.tsx`

**Features**:
- Chronologically ordered activity log entries
- Pull-to-refresh capability
- Empty state for periods with no logs
- Loading and error states

### Phase 4: Integration and Testing

#### 1. Update StandardProgressCard Navigation
**Breaking Change Alert**: Currently tapping a StandardProgressCard shows period details. This will change to navigate to period logs.

**Migration Strategy**:
- Add long-press for period details
- Keep short-tap for viewing logs
- Update accessibility labels and hints

#### 2. Update Existing Screens
- **ActivityHistoryScreen**: Add drill-down to logs from period cards
- **ActiveStandardsDashboardScreen**: Add navigation to current period logs

#### 3. Update Standard Progress Cards
Update `StandardProgressCard` component to navigate to period logs when tapped, replacing the current period details view.

## Technical Considerations

### Data Fetching Challenges
- **Period Boundary Calculation**: Ensure consistent period windows across all screens
- **Historical vs Current Periods**: Handle boundary calculation differences
- **Query Performance**: Use efficient Firestore queries with proper indexing

### Navigation Challenges
- **Deep Linking**: Support navigation to specific periods from external links
- **Back Navigation**: Ensure proper navigation stack management
- **State Preservation**: Maintain scroll position and filters across navigation

### UI/UX Challenges
- **Log Density**: Handle periods with many log entries (pagination/virtualization)
- **Time Zone Handling**: Ensure consistent timestamp display
- **Edit Permissions**: Only allow editing logs for active standards

## Database Schema Considerations

### Current Schema
```typescript
// Activity Logs (existing)
interface ActivityLog {
  id: string;
  standardId: string;
  value: number;
  occurredAtMs: number;
  note: string | null;
  deletedAt: null;
  // ... audit fields
}

// Activity History Documents (existing)
interface ActivityHistoryDoc {
  id: string;
  activityId: string;
  standardId: string;
  periodStartMs: number;
  periodEndMs: number;
  periodLabel: string;
  // ... rollup data
}
```

### Required Indexes
Ensure Firestore has compound indexes for:
- `(standardId, occurredAt)` for period-bounded queries
- `(deletedAt, standardId, occurredAt)` for filtering deleted logs

## Success Criteria

### Functional Requirements
- ✅ Users can view activity logs for any standard period
- ✅ Logs are displayed chronologically within the period
- ✅ Navigation works from all relevant screens
- ✅ Current and historical periods are handled correctly
- ✅ Data loads efficiently with proper error handling

### User Experience
- ✅ Intuitive navigation between standards, periods, and logs
- ✅ Consistent with existing app design patterns
- ✅ Fast loading and smooth interactions
- ✅ Clear indication of which period is being viewed
- ✅ Accessible controls and feedback

### Technical Quality
- ✅ Reuses existing components and hooks where possible
- ✅ Efficient data fetching with proper caching
- ✅ Comprehensive error handling and loading states
- ✅ Proper TypeScript typing throughout
- ✅ Unit and integration test coverage

## Implementation Timeline

### Week 1: Core Infrastructure
1. Create `StandardPeriodActivityLogsScreen` and basic navigation
2. Implement `useStandardPeriodActivityLogs` hook
3. Add route definitions and navigation setup

### Week 2: Data Integration
1. Update `StandardProgressCard` to navigate to period logs
2. Update `ActivityHistoryScreen` navigation
3. Integrate with existing activity history data

### Week 3: UI Polish and Testing
1. Create log entry and period header components
2. Add loading states, error handling, and empty states
3. Comprehensive testing and bug fixes

### Week 4: Integration and Rollout
1. Update all relevant screens for navigation consistency
2. Add accessibility features and final polish
3. Performance optimization and monitoring

## Dependencies

- Existing `Standard` and `ActivityLog` types
- Existing Firestore query patterns and error handling
- Existing navigation infrastructure
- Existing theming and component library

## Risks and Mitigations

### Risk: Navigation Confusion
**Mitigation**: Clear visual hierarchy and breadcrumbs. Test navigation flows thoroughly.

### Risk: Performance Issues with Large Periods
**Mitigation**: Implement pagination and virtualized lists. Monitor query performance.

### Risk: Breaking Existing Workflows
**Mitigation**: Gradual rollout with feature flags. Preserve existing edit functionality via long-press.

### Risk: Data Consistency Issues
**Mitigation**: Leverage existing hooks and real-time updates. Ensure boundary calculations are consistent.

## Testing Strategy

### Unit Tests
- Test period boundary calculations
- Test data fetching logic
- Test component rendering with various data states

### Integration Tests
- Test navigation flows between screens
- Test data loading from various entry points
- Test edge cases (empty periods, deleted logs, timezone changes)

### User Acceptance Testing
- Verify functionality with real data
- Test accessibility features
- Gather feedback on UX and make iterations

## Future Enhancements

### Phase 1: Advanced Filtering
- Filter logs by date ranges within periods
- Search logs by note content
- Filter by log value ranges

### Phase 2: Bulk Operations
- Bulk edit multiple logs
- Bulk delete logs
- Export period logs

### Phase 3: Analytics Integration
- Period performance analytics
- Trend analysis across periods
- Comparative period views

## Conclusion

This implementation provides users with detailed visibility into their activity logging at the standard period level, enabling them to review exactly what they logged during specific time periods. The design maintains consistency with existing patterns while providing the requested functionality for both active and historical standards.