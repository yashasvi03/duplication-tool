import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Something Went Wrong</CardTitle>
                  <CardDescription className="text-red-700">
                    The application encountered an unexpected error
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="font-semibold text-red-900 mb-2">Error Details:</div>
                  <div className="text-sm text-red-800 font-mono">
                    {this.state.error.toString()}
                  </div>
                </div>
              )}

              {/* Component Stack (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer mb-2">
                    Component Stack (Development Only)
                  </summary>
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {/* User Guidance */}
              <div className="text-sm text-muted-foreground border-t pt-4">
                <div className="font-medium mb-2">What you can do:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click "Try Again" to continue without reloading the page</li>
                  <li>Click "Reload Page" to start fresh</li>
                  <li>If the problem persists, check your JSON file format</li>
                  <li>
                    Report this issue on{' '}
                    <a
                      href="https://github.com/yashasvi03/duplication-tool/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
