import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from '@/components/ui/TagInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { Avatar } from '@/components/ui/Avatar';
import { FilterSelect } from '@/components/ui/SelectMenu';
import { UserStatus } from '@/lib/userStatus';

describe('TagInput', () => {
  it('adds on Enter, ignores blank/dupes, removes on badge click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <TagInput value={[]} onChange={onChange} placeholder="Add tag" />
    );

    const input = screen.getByPlaceholderText('Add tag');
    await user.type(input, '  ');
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'React');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(['React']);

    rerender(<TagInput value={['React']} onChange={onChange} placeholder="Add tag" />);
    await user.type(screen.getByPlaceholderText('Add tag'), 'React');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText(/React/));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} placeholder="tags" />);
    await user.type(screen.getByPlaceholderText('tags'), 'Node');
    await user.tab();
    expect(onChange).toHaveBeenCalledWith(['Node']);
  });
});

describe('ConfirmDialog', () => {
  it('renders via portal and confirms', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete?"
        description="Cannot undo"
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^confirm$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('blocks close while loading and hides cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Wait"
        loading
        hideCancel
        onOpenChange={onOpenChange}
      />
    );
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
    await user.click(screen.getByLabelText(/close dialog overlay/i));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it('closes on Escape when not loading', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="Esc" onOpenChange={onOpenChange} onCancel={onCancel} />
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('Badge / StatusDot / Avatar', () => {
  it('Badge applies variants', () => {
    const { rerender } = render(<Badge variant="success">Ok</Badge>);
    expect(screen.getByText('Ok').className).toContain('emerald');
    rerender(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('StatusDot maps known and unknown statuses', () => {
    const { rerender } = render(<StatusDot status={UserStatus.ACTIVE} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    rerender(<StatusDot status="WEIRD" />);
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
  });

  it('Avatar initials and fallback', () => {
    const { rerender } = render(<Avatar firstName="Ada" lastName="Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    rerender(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});

describe('FilterSelect', () => {
  it('maps empty/null value to all label and selected value to option label', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <FilterSelect
        value=""
        onValueChange={onValueChange}
        allLabel="All statuses"
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'DISABLED', label: 'Disabled' },
        ]}
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('All statuses');

    rerender(
      <FilterSelect
        value="ACTIVE"
        onValueChange={onValueChange}
        allLabel="All statuses"
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'DISABLED', label: 'Disabled' },
        ]}
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Active');
  });

  it('emits empty string when all option is chosen', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterSelect
        value="ACTIVE"
        onValueChange={onValueChange}
        allLabel="All statuses"
        options={[{ value: 'ACTIVE', label: 'Active' }]}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const allOption = await screen.findByRole('option', { name: 'All statuses' });
    await user.click(allOption);
    expect(onValueChange).toHaveBeenCalledWith('');
  });
});
