# Planning: Bottom Tab Navigation Initialization

## Context
The app currently uses a single stack navigator with a HomeScreen menu that lists all available features. Users must navigate through this menu to access different sections. This creates unnecessary friction and doesn't follow modern mobile UX patterns.

## Proposed Solution
Implement bottom tab navigation with four main tabs:
1. **Dashboard** - Active Standards Dashboard (current default screen)
2. **Standards** - Standards Library (root) with navigation to Standards Builder, includes Active/Archived filtering
3. **Activities** - Activity Library for managing activities
4. **Settings** - Settings screen

Each tab contains a stack navigator for hierarchical navigation (e.g., Standards → Standards Builder → Standard Detail).

## Benefits
- Faster access to main features (one tap vs. menu navigation)
- Always-visible navigation context
- Follows iOS and Android platform conventions
- Better discoverability of app features
- Reduces navigation depth for common tasks

## Technical Approach
- Use `@react-navigation/bottom-tabs` (already in tech stack)
- Install `react-native-vector-icons` for tab icons
- Restructure navigation hierarchy: Root → MainTabNavigator → Individual Tab Stacks
- Remove HomeScreen component and route
- Update TypeScript navigation types
- Maintain all existing screen components (no changes to screen logic)

## Dependencies
- React Navigation bottom tabs package installation
- Icon library installation and native linking
- Navigation type updates
- Screen wrapper updates (minimal changes)

## Risks
- Breaking existing navigation flows (mitigated by thorough testing)
- Icon library native linking complexity (standard React Native setup)
- User confusion during transition (minimal - tabs are more intuitive)

## Success Criteria
- All four tabs accessible and functional
- Stack navigation works within each tab
- HomeScreen removed and all flows updated
- Navigation types are type-safe
- Tests pass for navigation structure
- No regressions in existing functionality
