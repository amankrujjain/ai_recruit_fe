import { describe, expect, it } from 'vitest';
import {
  callStatusToRoundStatus,
  formatRoundLabel,
  pickDefaultRoundId,
  scorecardForRound,
} from '@/lib/formatRoundLabel';

describe('formatRoundLabel', () => {
  it('formats Round N — Failed / Completed', () => {
    expect(formatRoundLabel({ name: 'AI screening', roundOrder: 1 }, 'COMPLETED')).toBe(
      'AI screening — Completed'
    );
    expect(formatRoundLabel({ roundOrder: 1 }, 'FAILED')).toBe('Round 1 — Failed');
  });

  it('maps call statuses and picks scorecard by jobRoundId', () => {
    expect(callStatusToRoundStatus('NO_ANSWER')).toBe('FAILED');
    expect(callStatusToRoundStatus('COMPLETED')).toBe('COMPLETED');

    const cards = [
      { jobRoundId: 'r1', summary: { overall: 1 } },
      { jobRoundId: 'r2', summary: { overall: 2 } },
    ];
    expect(scorecardForRound(cards, 'r1').summary.overall).toBe(1);
    expect(scorecardForRound(cards, 'r2').summary.overall).toBe(2);
  });

  it('defaults to the latest meaningful round', () => {
    const rounds = [
      { jobRoundId: 'a', status: 'COMPLETED', jobRound: { roundOrder: 1 } },
      { jobRoundId: 'b', status: 'IN_PROGRESS', jobRound: { roundOrder: 2 } },
    ];
    expect(pickDefaultRoundId(rounds)).toBe('b');
  });
});
