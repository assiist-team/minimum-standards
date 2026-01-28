import { ViewStyle } from 'react-native';
import type { ColorTheme } from './colors';
/**
 * Get card border style (standardized border width and color)
 */
export declare function getCardBorderStyle(theme: ColorTheme): ViewStyle;
/**
 * Get card base style (border radius and overflow)
 */
export declare function getCardBaseStyle(options?: {
    radius?: number;
}): ViewStyle;
/**
 * Tab bar constants for platform-specific sizing
 */
export interface TabBarConstants {
    baseTabBarHeight: {
        ios: number;
        android: number;
    };
    baseBottomPadding: {
        ios: number;
        android: number;
    };
}
export declare function getTabBarConstants(): TabBarConstants;
/**
 * Get tab bar style configuration
 */
export interface SafeAreaInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export declare function getTabBarStyle(theme: ColorTheme, insets: SafeAreaInsets): ViewStyle;
/**
 * Get screen container style
 */
export declare function getScreenContainerStyle(theme: ColorTheme): ViewStyle;
/**
 * Get screen header style
 */
export declare function getScreenHeaderStyle(theme: ColorTheme, insets: SafeAreaInsets): ViewStyle;
/**
 * Get section title style (for use with Text component)
 */
export declare function getSectionTitleStyle(theme: ColorTheme): {
    fontSize: number;
    fontWeight: string;
    textTransform: string;
    marginBottom: number;
    marginLeft: number;
    letterSpacing: number;
    color: string;
};
//# sourceMappingURL=helpers.d.ts.map