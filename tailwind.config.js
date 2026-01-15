/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './src/popup/index.html',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                surface: {
                    primary: '#ffffff',
                    secondary: '#f8fafc',
                    tertiary: '#f1f5f9',
                },
                border: {
                    light: '#e2e8f0',
                    DEFAULT: '#cbd5e1',
                    dark: '#94a3b8',
                },
                text: {
                    primary: '#0f172a',
                    secondary: '#475569',
                    tertiary: '#64748b',
                    muted: '#94a3b8',
                },
                status: {
                    success: '#16a34a',
                    successLight: '#dcfce7',
                    warning: '#d97706',
                    warningLight: '#fef3c7',
                    error: '#dc2626',
                    errorLight: '#fee2e2',
                    info: '#0284c7',
                    infoLight: '#e0f2fe',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                elevated: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            animation: {
                'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-in': 'slide-in 0.2s ease-out',
                'fade-in': 'fade-in 0.15s ease-out',
            },
            keyframes: {
                'pulse-subtle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                'slide-in': {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
