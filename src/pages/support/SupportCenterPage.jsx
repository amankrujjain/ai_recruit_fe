import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  ChevronRight,
  Clock3,
  FolderOpen,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Search,
} from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryFaqModal } from '@/components/support/CategoryFaqModal';
import { CreateTicketModal } from '@/components/support/CreateTicketModal';
import { MyTicketDetailModal } from '@/components/support/MyTicketDetailModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  fetchMyTickets,
  fetchOrgCategories,
  fetchOrgFaqs,
  selectSupport,
} from '@/store/slices/supportSlice';
import { cn } from '@/lib/utils';

const matchesFaqSearch = (faq, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const question = (faq.question || '').toLowerCase();
  const shortDescription = (faq.shortDescription || '').toLowerCase();
  return question.includes(q) || shortDescription.includes(q);
};

const formatTicketStatus = (status) => {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'RESOLVED') return 'Resolved';
  return 'Open';
};

const ticketBadgeVariant = (status) => {
  if (status === 'RESOLVED') return 'success';
  if (status === 'IN_PROGRESS') return 'warning';
  return 'default';
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Updated ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Updated yesterday';
  return `Updated ${days} days ago`;
};

export function SupportCenterPage() {
  usePageTitle('Support Center');
  const dispatch = useDispatch();
  const {
    categories,
    orgFaqs,
    myTickets,
    loading,
    orgFaqsLoading,
    myTicketsLoading,
    error,
  } = useSelector(selectSupport);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    dispatch(fetchOrgCategories());
    dispatch(fetchOrgFaqs());
    dispatch(fetchMyTickets({ page: 1, limit: 20 }));
  }, [dispatch]);

  const isSearching = search.trim().length > 0;
  const filteredFaqs = isSearching
    ? orgFaqs.filter((faq) => matchesFaqSearch(faq, search))
    : [];
  const modalFaqs = selectedCategory
    ? orgFaqs.filter((faq) => faq.categoryId === selectedCategory.categoryId)
    : [];
  const pageLoading = loading || orgFaqsLoading;
  const recentTickets = myTickets.slice(0, 5);

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <PageHeader
        title="Support Center"
        subtitle="We're here to help! Find answers or get in touch with our support team."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="h-full shadow-none">
              <CardContent className="flex h-full flex-col gap-4 p-5 pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Live Chat</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Chat with our support team in real-time for immediate help.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    className="bg-brand-600 px-4 text-white hover:bg-brand-700"
                    onClick={() => toast.message('Live chat is not available yet')}
                  >
                    Start Live Chat
                  </Button>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full shadow-none">
              <CardContent className="flex h-full flex-col gap-4 p-5 pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Email Support</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Send us an email and we&apos;ll get back to you within 24 hours.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="w-fit border-brand-600 px-4 text-brand-600 hover:bg-brand-50 hover:text-brand-700">
                  <a href="mailto:support@recruitai.com">Send an Email</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full shadow-none">
              <CardContent className="flex h-full flex-col gap-4 p-5 pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Call Support</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Speak directly with our support team during business hours.
                  </p>
                </div>
                <div>
                  <p className="text-base font-semibold text-brand-600">+91 80 1234 5678</p>
                  <p className="mt-1 text-sm text-muted">Mon - Fri, 9:30 AM - 6:30 PM</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-none">
            <CardContent className="space-y-5 p-5 pt-5">
              <h3 className="text-lg font-semibold text-foreground">How can we help you?</h3>

              <div className="relative">
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setExpandedFaqId(null);
                  }}
                  placeholder="Search for articles, topics or keywords..."
                  className="h-11 rounded-xl pr-10"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>

              {pageLoading && (
                <p className="text-sm text-muted">Loading help topics...</p>
              )}

              {!pageLoading && !isSearching && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Browse by category</h4>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted">No help topics available yet.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {categories.map((category) => (
                        <button
                          key={category.categoryId}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-foreground">{category.name}</p>
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                            </div>
                            {category.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!pageLoading && isSearching && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Search results ({filteredFaqs.length})
                  </h4>
                  {filteredFaqs.length === 0 ? (
                    <p className="text-sm text-muted">No FAQs match your search.</p>
                  ) : (
                    <div className="divide-y divide-border rounded-xl border border-border">
                      {filteredFaqs.map((faq) => {
                        const isOpen = expandedFaqId === faq.faqId;
                        return (
                          <div key={faq.faqId}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/50"
                              onClick={() => setExpandedFaqId(isOpen ? null : faq.faqId)}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground">{faq.question}</p>
                                {faq.shortDescription && (
                                  <p className="mt-0.5 text-sm text-muted">{faq.shortDescription}</p>
                                )}
                                {faq.category?.name && (
                                  <p className="mt-1 text-xs text-brand-600">{faq.category.name}</p>
                                )}
                              </div>
                              <ChevronRight
                                className={cn(
                                  'mt-1 h-4 w-4 shrink-0 text-muted transition-transform',
                                  isOpen && 'rotate-90'
                                )}
                              />
                            </button>
                            {isOpen && (
                              <div className="border-t border-border bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-brand-100 bg-gradient-to-r from-brand-50 to-white shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Can&apos;t find what you&apos;re looking for?
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Our support team is ready to help with any questions.
                  </p>
                </div>
              </div>
              <Button onClick={() => setCreateTicketOpen(true)}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-none">
            <CardContent className="space-y-4 p-5 pt-5">
              <h3 className="font-semibold text-foreground">Get in Touch</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-brand-600" />
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-muted">support@recruitai.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-brand-600" />
                  <div>
                    <p className="font-medium text-foreground">Phone</p>
                    <p className="text-muted">+91 80 1234 5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <div>
                    <p className="font-medium text-foreground">Hours</p>
                    <p className="text-muted">Mon–Fri, 9:30 AM – 6:30 PM IST</p>
                  </div>
                </div>
                <div className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Response Time: Within 24 hours
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="space-y-4 p-5 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Your Recent Tickets</h3>
              </div>

              {myTicketsLoading && myTickets.length === 0 && (
                <p className="text-sm text-muted">Loading tickets...</p>
              )}

              {!myTicketsLoading && recentTickets.length === 0 && (
                <p className="text-sm text-muted">No tickets yet. Create one if you need help.</p>
              )}

              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <button
                    key={ticket.ticketId}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full rounded-xl border border-border px-3 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-muted">{ticket.ticketNumber}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{ticket.subject}</p>
                      </div>
                      <Badge variant={ticketBadgeVariant(ticket.status)}>
                        {formatTicketStatus(ticket.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {ticket.status === 'RESOLVED' && ticket.resolvedAt
                        ? `Resolved on ${new Date(ticket.resolvedAt).toLocaleDateString()}`
                        : formatRelativeTime(ticket.updatedAt || ticket.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-brand-600 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                onClick={() => setCreateTicketOpen(true)}
              >
                Create New Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CategoryFaqModal
        open={Boolean(selectedCategory)}
        onOpenChange={(open) => {
          if (!open) setSelectedCategory(null);
        }}
        category={selectedCategory}
        faqs={modalFaqs}
      />

      <CreateTicketModal
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        categories={categories}
      />

      <MyTicketDetailModal
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />
    </div>
  );
}
