# Planning: Bottom Tab Navigation Requirements

## Initial Description
Replace the current HomeScreen menu-based navigation with a bottom tab navigator containing four tabs (Dashboard, Standards, Activities, Settings), each with its own stack navigator for drill-down flows.

## Requirements Discussion

### Navigation Structure

**Q1:** Should we keep the HomeScreen as a separate screen accessible from somewhere, or completely remove it?
**Answer:** Remove it entirely. The bottom tabs replace its functionality. Users can access all features directly from tabs.

**Q2:** How should we organize Activities and Standards? Should Activities be its own tab?
**Answer:** Yes, Activities should be its own tab (Activities tab) containing the Activity Library screen. Standards should be its own tab (Standards tab) containing Standards Library as root, with Standards Builder accessible from there.

**Q3:** Should Archived Standards be a separate tab or part of the Standards tab?
**Answer:** Part of the Standards tab. The Standards Library screen already has Active/Archived filtering tabs, so this fits naturally within the Standards tab.

**Q4:** What should happen when a user taps the active tab? Should it scroll to top, reset to root, or do nothing?
**Answer:** Standard React Navigation behavior: tapping the active tab resets that tab's stack to its root screen. This is expected UX.

**Q5:** Should we support deep linking to specific tabs?
**Answer:** Yes, React Navigation supports this out of the box. We should ensure our deep linking configuration works with the new tab structure.

### Icon Library

**Q6:** Which icon library should we use?
**Answer:** `react-native-vector-icons` is the standard for React Native CLI projects. It provides Material Icons, Ionicons, FontAwesome, etc. We'll use Material Icons for consistency with Material Design.

**Q7:** Do we need custom icons or can we use standard icon sets?
**Answer:** Standard icon sets are sufficient for MVP. We can customize later if needed.

### Back Button Behavior

**Q8:** When Dashboard is the root of its tab, should it still have a back button that goes to Settings?
**Answer:** No. When a screen is the root of a tab, it shouldn't have a back button. Users can navigate to Settings via the Settings tab. Remove the back button from Dashboard when it's a tab root.

**Q9:** How should we handle back navigation from detail screens within tabs?
**Answer:** Standard stack navigation back button behavior. Each tab's stack handles its own back navigation independently.

### Styling and Theming

**Q10:** Should the tab bar match iOS or Android design guidelines, or use a custom design?
**Answer:** Follow platform conventions (iOS Human Interface Guidelines and Android Material Design). React Navigation's default tab bar already follows these conventions.

**Q11:** Should we support custom tab bar colors or use default platform styling?
**Answer:** Use default platform styling for MVP, but ensure it respects light/dark theme modes. We can customize colors later if needed.

### Migration Strategy

**Q12:** How should we handle existing navigation state when users upgrade?
**Answer:** React Navigation handles state persistence automatically. Users will start at the default tab (Dashboard) on first launch with new navigation structure. No migration needed.

**Q13:** Should we maintain backward compatibility with old navigation routes?
**Answer:** No. The HomeScreen route will be removed. Any deep links or navigation that referenced HomeScreen will need to be updated to use tab routes instead.
