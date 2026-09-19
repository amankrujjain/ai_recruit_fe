import { describe, expect, it } from 'vitest';
import {
  findNextAiJobRound,
  getNextStepSuggestion,
  hasRemainingAiRounds,
} from '@/lib/recommendation';

describe('getNextStepSuggestion (C9)', () => {
  const jobRounds = [
    { jobRoundId: 'jr1', name: 'AI screening', roundOrder: 1, roundType: 'AI' },
    { jobRoundId: 'jr2', name: 'Round 2', roundOrder: 2, roundType: 'AI' },
  ];

  it('suggests Invite to Round 2 when round 1 is completed', () => {
    const suggestion = getNextStepSuggestion({
      jobRounds,
      candidateRounds: [
        { jobRoundId: 'jr1', status: 'COMPLETED', jobRound: jobRounds[0] },
      ],
      evaluation: { recommendation: 'PROCEED_TO_HUMAN_INTERVIEW' },
    });
    expect(suggestion.code).toBe('INVITE_NEXT_ROUND');
    expect(suggestion.label).toBe('Invite to Round 2');
    expect(suggestion.canInviteNext).toBe(true);
    expect(suggestion.nextRound.jobRoundId).toBe('jr2');
  });

  it('suggests Proceed to human when no AI rounds remain', () => {
    const suggestion = getNextStepSuggestion({
      jobRounds,
      candidateRounds: [
        { jobRoundId: 'jr1', status: 'CLEARED', jobRound: jobRounds[0] },
        { jobRoundId: 'jr2', status: 'COMPLETED', jobRound: jobRounds[1] },
      ],
      evaluation: { recommendation: 'STRONG_MATCH' },
    });
    expect(suggestion.code).toBe('PROCEED_TO_HUMAN');
    expect(suggestion.label).toBe('Proceed to human interview');
    expect(suggestion.canInviteNext).toBe(false);
    expect(hasRemainingAiRounds(jobRounds, suggestion.nextRound ? [] : [
      { status: 'CLEARED', jobRound: jobRounds[0] },
      { status: 'COMPLETED', jobRound: jobRounds[1] },
    ])).toBe(false);
  });

  it('surfaces Unable to score instead of Proceed to human', () => {
    const suggestion = getNextStepSuggestion({
      jobRounds,
      candidateRounds: [
        { jobRoundId: 'jr1', status: 'COMPLETED', jobRound: jobRounds[0] },
      ],
      scoringStatus: 'UNABLE_TO_SCORE',
      scoringReason: 'HANGUP_TOO_SHORT',
      evaluation: { recommendation: 'PROCEED_TO_HUMAN_INTERVIEW' },
    });
    expect(suggestion.code).toBe('UNABLE_TO_SCORE');
    expect(suggestion.label).toMatch(/unable to score/i);
    expect(suggestion.canInviteNext).toBe(false);
  });

  it('findNextAiJobRound skips cleared progress', () => {
    expect(findNextAiJobRound(jobRounds, [
      { status: 'CLEARED', jobRound: jobRounds[0] },
    ])?.jobRoundId).toBe('jr2');
  });
});
