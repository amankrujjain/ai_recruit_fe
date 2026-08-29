import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from '@/lib/apiError';

describe('getApiErrorMessage', () => {
  it('prefers validation errors over generic message', () => {
    const err = {
      response: {
        data: {
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: [
            {
              field: 'jobDescription',
              message: '"jobDescription" length must be at least 10 characters long',
            },
          ],
        },
      },
    };

    expect(getApiErrorMessage(err, 'Failed to create job')).toBe(
      'Job Description length must be at least 10 characters long'
    );
  });

  it('joins multiple validation errors', () => {
    const err = {
      response: {
        data: {
          message: 'Validation failed',
          errors: [
            { field: 'jobTitle', message: '"jobTitle" is required' },
            { field: 'location', message: '"location" must contain at least 1 items' },
          ],
        },
      },
    };

    expect(getApiErrorMessage(err)).toBe(
      'Job Title is required. Location must contain at least 1 items'
    );
  });

  it('falls back to message then default', () => {
    expect(
      getApiErrorMessage({ response: { data: { message: 'Duplicate title' } } }, 'fallback')
    ).toBe('Duplicate title');
    expect(getApiErrorMessage({}, 'Failed to create job')).toBe('Failed to create job');
  });
});
