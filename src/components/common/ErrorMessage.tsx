import React from 'react';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}
