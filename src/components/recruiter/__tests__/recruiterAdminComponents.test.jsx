import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadZone } from '@/components/recruiter/candidates/FileUploadZone';
import { CandidateStatusBadge } from '@/components/recruiter/candidates/CandidateStatusBadge';
import { SelectCandidatesBar } from '@/components/recruiter/candidates/SelectCandidatesBar';
import { CandidateTable } from '@/components/recruiter/candidates/CandidateTable';
import { CandidateStatus } from '@/lib/candidateStatus';
import { TablePagination } from '@/components/admin/recruiters/TablePagination';
import { RecruiterTable } from '@/components/admin/recruiters/RecruiterTable';
import { JobForm } from '@/components/recruiter/jobs/JobForm';

vi.mock('@/components/admin/recruiters/RecruiterRowActions', () => ({
  RecruiterRowActions: () => <div>actions</div>,
}));

describe('FileUploadZone', () => {
  it('uploads first file only and respects disabled/excel label', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const { rerender } = render(
      <FileUploadZone type="resume" onUpload={onUpload} />
    );
    expect(screen.getByText(/upload resume/i)).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]');
    const file = new File(['pdf'], 'cv.pdf', { type: 'application/pdf' });
    await user.upload(input, file);
    expect(onUpload).toHaveBeenCalledWith(file);

    rerender(<FileUploadZone type="excel" onUpload={onUpload} disabled />);
    expect(screen.getByText(/excel spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose file/i })).toBeDisabled();
  });

  it('handles drag over, leave, and drop', async () => {
    const onUpload = vi.fn();
    const { container } = render(
      <FileUploadZone type="resume" onUpload={onUpload} />
    );
    const zone = container.firstChild;
    const file = new File(['pdf'], 'drop.pdf', { type: 'application/pdf' });

    await act(async () => {
      zone.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
      zone.dispatchEvent(new Event('dragleave', { bubbles: true }));
      const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
      });
      zone.dispatchEvent(dropEvent);
    });
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});

describe('CandidateStatusBadge / SelectCandidatesBar', () => {
  it('badge falls back for empty/unknown', () => {
    const { rerender } = render(<CandidateStatusBadge />);
    expect(screen.getByText('—')).toBeInTheDocument();
    rerender(<CandidateStatusBadge status={CandidateStatus.HIRED} />);
    expect(screen.getByText('Hired')).toBeInTheDocument();
    rerender(<CandidateStatusBadge status="CUSTOM" />);
    expect(screen.getByText('CUSTOM')).toBeInTheDocument();
  });

  it('bar is null at 0 and pluralizes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(
      <SelectCandidatesBar selectedCount={0} selecting={false} onSelect={onSelect} />
    );
    expect(screen.queryByText(/selected/i)).toBeNull();

    rerender(<SelectCandidatesBar selectedCount={1} selecting={false} onSelect={onSelect} />);
    expect(screen.getByText('1 candidate selected')).toBeInTheDocument();

    rerender(<SelectCandidatesBar selectedCount={2} selecting onSelect={onSelect} />);
    expect(screen.getByText('2 candidates selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /selecting/i })).toBeDisabled();
  });
});

describe('CandidateTable', () => {
  it('loading / empty / populated with score and interview gating', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onToggleAll = vi.fn();
    const onViewInterview = vi.fn();
    const { rerender } = render(
      <CandidateTable
        items={[]}
        loading
        selectedIds={new Set()}
        deletingId={null}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
      />
    );
    expect(screen.getByText(/loading candidates/i)).toBeInTheDocument();

    rerender(
      <CandidateTable
        items={[]}
        loading={false}
        selectedIds={new Set()}
        deletingId={null}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
      />
    );
    expect(screen.getByText(/no candidates yet/i)).toBeInTheDocument();

    const items = [
      {
        candidateJobId: 'c1',
        status: CandidateStatus.UPLOADED,
        overallMatch: null,
        candidate: { name: 'Ada', email: 'a@b.com' },
        outreachRecords: [],
        manuallySelected: false,
      },
      {
        candidateJobId: 'c2',
        status: CandidateStatus.CALL_COMPLETED,
        overallMatch: 87.6,
        candidate: { name: 'Bob', email: 'b@b.com' },
        outreachRecords: [{ pipelineStatus: 'EMAIL_SENT' }],
        manuallySelected: true,
      },
    ];

    rerender(
      <CandidateTable
        items={items}
        loading={false}
        selectedIds={new Set(['c1'])}
        deletingId="c1"
        onToggle={onToggle}
        onToggleAll={onToggleAll}
        onViewInterview={onViewInterview}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Email sent')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText(/removing/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/view interview for Ada/i)).toBeNull();
    await user.click(screen.getByLabelText(/view interview for Bob/i));
    expect(onViewInterview).toHaveBeenCalled();
  });
});

describe('TablePagination', () => {
  it('returns null without data and paginates with ellipsis', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <TablePagination pagination={null} onPageChange={onPageChange} />
    );
    expect(screen.queryByText(/showing/i)).toBeNull();

    rerender(
      <TablePagination
        pagination={{ page: 1, totalPages: 1, total: 5, limit: 10 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/next page/i)).toBeNull();

    rerender(
      <TablePagination
        pagination={{ page: 5, totalPages: 12, total: 120, limit: 10 }}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText(/next page/i));
    expect(onPageChange).toHaveBeenCalledWith(6);
    await user.click(screen.getByLabelText(/previous page/i));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});

describe('RecruiterTable', () => {
  it('loading / empty / populated rows', () => {
    const { rerender } = render(<RecruiterTable items={[]} loading />);
    expect(screen.getByText(/loading hr members/i)).toBeInTheDocument();

    rerender(<RecruiterTable items={[]} loading={false} />);
    expect(screen.getByText(/no hr members yet/i)).toBeInTheDocument();

    rerender(
      <RecruiterTable
        items={[
          {
            accountId: 'a1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'j@x.com',
            status: 'ACTIVE',
            role: 'RECRUITER',
            lastLogin: null,
          },
        ]}
        loading={false}
      />
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('j@x.com')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });
});

describe('JobForm', () => {
  it('uses defaults and coerces submit payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<JobForm saving={false} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/job title/i), '  Engineer  ');
    await user.type(screen.getByLabelText(/description/i), '  Build APIs  ');
    await user.click(screen.getByRole('button', { name: /save job/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: 'Engineer',
        jobDescription: 'Build APIs',
        experienceMin: 0,
        experienceMax: 5,
        salaryMin: undefined,
        salaryMax: undefined,
        location: [],
        mandatorySkills: [],
        preferredSkills: [],
      })
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('prefills from initial job and coerces salaries', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <JobForm
        initial={{
          jobTitle: 'Dev',
          jobDescription: 'Code',
          experienceMin: 2,
          experienceMax: 4,
          salaryMin: 100,
          salaryMax: 200,
          location: ['Remote'],
          employmentType: 'CONTRACT',
          mandatorySkills: ['JS'],
          preferredSkills: ['TS'],
        }}
        saving={false}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByDisplayValue('Dev')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /save job/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        salaryMin: 100,
        salaryMax: 200,
        location: ['Remote'],
        mandatorySkills: ['JS'],
      })
    );
  });
});
