import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <ErrorOutline sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                        Something went wrong.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                        {this.state.error?.message || 'The 3D canvas could not be loaded.'}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => window.location.reload()}
                        sx={{ px: 4 }}
                    >
                        Reload Page
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}
