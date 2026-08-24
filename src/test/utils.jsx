import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '@/store/slices/authSlice';
import organizationReducer from '@/store/slices/organizationSlice';
import registrationReducer from '@/store/slices/registrationSlice';
import recruitersReducer from '@/store/slices/recruitersSlice';
import adminOrgReducer from '@/store/slices/adminOrgSlice';
import countryReducer from '@/store/slices/countrySlice';
import jobsReducer from '@/store/slices/jobsSlice';
import candidatesReducer from '@/store/slices/candidatesSlice';
import recruitmentReducer from '@/store/slices/recruitmentSlice';
import supportReducer from '@/store/slices/supportSlice';
import supportedLlmReducer from '@/store/slices/supportedLlmSlice';

export const rootReducer = {
  auth: authReducer,
  organizations: organizationReducer,
  registrations: registrationReducer,
  recruiters: recruitersReducer,
  adminOrg: adminOrgReducer,
  countries: countryReducer,
  jobs: jobsReducer,
  candidates: candidatesReducer,
  recruitment: recruitmentReducer,
  support: supportReducer,
  supportedLlms: supportedLlmReducer,
};

export const makeStore = (preloadedState) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
  });

export const renderWithProviders = (
  ui,
  {
    preloadedState,
    store = makeStore(preloadedState),
    route = '/',
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};
