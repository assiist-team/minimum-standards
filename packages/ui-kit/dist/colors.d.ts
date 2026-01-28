/**
 * Centralized color theme for the application.
 * All non-error colors should be defined here and referenced throughout the app.
 * Error colors may be hard-coded where needed for error states.
 */
export interface ColorTheme {
    status: {
        met: {
            background: string;
            text: string;
            bar: string;
            barComplete: string;
            barOverflow: string;
        };
        inProgress: {
            background: string;
            text: string;
            bar: string;
        };
        missed: {
            background: string;
            text: string;
            bar: string;
        };
    };
    archive: {
        background: string;
        text: string;
        badgeBackground: string;
        badgeText: string;
    };
    primary: {
        main: string;
        light: string;
        dark: string;
    };
    background: {
        /**
         * Screen-level background behind main content (darkest surface in dark mode).
         * Use for the primary "page" container.
         */
        screen: string;
        /**
         * App chrome background (headers, toolbars, bottom tab bar).
         * In dark mode, should match the screen background for a unified chrome.
         */
        chrome: string;
        /**
         * Default surface for contained areas (e.g. sections). Often used as a base for cards.
         */
        surface: string;
        /**
         * Backwards-compatible aliases (prefer screen/chrome/surface going forward).
         */
        primary: string;
        secondary: string;
        tertiary: string;
        card: string;
        modal: string;
        overlay: string;
    };
    text: {
        primary: string;
        secondary: string;
        tertiary: string;
        disabled: string;
        inverse: string;
    };
    border: {
        primary: string;
        secondary: string;
        focus: string;
    };
    tabBar: {
        background: string;
        activeTint: string;
        inactiveTint: string;
        border: string;
    };
    button: {
        primary: {
            background: string;
            text: string;
        };
        secondary: {
            background: string;
            text: string;
        };
        disabled: {
            background: string;
            text: string;
        };
        destructive: {
            background: string;
            text: string;
        };
        icon: {
            background: string;
            icon: string;
        };
    };
    input: {
        background: string;
        border: string;
        borderError: string;
        text: string;
        placeholder: string;
    };
    shadow: string;
    divider: string;
    activityIndicator: string;
    link: string;
}
export declare const lightTheme: ColorTheme;
export declare const darkTheme: ColorTheme;
/**
 * Get status colors for a given status string
 */
export declare function getStatusColors(theme: ColorTheme, status: 'Met' | 'In Progress' | 'Missed'): {
    background: string;
    text: string;
    bar: string;
};
//# sourceMappingURL=colors.d.ts.map