import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generateText(prompt: string): Promise<string | null> {
    const key = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'gpt-4o-mini';

    if (!key) {
      this.logger.warn('OPENROUTER_API_KEY not set; skipping AI call');
      return null;
    }

    try {
      const res = await fetch('https://api.openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`OpenRouter error: ${res.status} ${text}`);
        return null;
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || null;
      return content;
    } catch (e) {
      this.logger.error('AI call failed: ' + e.message);
      return null;
    }
  }
}
