import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: 'font-sans',
        style: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
      }}
    />
  );
}
