/**
 * Prefer field-level validation details from the API envelope over the generic
 * top-level "Validation failed" message.
 *
 * Envelope shape:
 * { success: false, message, code, errors?: [{ field, message }] }
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;

  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    const messages = data.errors
      .map((item) => (typeof item === 'string' ? item : item?.message))
      .filter(Boolean)
      .map(humanizeValidationMessage);
    if (messages.length) return messages.join('. ');
  }

  if (data?.message) return data.message;
  if (typeof err?.message === 'string' && err.message && !err.response) {
    return err.message;
  }
  return fallback;
}

function humanizeValidationMessage(message) {
  return String(message).replace(/^"([^"]+)"/, (_, field) => labelizeField(field));
}

function labelizeField(field) {
  const spaced = field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_.-]+/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
