export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ContributionType = 'bug_fix' | 'feature' | 'documentation' | 'tests' | 'i18n' | 'performance' | 'ui_design' | 'security';
export type Domain = 'web' | 'devtools' | 'ai_ml' | 'mobile' | 'data' | 'infrastructure' | 'education' | 'games' | 'finance';
export type RepoSize = 'small' | 'medium' | 'large' | 'any';
export type LanguageMode = 'strict' | 'any_of';
export type SavedRepoStatus = 'saved' | 'contributed' | 'skipped';

export interface NCFScoreBreakdown {
  total: number;
  goodFirstIssue: number;
  helpWanted: number;
  contributingFile: number;
  issueResponseTime: number;
  newContribPR: number;
  readmeQuality: number;
  codeOfConduct: number;
  prMergeRate: number;
}

export interface RepoHealthFlags {
  isArchived: boolean;
  isStale: boolean;
  noContributing: boolean;
  noReadme: boolean;
  lowPRMergeRate: boolean;
  forkHeavy: boolean;
  noExternalContribs: boolean;
  lowIssueEngagement: boolean;
  slowMaintainerResp: boolean;
}

export interface OsFinderRepoResult {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommitAt: string;
  licenseType: string | null;
  htmlUrl: string;
  ncfScore: NCFScoreBreakdown;
  langMatchScore: number;       // 0.0 to 1.0
  openLabels: string[];
  healthFlags: RepoHealthFlags;
  isSaved: boolean;
  alreadyContrib: boolean;
}

export interface OsFinderFilters {
  // Language
  languages: string[];          // default: user's top 3 from DevPulse commit data
  languageMode: 'strict' | 'any_of';  // default: 'any_of'

  // Difficulty (if not set, auto-detect from user's DevPulse data)
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  // Contribution type (multi-select)
  contributionTypes: ContributionType[];

  // Domain (multi-select — maps to GitHub topic tags)
  domains: Domain[];

  // Repo size by stars
  repoSize: RepoSize;

  // Activity filters
  lastCommitDays: number;    // default 90 — exclude repos with no commits in N days
  minOpenIssues: number;     // default 3 — repo must have at least N open issues
  issueFreshDays: number;    // default 60 — issues must be created/updated within N days

  // Health filters
  hasContributing: boolean;  // default true — must have CONTRIBUTING.md
  hasCodeOfConduct: boolean; // default false — optional filter
  licenseTypes: string[];    // default [] (any) — e.g. ['MIT', 'Apache-2.0']
  prMergeRate: number;       // default 30 — minimum % of PRs merged
  includeAlreadyContributed?: boolean;
}

export interface OsFinderSearchResponse {
  results: OsFinderRepoResult[];
  total: number;
  page: number;
  filtersApplied: OsFinderFilters;
  filtersRelaxed: Partial<OsFinderFilters> | null;
  relaxationNote: string | null;
  aiModeUsed: boolean;
}
