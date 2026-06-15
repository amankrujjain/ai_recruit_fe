import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '@/store';
import { AppRoutes } from '@/routes/AppRoutes';
import { AppToaster } from '@/components/ui/Toaster';
import { useAuthInit } from '@/hooks/useAuth';

function AppShell() {
  useAuthInit();
  return (
    <>
      <AppRoutes />
      <AppToaster />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </Provider>
  );
}
