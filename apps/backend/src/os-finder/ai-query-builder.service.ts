import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../shared/ai.service';
import { OsFinderFilters, Difficulty, ContributionType, Domain, RepoSize } from '../../packages/shared-types/os-finder.types';

@Injectable()
export class AiQueryBuilderService {
  private readonly logger = new Logger(AiQueryBuilderService.name);

  constructor(private readonly aiService: AiService) {}

  async buildFilters(
    userQuery: string,
    userCtx: { topLanguages: string[]; inferredLevel: string; avgPRScore: number }
  ): Promise<{ filters: OsFinderFilters; keywords: string[]; aiModeUsed: boolean; fallbackUsed: boolean }> {
    const prompt = `You are a GitHub repository search assistant inside DevPulse.
Given a developer's natural language request and their profile,
extract a structured search filter object. Respond ONLY with valid JSON.

Developer profile:
- Top languages: ${userCtx.topLanguages.join(', ')}
- Experience level (inferred): ${userCtx.inferredLevel}
- Avg PR quality score: ${userCtx.avgPRScore.toFixed(1)}/10

User request: "${userQuery}"

Return this exact JSON structure:
{
  "languages": string[],
  "languageMode": "strict" | "any_of",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "contributionTypes": string[],
  "domains": string[],
  "repoSize": "small" | "medium" | "large" | "any",
  "lastCommitDays": number,
  "hasContributing": boolean,
  "hasCodeOfConduct": boolean,
  "licenseTypes": string[],
  "keywords": string[]
}

Rules:
- If user doesn't mention language, use their top language from profile
- If user says 'nothing too complex' or 'beginner-friendly', set difficulty: beginner
- If user says 'active community', set lastCommitDays: 30
- For licenses mentioned (e.g. 'mit', 'apache'), populate the "licenseTypes" array (e.g. ["MIT"]) rather than putting it in keywords.
- Keep the keywords array extremely minimal (0 to 2 items max). Only extract high-value specific search terms that are NOT already captured by languages, domains, or license types. Never include common stop words, or words like "application", "tool", "license", "library", "framework", "repo", "project".
- Never invent filters not in the schema above
- Only respond with JSON — no preamble, no markdown backticks`;

    const timeoutMs = 5000;
    let aiResponse: string | null = null;
    let fallbackUsed = false;

    try {
      // 5-second hard timeout
      aiResponse = await Promise.race([
        this.aiService.generateText(prompt),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI Call Timeout')), timeoutMs)
        ),
      ]);
    } catch (error) {
      this.logger.warn(`AI Query Builder failed or timed out: ${error instanceof Error ? error.message : String(error)}. Using keyword fallback.`);
      fallbackUsed = true;
    }

    if (!aiResponse || fallbackUsed) {
      return {
        ...this.parseFallback(userQuery, userCtx),
        aiModeUsed: true,
        fallbackUsed: true,
      };
    }

    try {
      // Clean possible JSON formatting issues (like markdown ticks)
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      const filters: OsFinderFilters = {
        languages: Array.isArray(parsed.languages) ? parsed.languages : [userCtx.topLanguages[0] || 'typescript'],
        languageMode: parsed.languageMode || 'any_of',
        difficulty: parsed.difficulty || (userCtx.inferredLevel as Difficulty),
        contributionTypes: Array.isArray(parsed.contributionTypes) ? parsed.contributionTypes as ContributionType[] : [],
        domains: Array.isArray(parsed.domains) ? parsed.domains as Domain[] : [],
        repoSize: parsed.repoSize || 'any',
        lastCommitDays: typeof parsed.lastCommitDays === 'number' ? parsed.lastCommitDays : 90,
        minOpenIssues: 3,
        issueFreshDays: 60,
        hasContributing: typeof parsed.hasContributing === 'boolean' ? parsed.hasContributing : true,
        hasCodeOfConduct: typeof parsed.hasCodeOfConduct === 'boolean' ? parsed.hasCodeOfConduct : false,
        licenseTypes: Array.isArray(parsed.licenseTypes) ? parsed.licenseTypes : [],
        prMergeRate: 30,
      };

      const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];

      return {
        filters,
        keywords,
        aiModeUsed: true,
        fallbackUsed: false,
      };
    } catch (parseError) {
      this.logger.error(`Failed to parse AI JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}. Content was: ${aiResponse}`);
      return {
        ...this.parseFallback(userQuery, userCtx),
        aiModeUsed: true,
        fallbackUsed: true,
      };
    }
  }

  private parseFallback(
    query: string,
    userCtx: { topLanguages: string[]; inferredLevel: string }
  ): { filters: OsFinderFilters; keywords: string[] } {
    const text = query.toLowerCase();

    // 1. Detect language keywords
    const COMMON_LANGUAGES = ['typescript', 'javascript', 'python', 'rust', 'go', 'cpp', 'c++', 'java', 'ruby', 'php', 'html', 'css', 'swift', 'kotlin'];
    const detectedLanguages: string[] = [];
    COMMON_LANGUAGES.forEach(lang => {
      // match full word
      const regex = new RegExp(`\\b${lang.replace('+', '\\+')}\\b`, 'i');
      if (regex.test(text)) {
        detectedLanguages.push(lang);
      }
    });

    // Default to user's top language if none found
    if (detectedLanguages.length === 0 && userCtx.topLanguages.length > 0) {
      detectedLanguages.push(userCtx.topLanguages[0]);
    } else if (detectedLanguages.length === 0) {
      detectedLanguages.push('typescript'); // final fallback
    }

    // 2. Detect difficulty
    let difficulty: Difficulty = userCtx.inferredLevel as Difficulty;
    if (/\b(beginner|simple|easy|first issue|starter|newbie)\b/i.test(text)) {
      difficulty = 'beginner';
    } else if (/\b(intermediate|medium|average)\b/i.test(text)) {
      difficulty = 'intermediate';
    } else if (/\b(advanced|complex|hard|expert|niche|guru)\b/i.test(text)) {
      difficulty = 'advanced';
    }

    // 3. Detect domains
    const domainKeywords: { domain: Domain; keywords: string[] }[] = [
      { domain: 'web', keywords: ['web', 'frontend', 'backend', 'api', 'react', 'nextjs', 'nodejs', 'website'] },
      { domain: 'devtools', keywords: ['cli', 'tool', 'terminal', 'devtools', 'npm', 'scripts'] },
      { domain: 'ai_ml', keywords: ['ml', 'ai', 'learning', 'gpt', 'llm', 'neural', 'weights', 'inference'] },
      { domain: 'mobile', keywords: ['mobile', 'android', 'ios', 'flutter', 'react native', 'phone', 'app'] },
      { domain: 'data', keywords: ['data', 'visualization', 'science', 'database', 'sql', 'analysis'] },
      { domain: 'infrastructure', keywords: ['devops', 'infrastructure', 'docker', 'kubernetes', 'cloud', 'ci', 'cd'] },
      { domain: 'education', keywords: ['learn', 'education', 'tutorial', 'course', 'school', 'academy'] },
      { domain: 'games', keywords: ['game', 'gameplay', 'gamedev', 'unity', 'unreal', 'physics', 'engine'] },
      { domain: 'finance', keywords: ['finance', 'blockchain', 'crypto', 'trading', 'ledger', 'wallet'] },
    ];

    const detectedDomains: Domain[] = [];
    domainKeywords.forEach(dk => {
      const match = dk.keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(text);
      });
      if (match) {
        detectedDomains.push(dk.domain);
      }
    });

    // 4. Remaining keywords extraction
    // Split into words, exclude common stop words, languages and domain terms
    const stopWords = new Set(['i', 'want', 'to', 'contribute', 'something', 'related', 'in', 'the', 'a', 'an', 'and', 'for', 'with', 'on', 'in', 'of', 'at', 'by', 'project', 'projects', 'repo', 'repos', 'repository', 'repositories']);
    const allWords = text.split(/[^a-zA-Z0-9\+\#]/).filter(Boolean);

    const keywords = allWords.filter(word => {
      if (word.length < 3) return false;
      if (stopWords.has(word)) return false;
      if (COMMON_LANGUAGES.includes(word)) return false;
      // also filter out domain match terms
      const isDomainTerm = domainKeywords.some(dk => dk.keywords.includes(word));
      if (isDomainTerm) return false;
      return true;
    });

    const filters: OsFinderFilters = {
      languages: detectedLanguages,
      languageMode: 'any_of',
      difficulty,
      contributionTypes: [],
      domains: detectedDomains,
      repoSize: 'any',
      lastCommitDays: text.includes('active community') ? 30 : 90,
      minOpenIssues: 3,
      issueFreshDays: 60,
      hasContributing: true,
      hasCodeOfConduct: false,
      licenseTypes: [],
      prMergeRate: 30,
    };

    return {
      filters,
      keywords: keywords.slice(0, 5), // take first 5 keywords
    };
  }
}
