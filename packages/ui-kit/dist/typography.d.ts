import { TextStyle } from 'react-native';
/**
 * Centralized typography theme for the application.
 * All font sizes and weights should be defined here and referenced throughout the app.
 */
export type FontWeight = TextStyle['fontWeight'];
export interface TypographyTheme {
    button: {
        primary: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        secondary: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        small: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        pill: {
            fontSize: number;
            fontWeight: FontWeight;
        };
    };
    text: {
        large: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        body: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        small: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        tiny: {
            fontSize: number;
            fontWeight: FontWeight;
        };
    };
    header: {
        large: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        medium: {
            fontSize: number;
            fontWeight: FontWeight;
        };
        small: {
            fontSize: number;
            fontWeight: FontWeight;
        };
    };
    input: {
        fontSize: number;
        fontWeight: FontWeight;
    };
    label: {
        fontSize: number;
        fontWeight: FontWeight;
    };
}
export declare const typography: TypographyTheme;
//# sourceMappingURL=typography.d.ts.map