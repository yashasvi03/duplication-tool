import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullscreen?: boolean;
}

/**
 * Loading Component
 * Displays a loading spinner with optional message
 */
export function Loading({ message = 'Loading...', fullscreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}
