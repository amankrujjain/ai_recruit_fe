const SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>]/;

export const PASSWORD_CHECKS = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A–Z)',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a–z)',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number (0–9)',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'One special character (!@#$%...)',
    test: (password) => SPECIAL_CHARS.test(password),
  },
];

export function getPasswordChecks(password = '') {
  return PASSWORD_CHECKS.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));
}

export function isPasswordValid(password) {
  return getPasswordChecks(password).every((rule) => rule.passed);
}

export function validatePassword(password) {
  if (isPasswordValid(password)) return null;
  return 'Password must meet all requirements below';
}

export function validatePasswordMatch(password, confirm) {
  if (password !== confirm) return 'Passwords do not match';
  return null;
}
