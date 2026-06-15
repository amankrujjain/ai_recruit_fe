export const PASSWORD_RULES = {
  minLength: 8,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
};

export function validatePassword(password) {
  if (password.length < PASSWORD_RULES.minLength) {
    return 'Password must be at least 8 characters';
  }
  if (!PASSWORD_RULES.pattern.test(password)) {
    return 'Include uppercase, lowercase, number, and special character';
  }
  return null;
}

export function validatePasswordMatch(password, confirm) {
  if (password !== confirm) return 'Passwords do not match';
  return null;
}
