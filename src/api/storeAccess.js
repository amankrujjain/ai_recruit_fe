/**
 * Breaks api/client ↔ Redux store circular imports.
 * Store is injected once after configureStore(); client reads it lazily.
 */
let storeRef = null;

export const injectStore = (store) => {
  storeRef = store;
};

export const getStore = () => {
  if (!storeRef) {
    throw new Error('Redux store has not been injected yet');
  }
  return storeRef;
};
