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
    // Build prompt for PR quality scoring
    const prompt = `You are an assistant that scores GitHub pull requests on code quality and reviewability.\n\nRespond with a single JSON object only. Example: {"score": 0.87, "reason": "Concise explanation"}\n\nPull Request Title: ${pr.title}\nPull Request Body: ${pr.body || ''}\nFiles changed: ${pr.changedFiles || 0}\nAdditions: ${pr.additions || 0}\nDeletions: ${pr.deletions || 0}\nComments: ${pr.commentsCount || 0}\nCommits: ${pr.commitsCount || 0}\n\nProvide score between 0.0 and 1.0 (higher is better). Give one-sentence reason.`;

    const content = await this.aiService.generateText(prompt);
    if (!content) return null;

    try {
      // Try to extract JSON substring
      const match = content.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : content;
      const obj = JSON.parse(jsonStr);
      const score = Number(obj.score ?? obj.scoreValue ?? obj.pr_score ?? null);
      const reason = obj.reason || obj.explanation || null;

      if (!isNaN(score)) {
        pr.prScore = score;
        // try to save a reason if column exists
        try {
          // @ts-ignore optional column
          pr.prScoreReason = reason;
        } catch (e) {}
        await this.prRepo.save(pr);
        return score;
      }
    } catch (e) {
      this.logger.warn('Failed to parse PR score response: ' + e.message);
    }

    return null;
  }
}
