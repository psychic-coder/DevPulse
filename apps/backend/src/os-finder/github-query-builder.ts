import { OsFinderFilters } from '../../packages/shared-types/os-finder.types';

export class GitHubQueryBuilder {
  static build(
    filters: OsFinderFilters,
    userCtx?: { topLanguages: string[]; inferredLevel: string },
    keywords?: string[]
  ): string {
    const parts: string[] = [];

    // 1. Language filter
    const langs = filters.languages && filters.languages.length > 0
      ? filters.languages
      : (userCtx?.topLanguages || []);

    if (langs.length > 0) {
      const langQueries = langs.map(lang => `language:${lang}`);
      if (langQueries.length === 1) {
        parts.push(langQueries[0]);
      } else {
        parts.push(`(${langQueries.join(' OR ')})`);
      }
    }

    // 2. Exclude archived
    parts.push('archived:false');

    // 3. Last commit days (activity)
    if (filters.lastCommitDays) {
      const date = new Date();
      date.setDate(date.getDate() - filters.lastCommitDays);
      const YYYYMMDD = date.toISOString().slice(0, 10);
      parts.push(`pushed:>=${YYYYMMDD}`);
    }

    // 4. Repo size (stars)
    if (filters.repoSize && filters.repoSize !== 'any') {
      const STAR_RANGE_MAP = {
        small: '1..999',
        medium: '1000..10000',
        large: '10001..100000',
      };
      const range = STAR_RANGE_MAP[filters.repoSize as keyof typeof STAR_RANGE_MAP];
      if (range) {
        parts.push(`stars:${range}`);
      }
    }

    // 5. Difficulty issue filters
    const diff = filters.difficulty || userCtx?.inferredLevel;
    if (diff === 'beginner') {
      parts.push('good-first-issues:>0');
    } else if (diff === 'intermediate') {
      parts.push('help-wanted-issues:>0');
    }

    // 6. Domains / Topics
    if (filters.domains && filters.domains.length > 0) {
      const DOMAIN_TOPIC_MAP: Record<string, string[]> = {
        web: ['web', 'frontend', 'backend', 'react', 'nextjs', 'nodejs'],
        devtools: ['cli', 'developer-tools', 'devtools', 'terminal'],
        ai_ml: ['machine-learning', 'artificial-intelligence', 'llm'],
        mobile: ['mobile', 'react-native', 'flutter', 'ios', 'android'],
        data: ['data-science', 'analytics', 'pandas', 'visualization'],
        infrastructure: ['devops', 'docker', 'kubernetes', 'ci-cd', 'cloud'],
        education: ['education', 'learning', 'tutorial', 'course'],
        games: ['game', 'game-development', 'gamedev'],
        finance: ['finance', 'fintech', 'trading', 'blockchain'],
      };

      const topics: string[] = [];
      filters.domains.forEach(domain => {
        const mapped = DOMAIN_TOPIC_MAP[domain];
        if (mapped) {
          topics.push(...mapped);
        }
      });

      if (topics.length > 0) {
        if (topics.length === 1) {
          parts.push(`topic:${topics[0]}`);
        } else {
          parts.push(`(${topics.join(' OR ')})`);
        }
      }
    }

    // 7. License types
    if (filters.licenseTypes && filters.licenseTypes.length > 0) {
      const licenses = filters.licenseTypes.map(lic => lic.toLowerCase());
      if (licenses.length === 1) {
        parts.push(`license:${licenses[0]}`);
      } else {
        parts.push(`(${licenses.join(' OR ')})`);
      }
    }

    // 8. Keywords
    if (keywords && keywords.length > 0) {
      // Escape spaces or quote them if needed, or join simply
      const kw = keywords.filter(Boolean).map(k => k.includes(' ') ? `"${k}"` : k);
      if (kw.length > 0) {
        parts.unshift(...kw);
      }
    }

    return parts.join(' ');
  }
}
