
import { createTheme } from '@mui/material/styles';

const size = "small";
const theme = createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    direction: 'ltr', // left-to-right text direction
    components: {
      MuiButton: {
        defaultProps: {
          size: size,
          color: 'primary',
        },
        styleOverrides: {
          root: {
            borderRadius: 5,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: size,
        //   variant: 'outlined',
        },
      },
      MuiTypography: {
        defaultProps: {
          variant: 'body1',
        },
      },
      MuiContainer: {
        defaultProps: {
          maxWidth: 'lg',
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 3,
        },
      },
      MuiSelect: {
        defaultProps: {
          size: size,
        },
      },
      MuiFormControl: {
        defaultProps: {
          size: size,
        },
      },
      MuiMenuItem: {
        defaultProps: {
          dense: true,
        },
      },
    },
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
      success: {
        main: '#4caf50',
      },
      background: {
        default: '#f5f5f5',
      },
    },
    spacing: 8, // default spacing unit
    
  });

export default theme;