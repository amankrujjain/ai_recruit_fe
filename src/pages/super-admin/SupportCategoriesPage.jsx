import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { usePageTitle } from '@/context/PageTitleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketDetailModal } from '@/components/support/TicketDetailModal';
import { TablePagination } from '@/components/admin/recruiters/TablePagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FilterSelect } from '@/components/ui/SelectMenu';
import { cn } from '@/lib/utils';
import {
  clearSupportError,
  createCategory,
  createFaq,
  deleteCategory,
  deleteFaq,
  fetchAdminCategories,
  fetchAdminFaqs,
  fetchAdminTickets,
  selectSupport,
  updateCategory,
  updateFaq,
} from '@/store/slices/supportSlice';

const AUDIENCE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'RECRUITER', label: 'Recruiter' },
];

const TICKET_STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const TABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'tickets', label: 'Tickets' },
];

const formatTicketStatus = (status) =>
  TICKET_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;

const ticketBadgeVariant = (status) => {
  if (status === 'RESOLVED') return 'success';
  if (status === 'IN_PROGRESS') return 'warning';
  return 'default';
};

const emptyCategoryForm = {
  name: '',
  description: '',
  audience: ['ADMIN', 'RECRUITER'],
  sortOrder: 0,
};

const emptyFaqForm = {
  categoryId: '',
  question: '',
  answer: '',
  shortDescription: '',
};

const formatAudience = (audience) => {
  if (!Array.isArray(audience) || audience.length === 0) return '—';
  return audience
    .map((role) => AUDIENCE_OPTIONS.find((opt) => opt.value === role)?.label || role)
    .join(', ');
};

export function SupportCategoriesPage() {
  usePageTitle('Support & FAQ');
  const dispatch = useDispatch();
  const {
    categories,
    faqs,
    adminTickets,
    adminTicketsPagination,
    loading,
    faqsLoading,
    adminTicketsLoading,
    saving,
    faqSaving,
    actionId,
    faqActionId,
    error,
  } = useSelector(selectSupport);

  const [tab, setTab] = useState('categories');
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [faqForm, setFaqForm] = useState(emptyFaqForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminFaqs());
  }, [dispatch]);

  useEffect(() => {
    if (tab !== 'tickets') return;
    const params = {
      page: ticketFilters.page,
      limit: ticketFilters.limit,
    };
    if (ticketFilters.status) params.status = ticketFilters.status;
    if (ticketFilters.search.trim()) params.search = ticketFilters.search.trim();
    dispatch(fetchAdminTickets(params));
  }, [dispatch, tab, ticketFilters]);

  const categoryOptions = categories.map((category) => ({
    value: category.categoryId,
    label: category.name,
  }));

  const openCreateCategory = () => {
    dispatch(clearSupportError());
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
    setCategoryFormOpen(true);
  };

  const openEditCategory = (category) => {
    dispatch(clearSupportError());
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      audience: Array.isArray(category.audience) ? [...category.audience] : [],
      sortOrder: category.sortOrder,
    });
    setEditingCategoryId(category.categoryId);
    setCategoryFormOpen(true);
  };

  const closeCategoryForm = () => {
    setCategoryFormOpen(false);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    dispatch(clearSupportError());
  };

  const toggleAudience = (value) => {
    setCategoryForm((prev) => {
      const has = prev.audience.includes(value);
      const audience = has
        ? prev.audience.filter((role) => role !== value)
        : [...prev.audience, value];
      return { ...prev, audience };
    });
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    if (categoryForm.audience.length === 0) {
      toast.error('Select at least one audience (Admin or Recruiter)');
      return;
    }
    const payload = { ...categoryForm, sortOrder: Number(categoryForm.sortOrder) || 0 };
    const result = editingCategoryId
      ? await dispatch(updateCategory({ categoryId: editingCategoryId, payload }))
      : await dispatch(createCategory(payload));

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editingCategoryId ? 'Support category updated' : 'Support category created');
      closeCategoryForm();
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    const result = await dispatch(deleteCategory(category.categoryId));
    if (result.meta.requestStatus === 'fulfilled') toast.success('Support category deleted');
  };

  const openCreateFaq = () => {
    dispatch(clearSupportError());
    setFaqForm({
      ...emptyFaqForm,
      categoryId: categories[0]?.categoryId || '',
    });
    setEditingFaqId(null);
    setFaqFormOpen(true);
  };

  const openEditFaq = (faq) => {
    dispatch(clearSupportError());
    setFaqForm({
      categoryId: faq.categoryId,
      question: faq.question,
      answer: faq.answer,
      shortDescription: faq.shortDescription || '',
    });
    setEditingFaqId(faq.faqId);
    setFaqFormOpen(true);
  };

  const closeFaqForm = () => {
    setFaqFormOpen(false);
    setEditingFaqId(null);
    setFaqForm(emptyFaqForm);
    dispatch(clearSupportError());
  };

  const submitFaq = async (event) => {
    event.preventDefault();
    if (!faqForm.categoryId) {
      toast.error('Select a category');
      return;
    }
    const result = editingFaqId
      ? await dispatch(updateFaq({ faqId: editingFaqId, payload: faqForm }))
      : await dispatch(createFaq(faqForm));

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editingFaqId ? 'Support FAQ updated' : 'Support FAQ created');
      closeFaqForm();
    }
  };

  const removeFaq = async (faq) => {
    if (!window.confirm(`Delete the FAQ “${faq.question}”?`)) return;
    const result = await dispatch(deleteFaq(faq.faqId));
    if (result.meta.requestStatus === 'fulfilled') toast.success('Support FAQ deleted');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Support & FAQ"
        subtitle="Manage categories, FAQs, and support tickets across organizations."
        actionLabel={tab === 'categories' ? 'Add category' : tab === 'faqs' ? 'Add FAQ' : undefined}
        onAction={
          tab === 'categories' ? openCreateCategory : tab === 'faqs' ? openCreateFaq : undefined
        }
      />

      <div className="flex gap-2 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              dispatch(clearSupportError());
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === item.id
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-muted hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <>
          {categoryFormOpen && (
            <Card>
              <CardContent className="pt-6">
                <form className="space-y-4" onSubmit={submitCategory}>
                  <h3 className="text-lg font-semibold">
                    {editingCategoryId ? 'Edit category' : 'Add category'}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                      Name
                      <input
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 font-normal"
                        value={categoryForm.name}
                        onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                        minLength="2"
                        maxLength="100"
                        required
                      />
                    </label>
                    <fieldset className="space-y-2 text-sm font-medium">
                      <legend>Audience</legend>
                      <div className="flex flex-wrap gap-4 font-normal">
                        {AUDIENCE_OPTIONS.map((option) => (
                          <label key={option.value} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={categoryForm.audience.includes(option.value)}
                              onChange={() => toggleAudience(option.value)}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <label className="block space-y-1 text-sm font-medium">
                    Description
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-border bg-card p-3 font-normal"
                      value={categoryForm.description}
                      onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                    />
                  </label>
                  <label className="block max-w-48 space-y-1 text-sm font-medium">
                    Sort order
                    <input
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 font-normal"
                      type="number"
                      value={categoryForm.sortOrder}
                      onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: event.target.value })}
                    />
                  </label>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save category'}</Button>
                    <Button type="button" variant="outline" onClick={closeCategoryForm} disabled={saving}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {loading && categories.length === 0 && <p className="text-sm text-muted">Loading categories...</p>}
              {!loading && categories.length === 0 && <p className="text-sm text-muted">No support categories found.</p>}
              {error && !categoryFormOpen && tab === 'categories' && (
                <p className="mb-4 text-sm text-red-600">{error}</p>
              )}
              {categories.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b text-muted">
                      <tr>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Audience</th>
                        <th className="pb-3 font-medium">Sort order</th>
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.categoryId} className="border-b last:border-0">
                          <td className="py-4 font-medium">{category.name}</td>
                          <td className="py-4">{formatAudience(category.audience)}</td>
                          <td className="py-4">{category.sortOrder}</td>
                          <td className="py-4 text-muted">{category.description || '—'}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditCategory(category)}
                                disabled={actionId === category.categoryId}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => removeCategory(category)}
                                disabled={actionId === category.categoryId}
                              >
                                {actionId === category.categoryId ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'faqs' && (
        <>
          {faqFormOpen && (
            <Card>
              <CardContent className="pt-6">
                <form className="space-y-4" onSubmit={submitFaq}>
                  <h3 className="text-lg font-semibold">{editingFaqId ? 'Edit FAQ' : 'Add FAQ'}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                      Category
                      <FilterSelect
                        className="mt-1 font-normal"
                        value={faqForm.categoryId}
                        onValueChange={(categoryId) => setFaqForm({ ...faqForm, categoryId })}
                        options={categoryOptions}
                        allLabel="Select a category"
                        placeholder="Select a category"
                        disabled={categoryOptions.length === 0}
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Question
                      <input
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 font-normal"
                        value={faqForm.question}
                        onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })}
                        minLength="5"
                        maxLength="300"
                        required
                      />
                    </label>
                  </div>
                  <label className="block space-y-1 text-sm font-medium">
                    Short description
                    <input
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 font-normal"
                      value={faqForm.shortDescription}
                      onChange={(event) => setFaqForm({ ...faqForm, shortDescription: event.target.value })}
                    />
                  </label>
                  <label className="block space-y-1 text-sm font-medium">
                    Answer
                    <textarea
                      className="min-h-32 w-full rounded-lg border border-border bg-card p-3 font-normal"
                      value={faqForm.answer}
                      onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })}
                      required
                    />
                  </label>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={faqSaving || categoryOptions.length === 0}>
                      {faqSaving ? 'Saving...' : 'Save FAQ'}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeFaqForm} disabled={faqSaving}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {faqsLoading && faqs.length === 0 && <p className="text-sm text-muted">Loading FAQs...</p>}
              {!faqsLoading && faqs.length === 0 && (
                <p className="text-sm text-muted">
                  {categories.length === 0
                    ? 'Create a category first, then add FAQs.'
                    : 'No FAQs found.'}
                </p>
              )}
              {error && !faqFormOpen && tab === 'faqs' && (
                <p className="mb-4 text-sm text-red-600">{error}</p>
              )}
              {faqs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b text-muted">
                      <tr>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Question</th>
                        <th className="pb-3 font-medium">Short description</th>
                        <th className="pb-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map((faq) => (
                        <tr key={faq.faqId} className="border-b last:border-0">
                          <td className="py-4 font-medium">{faq.category?.name || '—'}</td>
                          <td className="py-4">{faq.question}</td>
                          <td className="py-4 text-muted">{faq.shortDescription || '—'}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditFaq(faq)}
                                disabled={faqActionId === faq.faqId}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => removeFaq(faq)}
                                disabled={faqActionId === faq.faqId}
                              >
                                {faqActionId === faq.faqId ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'tickets' && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block min-w-48 space-y-1 text-sm font-medium">
                Status
                <FilterSelect
                  className="mt-1 font-normal"
                  value={ticketFilters.status}
                  onValueChange={(status) => setTicketFilters((prev) => ({ ...prev, status, page: 1 }))}
                  options={TICKET_STATUS_OPTIONS}
                  allLabel="All statuses"
                  placeholder="All statuses"
                />
              </label>
              <label className="block flex-1 space-y-1 text-sm font-medium">
                Search
                <Input
                  className="mt-1"
                  value={ticketFilters.search}
                  onChange={(event) => setTicketFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                    page: 1,
                  }))}
                  placeholder="Ticket number or subject..."
                />
              </label>
            </div>

            {adminTicketsLoading && adminTickets.length === 0 && (
              <p className="text-sm text-muted">Loading tickets...</p>
            )}
            {!adminTicketsLoading && adminTickets.length === 0 && (
              <p className="text-sm text-muted">No support tickets found.</p>
            )}
            {error && tab === 'tickets' && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {adminTickets.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b text-muted">
                      <tr>
                        <th className="pb-3 font-medium">Ticket</th>
                        <th className="pb-3 font-medium">Subject</th>
                        <th className="pb-3 font-medium">Organization</th>
                        <th className="pb-3 font-medium">Raised by</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Created</th>
                        <th className="pb-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {adminTickets.map((ticket) => {
                        const raiserName = ticket.raisedBy
                          ? `${ticket.raisedBy.firstName || ''} ${ticket.raisedBy.lastName || ''}`.trim()
                          : '—';
                        return (
                          <tr key={ticket.ticketId} className="border-b last:border-0">
                            <td className="py-4 font-medium text-foreground">
                              {ticket.ticketNumber}
                            </td>
                            <td className="py-4 max-w-xs truncate">
                              {ticket.subject}
                            </td>
                            <td className="py-4">
                              {ticket.organization?.organizationName || '—'}
                            </td>
                            <td className="py-4">{raiserName || '—'}</td>
                            <td className="py-4">{ticket.category?.name || '—'}</td>
                            <td className="py-4">
                              <Badge variant={ticketBadgeVariant(ticket.status)}>
                                {formatTicketStatus(ticket.status)}
                              </Badge>
                            </td>
                            <td className="py-4 text-muted">
                              {ticket.createdAt
                                ? new Date(ticket.createdAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="py-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  pagination={adminTicketsPagination}
                  onPageChange={(page) => setTicketFilters((prev) => ({ ...prev, page }))}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <TicketDetailModal
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        listParams={{
          page: ticketFilters.page,
          limit: ticketFilters.limit,
          ...(ticketFilters.status ? { status: ticketFilters.status } : {}),
          ...(ticketFilters.search.trim() ? { search: ticketFilters.search.trim() } : {}),
        }}
      />
    </div>
  );
}
