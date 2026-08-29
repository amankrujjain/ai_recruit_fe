/** Digits only, max 10 characters. */
export function sanitizePhoneInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
}

/** Exactly 10 digits. */
export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value ?? ''));
}
