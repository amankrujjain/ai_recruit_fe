import { configureStore } from '@reduxjs/toolkit';
import { injectStore } from '@/api/storeAccess';
import authReducer from './slices/authSlice';
import organizationReducer from './slices/organizationSlice';
import registrationReducer from './slices/registrationSlice';
import recruitersReducer from './slices/recruitersSlice';
import adminOrgReducer from './slices/adminOrgSlice';
import countryReducer from './slices/countrySlice';
import jobsReducer from './slices/jobsSlice';
import candidatesReducer from './slices/candidatesSlice';
import recruitmentReducer from './slices/recruitmentSlice';
import supportReducer from './slices/supportSlice';

const store = configureStore({
  reducer: {
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
  },
});

// Must run after configureStore so axios interceptors can dispatch without importing this module.
injectStore(store);

export default store;
