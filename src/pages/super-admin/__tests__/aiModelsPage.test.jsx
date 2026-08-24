import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { PageTitleProvider } from '@/context/PageTitleContext';
import { AiModelsPage } from '@/pages/super-admin/AiModelsPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/supportedLlmApi', () => ({
  listAdminSupportedLlmsRequest: vi.fn(),
  createSupportedLlmRequest: vi.fn(),
  updateSupportedLlmRequest: vi.fn(),
  replaceSupportedLlmIconRequest: vi.fn(),
  deleteSupportedLlmRequest: vi.fn(),
  listActiveSupportedLlmsRequest: vi.fn(),
}));

import { listAdminSupportedLlmsRequest } from '@/api/supportedLlmApi';

describe('AiModelsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAdminSupportedLlmsRequest.mockResolvedValue({
      data: {
        data: [
          {
            supportedLlmId: 'llm-1',
            modelName: 'gpt-4o-mini',
            displayName: 'GPT-4o mini',
            provider: 'OpenAI',
            slot: 'PRIMARY',
            iconUrl: 'https://cdn.example/p.webp',
            isActive: true,
            sortOrder: 0,
          },
        ],
      },
    });
  });

  it('lists catalog models for super admin', async () => {
    renderWithProviders(
      <PageTitleProvider>
        <AiModelsPage />
      </PageTitleProvider>
    );

    await waitFor(() => expect(screen.getByText('GPT-4o mini')).toBeInTheDocument());
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(listAdminSupportedLlmsRequest).toHaveBeenCalled();
  });

  it('opens create dialog from Add model', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PageTitleProvider>
        <AiModelsPage />
      </PageTitleProvider>
    );

    await waitFor(() => expect(screen.getByText('GPT-4o mini')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /add model/i }));
    expect(screen.getByText(/create a catalog entry/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create model/i })).toBeInTheDocument();
  });
});
