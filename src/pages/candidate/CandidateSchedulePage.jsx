import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  bookScheduleSlotRequest,
  getScheduleSlotsRequest,
} from '@/api/candidateApi';

export function CandidateSchedulePage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    getScheduleSlotsRequest(token)
      .then(({ data }) => {
        const payload = data.data || {};
        setInfo(payload);
        setSlots(Array.isArray(payload) ? payload : payload.slots || []);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load schedule'))
      .finally(() => setLoading(false));
  }, [token]);

  const book = async (scheduledAt) => {
    setBooking(true);
    try {
      const { data } = await bookScheduleSlotRequest(token, scheduledAt);
      setConfirmed(data.data);
      toast.success('Call scheduled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not book slot');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-sm text-muted">Loading slots…</CardContent>
      </Card>
    );
  }

  if (confirmed) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader><h1 className="text-lg font-semibold">Call confirmed</h1></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>{confirmed.message}</p>
          <p>Scheduled: {new Date(confirmed.scheduledAt).toLocaleString()}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <h1 className="text-lg font-semibold">Schedule your screening call</h1>
        <p className="text-sm text-muted">{info?.jobTitle} · {info?.organizationName}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted">
          Pick a slot within company hours ({info?.workingHoursStart}–{info?.workingHoursEnd}).
          Available for the next {info?.maxScheduleDays} days only — no past dates.
        </p>
        {!slots.length ? (
          <p className="text-sm text-muted">No slots available right now. Please try again later.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.scheduledAt}
                variant="outline"
                disabled={booking}
                className="justify-start"
                onClick={() => book(slot.scheduledAt)}
              >
                {slot.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
