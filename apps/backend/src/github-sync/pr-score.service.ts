import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PullRequest } from './entities/pull-request.entity';
import { AiService } from '../shared/ai.service';

@Injectable()
export class PrScoreService {
  private readonly logger = new Logger(PrScoreService.name);

  constructor(
    @InjectRepository(PullRequest)
    private readonly prRepo: Repository<PullRequest>,
    private readonly aiService: AiService,
  ) {}

  async scorePullRequest(pr: PullRequest): Promise<number | null> {
    const prompt = `You are a senior software engineer reviewing PR quality.

Score this pull request from 1-10 based on:
- Title clarity (is it specific and descriptive?)
- Body completeness (does it explain what, why, and how?)
- Professionalism (proper formatting, no vague descriptions)
- Whether the description matches what a typical diff would contain

PR Title: ${pr.title}
PR Body: ${pr.body || ''}

Respond ONLY with valid JSON:
{ "score": 7.5, "reason": "one sentence explanation" }`;

    const content = await this.aiService.generateText(prompt);
    if (!content) return null;

    try {
      const match = content.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : content;
      const obj = JSON.parse(jsonStr) as {
        score?: unknown;
        scoreValue?: unknown;
        pr_score?: unknown;
        reason?: unknown;
        explanation?: unknown;
      };
      const scoreVal = obj.score ?? obj.scoreValue ?? obj.pr_score;
      const score =
        typeof scoreVal === 'number' || typeof scoreVal === 'string'
          ? Number(scoreVal)
          : NaN;
      const reason =
        typeof obj.reason === 'string'
          ? obj.reason
          : typeof obj.explanation === 'string'
            ? obj.explanation
            : null;

      if (!Number.isNaN(score)) {
        pr.prScore = Math.max(1, Math.min(10, score));
        pr.prScoreReason = reason;
        await this.prRepo.save(pr);
        return pr.prScore;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.warn('Failed to parse PR score response: ' + errorMessage);
    }

    return null;
  }
}
