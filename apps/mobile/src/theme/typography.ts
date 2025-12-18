/**
 * Centralized typography theme for the application.
 * All font sizes and weights should be defined here and referenced throughout the app.
 */

export interface TypographyTheme {
  // Button typography
  button: {
    primary: {
      fontSize: number;
      fontWeight: string;
    };
    secondary: {
      fontSize: number;
      fontWeight: string;
    };
    small: {
      fontSize: number;
      fontWeight: string;
    };
    pill: {
      fontSize: number;
      fontWeight: string;
    };
  };

  // Text typography
  text: {
    large: {
      fontSize: number;
      fontWeight: string;
    };
    body: {
      fontSize: number;
      fontWeight: string;
    };
    small: {
      fontSize: number;
      fontWeight: string;
    };
    tiny: {
      fontSize: number;
      fontWeight: string;
    };
  };

  // Header typography
  header: {
    large: {
      fontSize: number;
      fontWeight: string;
    };
    medium: {
      fontSize: number;
      fontWeight: string;
    };
    small: {
      fontSize: number;
      fontWeight: string;
    };
  };

  // Input typography
  input: {
    fontSize: number;
    fontWeight: string;
  };

  // Label typography
  label: {
    fontSize: number;
    fontWeight: string;
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
