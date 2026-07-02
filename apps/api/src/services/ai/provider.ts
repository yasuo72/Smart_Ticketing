export type GenerateTextOptions = {
  temperature?: number;
  responseMimeType?: 'application/json' | 'text/plain';
};

export type AiProvider = {
  generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
};

export function getAiProvider(): AiProvider {
  if (process.env.NODE_ENV === 'test' || process.env.AI_PROVIDER === 'mock') {
    return mockAiProvider;
  }

  return geminiProvider;
}

const mockAiProvider: AiProvider = {
  async generateText(prompt) {
    if (prompt.includes('CLASSIFY_TICKET')) {
      if (prompt.toLowerCase().includes('reset password')) {
        return JSON.stringify({
          category: 'Account',
          priority: 'LOW',
          autoResolvable: true,
          autoReply:
            'You can reset your password from the sign-in page by selecting forgot password and following the email instructions.',
        });
      }

      return JSON.stringify({
        category: 'Account',
        priority: 'MEDIUM',
        autoResolvable: false,
        autoReply: null,
      });
    }

    if (prompt.includes('SUMMARIZE_TICKET')) {
      return 'Customer needs help with their support request.';
    }

    if (prompt.includes('POLISH_REPLY')) {
      return 'Thanks for reaching out. We are looking into this and will follow up shortly.';
    }

    return 'Mock AI response.';
  },
};

const geminiProvider: AiProvider = {
  async generateText(prompt, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

    if (!apiKey || apiKey.includes('replace-with')) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            responseMimeType: options.responseMimeType,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;
  },
};
