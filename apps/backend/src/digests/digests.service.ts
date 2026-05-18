import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Digest } from './entities/digest.entity';
import { UsersService } from '../users/users.service';
import { GithubSyncService } from '../github-sync/github-sync.service';
import { AiService } from '../shared/ai.service';

@Injectable()
export class DigestsService {
  private readonly logger = new Logger(DigestsService.name);

  constructor(
    @InjectRepository(Digest)
    private readonly digestRepo: Repository<Digest>,
    private readonly usersService: UsersService,
    private readonly githubSyncService: GithubSyncService,
    private readonly aiService: AiService,
  ) {}

  async createDigestForUser(userId: string, weekStart: string, content: string, rawStats: any) {
    const d = this.digestRepo.create({ user: { id: userId } as any, weekStart, content, rawStats });
    return this.digestRepo.save(d);
  }

  async generateWeeklyDigestForUser(userId: string) {
    this.logger.log(`Generating weekly digest for user ${userId}`);
    const data = await this.githubSyncService.getUserData(userId);
    // compute stats for last 7 days from data.commits and data.pullRequests
    const now = new Date();
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - 7);
    const weekStart = weekStartDate.toISOString().slice(0, 10);
    const weekEnd = now.toISOString().slice(0, 10);

    const commits = data.commits || [];
    const prs = data.pullRequests || [];

    const totalCommits = commits.length;
    const repoSet = new Set(commits.map((c: any) => c.repository?.name || c.repositoryName || 'unknown'));
    const repoList = Array.from(repoSet).join(', ');

    // peak day/hour and additions/deletions
    const dayCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    let additions = 0;
    let deletions = 0;
    for (const c of commits) {
      const dt = new Date(c.committedAt || c.createdAt);
      if (isNaN(dt.getTime())) continue;
      const day = dt.toISOString().slice(0, 10);
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      const hr = dt.getUTCHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
      additions += c.additions || 0;
      deletions += c.deletions || 0;
    }

    const peakDay = Object.keys(dayCounts).length
      ? Object.keys(dayCounts).reduce((a, b) => (dayCounts[a] > dayCounts[b] ? a : b))
      : weekStart;

    const peakHour = (() => {
      const entries = Object.entries(hourCounts);
      if (entries.length === 0) return 0;
      entries.sort((a, b) => b[1] - a[1]);
      return Number(entries[0][0]);
    })();

    const prCount = prs.length;
    const mergedCount = prs.filter((p: any) => p.mergedAt || p.state === 'merged').length;

    // language breakdown - try to infer from repositories
    const langCounts: Record<string, number> = {};
    const repos = data.repositories || [];
    for (const r of repos) {
      const lang = r.language || 'Unknown';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }

    const languageBreakdown = Object.entries(langCounts).map(([k, v]) => `${k}: ${v}`).join(', ');

    const streakData = await this.githubSyncService.getUserStreaks(userId);

    const prompt = `You are DevPulse, an AI assistant for software developers.\nAnalyse this developer's GitHub activity from the past 7 days and write a friendly, insightful weekly digest in markdown format.\n\nDeveloper: ${data?.repositories?.[0]?.userId || userId}\nPeriod: ${weekStart} to ${weekEnd}\n\nStats:\n- Total commits: ${totalCommits}\n- Repositories worked on: ${repoList}\n- Most active day: ${peakDay}\n- Peak coding hour: ${peakHour}:00\n- Languages used: ${languageBreakdown}\n- Pull Requests opened: ${prCount}\n- PRs merged: ${mergedCount}\n- Longest commit streak this week: ${streakData?.longestStreak ?? 0} days\n- Total lines added: ${additions}, removed: ${deletions}\n\nWrite the digest in these sections:\n1. 🗓️ Week in Review (2-3 sentences, warm and personal)\n2. 💪 What You Crushed (highlight standout activity)\n3. 🔍 Patterns Noticed (e.g., \"You code best at 2PM\", \"Java dominated this week\")\n4. 🎯 Focus Suggestion for Next Week (one actionable tip)\n\nKeep tone: friendly, encouraging, like a senior dev who cares.\nKeep length: 250-300 words.`;

    const aiResponse = await this.aiService.generateText(prompt);
    const content = aiResponse?.trim() || `Weekly digest for ${weekStart} - ${weekEnd}`;

    const rawStats = {
      totalCommits,
      repoList,
      peakDay,
      peakHour,
      languageBreakdown,
      prCount,
      mergedCount,
      streak: streakData,
      additions,
      deletions,
    };

    return this.createDigestForUser(userId, weekStart, content, rawStats);
  }
}
