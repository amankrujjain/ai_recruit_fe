import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import organizationReducer from './slices/organizationSlice';
import countryReducer from './slices/countrySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    organizations: organizationReducer,
    countries: countryReducer,
  },
});

export default store;
