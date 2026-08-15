import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';
import { CandidateStatus, candidateStatusLabels, candidateStatusVariants } from '@/lib/candidateStatus';
import { UserStatus, userStatusLabel, userStatusVariant } from '@/lib/userStatus';
import {
  Recommendation,
  recommendationLabels,
  recommendationVariants,
  recommendationDescriptions,
} from '@/lib/recommendation';
import { EmploymentType, employmentTypeLabels } from '@/lib/employmentType';
import { OutreachPipelineStatus, outreachPipelineLabels } from '@/lib/outreachPipelineStatus';
import { RankingMode } from '@/lib/rankingMode';
import { storageKeys, API_BASE } from '@/lib/constants';

describe('utils.cn', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', false && 'hidden', 'font-bold')).toContain('font-bold');
  });
});

describe('enum / label map completeness', () => {
  it('candidateStatus maps cover every status', () => {
    Object.values(CandidateStatus).forEach((status) => {
      expect(candidateStatusLabels[status]).toBeTruthy();
      expect(candidateStatusVariants[status]).toBeTruthy();
    });
  });

  it('userStatus maps cover every status', () => {
    Object.values(UserStatus).forEach((status) => {
      expect(userStatusLabel[status]).toBeTruthy();
      expect(userStatusVariant[status]).toBeTruthy();
    });
  });

  it('recommendation maps cover every value', () => {
    Object.values(Recommendation).forEach((value) => {
      expect(recommendationLabels[value]).toBeTruthy();
      expect(recommendationVariants[value]).toBeTruthy();
      expect(recommendationDescriptions[value]).toBeTruthy();
    });
  });

  it('employmentType labels cover every type', () => {
    Object.values(EmploymentType).forEach((type) => {
      expect(employmentTypeLabels[type]).toBeTruthy();
    });
  });

  it('outreachPipeline labels cover every status', () => {
    Object.values(OutreachPipelineStatus).forEach((status) => {
      expect(outreachPipelineLabels[status]).toBeTruthy();
    });
  });

  it('RankingMode exposes frozen modes', () => {
    expect(Object.values(RankingMode)).toEqual(['TOP_N', 'MIN_SCORE', 'MANUAL']);
    expect(() => {
      RankingMode.TOP_N = 'X';
    }).toThrow();
  });

  it('exports storage keys and API_BASE', () => {
    expect(storageKeys.accessToken).toBe('recruit_access_token');
    expect(API_BASE).toBeTruthy();
  });
});
