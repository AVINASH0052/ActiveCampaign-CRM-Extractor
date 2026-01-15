import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

export class ACErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: '',
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message || 'An unexpected error occurred',
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Component error:', error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, errorMessage: '' });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-status-errorLight flex items-center justify-center mb-4">
                        <ErrorOutlineIcon sx={{ color: '#dc2626', fontSize: 28 }} />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-text-secondary mb-4 max-w-xs">
                        {this.props.fallbackMessage || this.state.errorMessage}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
