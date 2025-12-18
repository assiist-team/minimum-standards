/**
 * Centralized typography theme for the application.
 * All font sizes and weights should be defined here and referenced throughout the app.
 */

type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'medium'
  | 'semibold'
  | 'demibold'
  | 'extrabold'
  | 'black'
  | number;

export interface TypographyTheme {
  // Button typography
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

  // Text typography
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

  // Header typography
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

  // Input typography
  input: {
    fontSize: number;
    fontWeight: FontWeight;
  };

  // Label typography
  label: {
    fontSize: number;
    fontWeight: FontWeight;
  };
}

export const typography: TypographyTheme = {
  button: {
    primary: {
      fontSize: 16,
      fontWeight: '600',
    },
    secondary: {
      fontSize: 16,
      fontWeight: '600',
    },
    small: {
      fontSize: 14,
      fontWeight: '600',
    },
    pill: {
      fontSize: 14,
      fontWeight: '600',
    },
  },
  text: {
    large: {
      fontSize: 20,
      fontWeight: '700',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
    },
    small: {
      fontSize: 14,
      fontWeight: '400',
    },
    tiny: {
      fontSize: 12,
      fontWeight: '400',
    },
  },
  header: {
    large: {
      fontSize: 20,
      fontWeight: '700',
    },
    medium: {
      fontSize: 18,
      fontWeight: '700',
    },
    small: {
      fontSize: 16,
      fontWeight: '600',
    },
  },
  input: {
    fontSize: 16,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
};
