import { Injectable, Logger } from '@nestjs/common';

export type AiChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content?: string;
  reasoning_details?: unknown;
};

export type AiChatResult = {
  content: string | null;
  reasoning_details?: unknown;
  raw?: unknown;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generateText(prompt: string): Promise<string | null> {
    const result = await this.generateChatCompletion([{ role: 'user', content: prompt }]);
    return result.content;
  }

  async generateChatCompletion(messages: AiChatMessage[]): Promise<AiChatResult> {
    const key = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'gpt-4o-mini';

    if (!key) {
      this.logger.warn('OPENROUTER_API_KEY not set; skipping AI call');
      return { content: null };
    }

    const url = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

    try {
      this.logger.debug(`Attempting AI request to ${url}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || process.env.APP_URL || 'http://localhost:3001',
          'X-Title': process.env.OPENROUTER_APP_TITLE || 'DevPulse',
        },
        body: JSON.stringify({
          model,
          messages,
          reasoning: { enabled: process.env.OPENROUTER_REASONING !== 'false' },
          max_tokens: 800,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`OpenRouter error from ${url}: ${res.status} ${text}`);
        return { content: null };
      }

      const json = await res.json();
      const message = json?.choices?.[0]?.message ?? {};
      const content = message?.content || json?.choices?.[0]?.text || null;

      return {
        content,
        reasoning_details: message?.reasoning_details,
        raw: json,
      };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      this.logger.error(`AI call failed: ${msg}`);
      if (/ENOTFOUND|Could not resolve|getaddrinfo/i.test(msg)) {
        this.logger.warn('DNS resolution failed for the OpenRouter endpoint. Verify network/DNS or override OPENROUTER_API_URL.');
      }
      return { content: null };
    }
  }
}
