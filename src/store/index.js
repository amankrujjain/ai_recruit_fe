import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import organizationReducer from './slices/organizationSlice';
import registrationReducer from './slices/registrationSlice';
import recruitersReducer from './slices/recruitersSlice';
import adminOrgReducer from './slices/adminOrgSlice';
import countryReducer from './slices/countrySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    organizations: organizationReducer,
    registrations: registrationReducer,
    recruiters: recruitersReducer,
    adminOrg: adminOrgReducer,
    countries: countryReducer,
  },
});

export default store;
