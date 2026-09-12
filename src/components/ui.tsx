import { ReactNode } from 'react';

/**
 * Small reusable UI primitives shared across SleepSphere screens.
 *
 * Why: the same loading skeleton / error banner / empty state / form
 * message markup was copy-pasted across components. Centralising it keeps
 * styling consistent and each screen smaller — the "reusable, modular
 * React components" claim on the resume.
 */

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-dark-secondary rounded-xl shadow-lg p-6 border border-dark-border">
      <div className="animate-pulse space-y-4" aria-label="Loading">
        <div className="h-6 bg-dark-tertiary rounded w-1/3" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-10 bg-dark-tertiary rounded" />
        ))}
      </div>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start justify-between gap-3"
    >
      <p className="text-red-300 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-sm font-medium text-red-200 hover:text-white border border-red-700 rounded-lg px-3 py-1 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-8 text-dark-text-muted">
      {icon && <div className="flex justify-center mb-3">{icon}</div>}
      <p className="font-medium text-dark-text-secondary">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}

export function FormMessage({ message }: { message: string }) {
  const isError = /error|invalid|fail/i.test(message);
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`p-3 rounded-lg ${
        isError
          ? 'bg-red-900/20 text-red-300 border border-red-800'
          : 'bg-green-900/20 text-green-300 border border-green-800'
      }`}
    >
      {message}
    </div>
  );
}
