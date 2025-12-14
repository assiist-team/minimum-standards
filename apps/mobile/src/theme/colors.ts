/**
 * Centralized color theme for the application.
 * All non-error colors should be defined here and referenced throughout the app.
 * Error colors may be hard-coded where needed for error states.
 */

export interface ColorTheme {
  // Status colors
  status: {
    met: {
      background: string;
      text: string;
      bar: string;
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

  // Archive/destructive colors (red - defined in theme, not hardcoded)
  archive: {
    background: string;
    text: string;
    badgeBackground: string;
    badgeText: string;
  };

  // Primary UI colors (grayscale - NO BLUE)
  primary: {
    main: string;
    light: string;
    dark: string;
  };

  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
    modal: string;
    overlay: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };

  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };

  // Tab bar colors
  tabBar: {
    background: string;
    activeTint: string;
    inactiveTint: string;
    border: string;
  };

  // Button colors
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
  };

  // Input colors
  input: {
    background: string;
    border: string;
    borderError: string;
    text: string;
    placeholder: string;
  };

  // Shadow colors
  shadow: string;

  // Divider colors
  divider: string;

  // Activity indicator color
  activityIndicator: string;

  // Link colors
  link: string;
}

export const lightTheme: ColorTheme = {
  status: {
    met: {
      background: '#E6F4EA',
      text: '#1E8E3E',
      bar: '#1E8E3E',
    },
    inProgress: {
      background: '#FFF8E1',
      text: '#B06E00',
      bar: '#F4B400',
    },
    missed: {
      background: '#FCE8E6',
      text: '#C5221F',
      bar: '#C5221F',
    },
  },
  primary: {
    main: '#000',
    light: '#666',
    dark: '#111',
  },
  background: {
    primary: '#f7f8fa',
    secondary: '#fff',
    tertiary: '#fafafa',
    card: '#fff',
    modal: '#fff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#111',
    secondary: '#666',
    tertiary: '#999',
    disabled: '#ccc',
    inverse: '#fff',
  },
  border: {
    primary: '#ddd',
    secondary: '#eee',
    focus: '#000',
  },
  tabBar: {
    background: '#F9F9F9',
    activeTint: '#1E8E3E',
    inactiveTint: '#999',
    border: '#E5E5EA',
  },
  button: {
    primary: {
      background: '#000',
      text: '#fff',
    },
    secondary: {
      background: '#f0f0f0',
      text: '#333',
    },
    disabled: {
      background: '#ccc',
      text: '#fff',
    },
    destructive: {
      background: '#c00',
      text: '#fff',
    },
  },
  input: {
    background: '#fff',
    border: '#ddd',
    borderError: '#c00',
    text: '#333',
    placeholder: '#999',
  },
  shadow: '#000',
  divider: '#eee',
  activityIndicator: '#000',
  link: '#000',
  archive: {
    background: '#ffebee',
    text: '#d32f2f',
    badgeBackground: '#FDECEA',
    badgeText: '#C64B30',
  },
};

export const darkTheme: ColorTheme = {
  status: {
    met: {
      background: '#1E3A2E',
      text: '#4CAF50',
      bar: '#4CAF50',
    },
    inProgress: {
      background: '#3E2E1A',
      text: '#FFC107',
      bar: '#FFC107',
    },
    missed: {
      background: '#3E1E1E',
      text: '#EF5350',
      bar: '#EF5350',
    },
  },
  primary: {
    main: '#fff',
    light: '#B0B0B0',
    dark: '#000',
  },
  background: {
    primary: '#1E1E1E',
    secondary: '#2E2E2E',
    tertiary: '#323232',
    card: '#2E2E2E',
    modal: '#2E2E2E',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#E0E0E0',
    secondary: '#B0B0B0',
    tertiary: '#888',
    disabled: '#666',
    inverse: '#111',
  },
  border: {
    primary: '#38383A',
    secondary: '#38383A',
    focus: '#fff',
  },
  tabBar: {
    background: '#1C1C1E',
    activeTint: '#4CAF50',
    inactiveTint: '#888',
    border: '#38383A',
  },
  button: {
    primary: {
      background: '#fff',
      text: '#000',
    },
    secondary: {
      background: '#333',
      text: '#E0E0E0',
    },
    disabled: {
      background: '#666',
      text: '#B0B0B0',
    },
    destructive: {
      background: '#EF5350',
      text: '#fff',
    },
  },
  input: {
    background: '#2E2E2E',
    border: '#38383A',
    borderError: '#EF5350',
    text: '#E0E0E0',
    placeholder: '#888',
  },
  shadow: '#000',
  divider: '#38383A',
  activityIndicator: '#fff',
  link: '#fff',
  archive: {
    background: '#3E1E1E',
    text: '#EF5350',
    badgeBackground: '#3E1E1E',
    badgeText: '#EF5350',
  },
};

/**
 * Get status colors for a given status string
 */
export function getStatusColors(
  theme: ColorTheme,
  status: 'Met' | 'In Progress' | 'Missed'
): { background: string; text: string; bar: string } {
  switch (status) {
    case 'Met':
      return theme.status.met;
    case 'In Progress':
      return theme.status.inProgress;
    case 'Missed':
      return theme.status.missed;
    default:
      return theme.status.missed;
  }
}
