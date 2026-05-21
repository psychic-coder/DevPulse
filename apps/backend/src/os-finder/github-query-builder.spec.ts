import { GitHubQueryBuilder } from './github-query-builder';
import { OsFinderFilters } from '../../packages/shared-types/os-finder.types';

describe('GitHubQueryBuilder', () => {
  const baseFilters: OsFinderFilters = {
    languages: [],
    languageMode: 'any_of',
    contributionTypes: [],
    domains: [],
    repoSize: 'any',
    lastCommitDays: 90,
    minOpenIssues: 3,
    issueFreshDays: 60,
    hasContributing: true,
    hasCodeOfConduct: false,
    licenseTypes: [],
    prMergeRate: 30,
  };

  const getPushedDateStr = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  it('1. should generate base query with defaults', () => {
    const query = GitHubQueryBuilder.build(baseFilters);
    const expectedPushed = getPushedDateStr(90);
    expect(query).toContain('archived:false');
    expect(query).toContain(`pushed:>=${expectedPushed}`);
  });

  it('2. should append single language filter', () => {
    const filters = { ...baseFilters, languages: ['typescript'] };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('language:typescript');
  });

  it('3. should group multiple languages with OR', () => {
    const filters = { ...baseFilters, languages: ['typescript', 'python'] };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('(language:typescript OR language:python)');
  });

  it('4. should use user context languages as fallback', () => {
    const query = GitHubQueryBuilder.build(baseFilters, { topLanguages: ['javascript', 'go'], inferredLevel: 'beginner' });
    expect(query).toContain('(language:javascript OR language:go)');
  });

  it('5. should handle small repo size stars filter', () => {
    const filters = { ...baseFilters, repoSize: 'small' as const };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('stars:1..999');
  });

  it('6. should handle medium repo size stars filter', () => {
    const filters = { ...baseFilters, repoSize: 'medium' as const };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('stars:1000..10000');
  });

  it('7. should handle large repo size stars filter', () => {
    const filters = { ...baseFilters, repoSize: 'large' as const };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('stars:10001..100000');
  });

  it('8. should append good-first-issues filter for beginner difficulty', () => {
    const filters = { ...baseFilters, difficulty: 'beginner' as const };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('good-first-issues:>0');
  });

  it('9. should append help-wanted-issues filter for intermediate difficulty', () => {
    const filters = { ...baseFilters, difficulty: 'intermediate' as const };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('help-wanted-issues:>0');
  });

  it('10. should infer beginner level from user context', () => {
    const query = GitHubQueryBuilder.build(baseFilters, { topLanguages: [], inferredLevel: 'beginner' });
    expect(query).toContain('good-first-issues:>0');
  });

  it('11. should infer intermediate level from user context', () => {
    const query = GitHubQueryBuilder.build(baseFilters, { topLanguages: [], inferredLevel: 'intermediate' });
    expect(query).toContain('help-wanted-issues:>0');
  });

  it('12. should handle single domain mapped to topics', () => {
    const filters = { ...baseFilters, domains: ['devtools' as const] };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('(topic:cli OR topic:developer-tools OR topic:devtools OR topic:terminal)');
  });

  it('13. should handle multiple domains mapped to topics', () => {
    const filters = { ...baseFilters, domains: ['devtools' as const, 'ai_ml' as const] };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('topic:cli');
    expect(query).toContain('topic:machine-learning');
  });

  it('14. should append single license filter', () => {
    const filters = { ...baseFilters, licenseTypes: ['MIT'] };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('license:mit');
  });

  it('15. should append multiple license filters grouped with OR', () => {
    const filters = { ...baseFilters, licenseTypes: ['MIT', 'Apache-2.0'] };
    const query = GitHubQueryBuilder.build(filters);
    expect(query).toContain('(license:mit OR license:apache-2.0)');
  });

  it('16. should prepend keywords to query', () => {
    const query = GitHubQueryBuilder.build(baseFilters, undefined, ['cli-tool', 'rust helper']);
    expect(query.startsWith('cli-tool "rust helper"')).toBe(true);
  });

  it('17. should combine all filters correctly', () => {
    const filters = {
      ...baseFilters,
      languages: ['typescript'],
      difficulty: 'beginner' as const,
      domains: ['web' as const],
      repoSize: 'small' as const,
      licenseTypes: ['MIT'],
    };
    const query = GitHubQueryBuilder.build(filters, undefined, ['editor']);
    expect(query).toContain('editor');
    expect(query).toContain('language:typescript');
    expect(query).toContain('good-first-issues:>0');
    expect(query).toContain('stars:1..999');
    expect(query).toContain('topic:web');
    expect(query).toContain('license:mit');
  });
});
