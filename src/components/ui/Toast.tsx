'use client';

import * as React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

export const Toaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className:
          '!bg-surface !text-text-primary !border-border !shadow-lg !rounded-md !text-sm',
        descriptionClassName: '!text-text-muted',
      }}
    />
  );
};

export { toast };

