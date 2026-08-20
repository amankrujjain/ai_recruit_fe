import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { OrgSettingsForm } from '@/components/admin/settings/OrgSettingsForm';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/adminOrgApi', () => ({
  getMyOrganizationRequest: vi.fn(),
  updateOrgSettingsRequest: vi.fn(),
  updateAiPreferencesRequest: vi.fn(),
  uploadOrgLogoRequest: vi.fn(),
  getVoicesRequest: vi.fn(),
  updateEmailTemplateRequest: vi.fn(),
  updateWhatsAppTemplateRequest: vi.fn(),
  getBillingRequest: vi.fn(),
  getAuditLogsRequest: vi.fn(),
  getAuditStatsRequest: vi.fn(),
}));

vi.mock('@/store/slices/adminOrgSlice', async (importOriginal) => {
  const actual = await importOriginal();
  const wrap = (thunk) =>
    Object.assign(vi.fn((...args) => thunk(...args)), {
      fulfilled: thunk.fulfilled,
      rejected: thunk.rejected,
      pending: thunk.pending,
      typePrefix: thunk.typePrefix,
    });
  return {
    ...actual,
    updateOrgSettings: wrap(actual.updateOrgSettings),
    uploadOrgLogo: wrap(actual.uploadOrgLogo),
    updateAiPreferences: wrap(actual.updateAiPreferences),
    fetchVoices: wrap(actual.fetchVoices),
  };
});

import { toast } from 'sonner';
import {
  getMyOrganizationRequest,
  updateOrgSettingsRequest,
  updateAiPreferencesRequest,
  uploadOrgLogoRequest,
  getVoicesRequest,
} from '@/api/adminOrgApi';
import {
  updateOrgSettings,
  updateAiPreferences,
  uploadOrgLogo,
  fetchVoices,
} from '@/store/slices/adminOrgSlice';

const baseOrg = {
  organizationId: 'org-1',
  organizationName: 'Acme Corp',
  industry: 'Information Technology',
  companySize: '201 - 500',
  website: 'https://acme.com',
  phone: '+1 999 000 1111',
  timezone: 'America/Chicago',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  workingDays: ['mon', 'tue', 'wed'],
  logoUrl: 'https://cdn.example/logo.png',
  createdAt: '2026-01-15T00:00:00.000Z',
  country: { name: 'United States' },
  settings: {
    displayName: 'Acme Brand',
    followUpEnabled: true,
    interviewLanguage: 'English',
    interviewStyle: 'Balanced',
    questionDifficulty: 'Medium',
    realtimeTranscription: true,
    silenceTimeoutSec: 10,
    useJobDescription: true,
    useResume: false,
    useCompanyInfo: false,
    useCustomDocs: false,
    allowInternetKnowledge: true,
    maxSources: 5,
    scoringMode: 'default',
    scoreTechnical: 40,
    scoreCommunication: 20,
    scoreProblemSolving: 20,
    scoreExperience: 10,
    scoreOthers: 10,
    useConversationalMemory: true,
    maintainContext: true,
    adaptQuestions: true,
    beConcise: false,
    encourageDetailedAnswers: true,
    voiceId: 'voice-1',
  },
};

const orgResponse = (overrides = {}) => ({
  data: {
    data: {
      ...baseOrg,
      ...overrides,
      settings: {
        ...baseOrg.settings,
        ...(overrides.settings || {}),
      },
    },
  },
});

describe('OrgSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyOrganizationRequest.mockResolvedValue(orgResponse());
    getVoicesRequest.mockResolvedValue({
      data: {
        data: {
          voices: [
            { voiceId: 'voice-1', name: 'Rachel', previewUrl: 'https://cdn.example/preview.mp3' },
            { voiceId: 'voice-2', name: 'Adam', previewUrl: null },
          ],
        },
      },
    });
  });

  it('shows loading then fills the general settings form', async () => {
    renderWithProviders(<OrgSettingsForm />);

    expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: /organization settings/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Brand')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@acme.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1 999 000 1111')).toBeInTheDocument();
    expect(screen.getByText('Company Information')).toBeInTheDocument();
    expect(screen.getByText('Basic Working Hours')).toBeInTheDocument();
    expect(screen.getByText('09:00 AM - 06:00 PM')).toBeInTheDocument();
  });

  it('keeps Save Changes outside Basic Working Hours', async () => {
    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    const workingHoursHeading = screen.getByText('Basic Working Hours');
    const workingHoursCard = workingHoursHeading.closest('.border-slate-200');
    expect(workingHoursCard).toBeTruthy();
    expect(within(workingHoursCard).queryByRole('button', { name: /save changes/i })).toBeNull();

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('saves general settings with the expected payload', async () => {
    const user = userEvent.setup();
    updateOrgSettingsRequest.mockResolvedValueOnce(orgResponse());

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Brand')).toBeInTheDocument());

    const displayName = screen.getByDisplayValue('Acme Brand');
    await user.clear(displayName);
    await user.type(displayName, 'HireMe Brand');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('General settings saved'));
    expect(updateOrgSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'HireMe Brand',
        industry: 'Information Technology',
        companySize: '201 - 500',
        website: 'https://acme.com',
        phone: '+1 999 000 1111',
        timezone: 'America/Chicago',
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        workingDays: ['mon', 'tue', 'wed'],
      })
    );
    expect(updateOrgSettingsRequest).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'HireMe Brand' })
    );
  });

  it('sends null website and workingDays when cleared', async () => {
    const user = userEvent.setup();
    updateOrgSettingsRequest.mockResolvedValueOnce(orgResponse({ website: null, workingDays: [] }));

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('https://acme.com')).toBeInTheDocument());

    await user.clear(screen.getByDisplayValue('https://acme.com'));
    await user.click(screen.getByRole('button', { name: 'Mon' }));
    await user.click(screen.getByRole('button', { name: 'Tue' }));
    await user.click(screen.getByRole('button', { name: 'Wed' }));

    expect(screen.getByText('Not set')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(updateOrgSettingsRequest).toHaveBeenCalled());
    expect(updateOrgSettingsRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        website: null,
        workingDays: null,
      })
    );
  });

  it('toggles working days and updates the summary label', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    expect(screen.getByText('Monday - Wednesday')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Thu' }));
    await user.click(screen.getByRole('button', { name: 'Fri' }));

    expect(screen.getByText('Monday - Friday')).toBeInTheDocument();
  });

  it('toasts an error when general save fails', async () => {
    const user = userEvent.setup();
    updateOrgSettingsRequest.mockRejectedValueOnce({});

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to update settings')
    );
  });

  it('uploads a logo and surfaces upload errors', async () => {
    const user = userEvent.setup();
    uploadOrgLogoRequest.mockResolvedValueOnce(
      orgResponse({ logoUrl: 'https://cdn.example/new.png' })
    );

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /change logo/i }));
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Logo uploaded'));
    expect(uploadOrgLogo).toHaveBeenCalled();

    uploadOrgLogoRequest.mockRejectedValueOnce({});
    await user.click(screen.getByRole('button', { name: /change logo/i }));
    await user.upload(fileInput, file);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to upload logo'));
  });

  it('falls back to Upload Logo when the image fails to load', async () => {
    getMyOrganizationRequest.mockResolvedValueOnce(
      orgResponse({ logoUrl: '/uploads/broken.png' })
    );

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    fireEvent.error(screen.getByAltText(/organization logo/i));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /upload logo/i })).toBeInTheDocument()
    );
  });

  it('switches to AI Preferences, loads voices, and saves AI settings', async () => {
    const user = userEvent.setup();
    updateAiPreferencesRequest.mockResolvedValueOnce(orgResponse());

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /ai preferences/i }));

    await waitFor(() => expect(screen.getByText('AI Model Preferences')).toBeInTheDocument());
    expect(screen.getByText(/configure ai behavior/i)).toBeInTheDocument();
    expect(fetchVoices).toHaveBeenCalled();
    await waitFor(() => expect(getVoicesRequest).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('AI preferences saved'));
    expect(updateAiPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        followUpEnabled: true,
        interviewLanguage: 'English',
        interviewStyle: 'Balanced',
        questionDifficulty: 'Medium',
        silenceTimeoutSec: 10,
        maxSources: 5,
        scoringMode: 'default',
        voiceId: 'voice-1',
      })
    );
  });

  it('toasts an error when AI preferences save fails', async () => {
    const user = userEvent.setup();
    updateAiPreferencesRequest.mockRejectedValueOnce({});

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /ai preferences/i }));
    await waitFor(() => expect(screen.getByText('AI Model Preferences')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to update AI preferences')
    );
  });

  it('toggles an AI knowledge source before saving', async () => {
    const user = userEvent.setup();
    updateAiPreferencesRequest.mockResolvedValueOnce(orgResponse());

    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /ai preferences/i }));
    await waitFor(() => expect(screen.getByText('Resume')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /resume/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(updateAiPreferencesRequest).toHaveBeenCalled());
    expect(updateAiPreferencesRequest).toHaveBeenCalledWith(
      expect.objectContaining({ useResume: true })
    );
  });

  it('warns before reload when there are unsaved changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Brand')).toBeInTheDocument());

    await user.type(screen.getByDisplayValue('Acme Brand'), ' Updated');
    fireEvent.keyDown(window, { key: 'F5' });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()
    );
    expect(
      screen.getByText(/if you reload now, those changes will be lost/i)
    ).toBeInTheDocument();
  });

  it('links Contact Support to the admin support page', async () => {
    renderWithProviders(<OrgSettingsForm />);
    await waitFor(() => expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument());

    const supportLinks = screen.getAllByRole('link', { name: /contact support/i });
    expect(supportLinks.length).toBeGreaterThan(0);
    expect(supportLinks[0]).toHaveAttribute('href', '/admin/support');
  });
});
