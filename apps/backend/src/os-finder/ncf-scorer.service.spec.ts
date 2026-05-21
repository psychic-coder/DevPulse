import { Test, TestingModule } from '@nestjs/testing';
import { NcfScorerService } from './ncf-scorer.service';
import { OsFinderCacheService } from './os-finder-cache.service';

describe('NcfScorerService', () => {
  let service: NcfScorerService;
  let cacheService: OsFinderCacheService;

  const mockCacheService = {
    getRepoIssues: jest.fn(),
    setRepoIssues: jest.fn(),
    getPRStats: jest.fn(),
    setPRStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NcfScorerService,
        { provide: OsFinderCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<NcfScorerService>(NcfScorerService);
    cacheService = module.get<OsFinderCacheService>(OsFinderCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    if ((global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute full NCF score when all indicators are optimal', async () => {
    mockCacheService.getRepoIssues.mockResolvedValue(null);
    mockCacheService.getPRStats.mockResolvedValue({ mergeRate: 80 });

    const freshDate = new Date();
    freshDate.setDate(freshDate.getDate() - 5);

    // Mock global fetch
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url: any) => {
      let data: any = {};
      if (url.includes('/issues?labels=good first issue')) {
        data = [{ id: 1, updated_at: freshDate.toISOString() }];
      } else if (url.includes('/issues?labels=help wanted')) {
        data = [{ id: 2 }];
      } else if (url.includes('/community/profile')) {
        data = {
          files: {
            contributing: { html_url: 'contrib' },
            code_of_conduct: { html_url: 'coc' },
          },
        };
      } else if (url.includes('/readme')) {
        data = { size: 5000 };
      } else if (url.includes('/pulls')) {
        data = [
          {
            merged_at: freshDate.toISOString(),
            author_association: 'FIRST_TIME_CONTRIBUTOR',
          },
        ];
      } else if (url.includes('/issues?state=closed')) {
        data = [
          {
            created_at: freshDate.toISOString(),
            closed_at: freshDate.toISOString(),
          },
        ];
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '1000'],
          ['X-RateLimit-Reset', '1234567'],
        ]),
        json: () => Promise.resolve(data),
      } as any);
    });

    const breakdown = await service.computeNCFScore('owner', 'repo', 'token', {});

    expect(breakdown.goodFirstIssue).toBe(2.5);
    expect(breakdown.helpWanted).toBe(1.0);
    expect(breakdown.contributingFile).toBe(1.5);
    expect(breakdown.codeOfConduct).toBe(0.5);
    expect(breakdown.readmeQuality).toBe(0.5);
    expect(breakdown.prMergeRate).toBe(0.5);
    expect(breakdown.issueResponseTime).toBe(2.0);
    expect(breakdown.newContribPR).toBe(1.5);
    expect(breakdown.total).toBe(10.0);
  });

  it('should compute low NCF score when all indicators are absent or poor', async () => {
    mockCacheService.getRepoIssues.mockResolvedValue(null);
    mockCacheService.getPRStats.mockResolvedValue({ mergeRate: 5 });

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url: any) => {
      let data: any = {};
      if (url.includes('/issues?labels=good first issue')) {
        data = [];
      } else if (url.includes('/issues?labels=help wanted')) {
        data = [];
      } else if (url.includes('/community/profile')) {
        data = {
          files: {
            contributing: null,
            code_of_conduct: null,
          },
        };
      } else if (url.includes('/readme')) {
        data = { size: 100 };
      } else if (url.includes('/pulls')) {
        data = [];
      } else if (url.includes('/issues?state=closed')) {
        // slow close time: 40 days
        const start = new Date();
        start.setDate(start.getDate() - 50);
        const end = new Date();
        end.setDate(end.getDate() - 10);
        data = [
          {
            created_at: start.toISOString(),
            closed_at: end.toISOString(),
          },
        ];
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '1000'],
          ['X-RateLimit-Reset', '1234567'],
        ]),
        json: () => Promise.resolve(data),
      } as any);
    });

    const breakdown = await service.computeNCFScore('owner', 'repo', 'token', {});

    expect(breakdown.goodFirstIssue).toBe(0);
    expect(breakdown.helpWanted).toBe(0);
    expect(breakdown.contributingFile).toBe(0);
    expect(breakdown.codeOfConduct).toBe(0);
    expect(breakdown.readmeQuality).toBe(0);
    expect(breakdown.prMergeRate).toBe(0);
    expect(breakdown.issueResponseTime).toBe(0); // slow avgDaysToClose (40 days) => 0 points
    expect(breakdown.newContribPR).toBe(0);
    expect(breakdown.total).toBe(1.0); // base score of 1.0 minimum
  });
});
