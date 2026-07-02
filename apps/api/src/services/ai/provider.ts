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
    if (prompt.includes('ANALYZE_TICKET') || prompt.includes('CLASSIFY_TICKET')) {
      if (prompt.toLowerCase().includes('reset password')) {
        return JSON.stringify({
          summary: 'Customer needs help with their support request.',
          category: 'Account',
          priority: 'LOW',
          autoResolvable: true,
          autoReply:
            'You can reset your password from the sign-in page by selecting forgot password and following the email instructions.',
        });
      }

      return JSON.stringify({
        summary: 'Customer needs help with their support request.',
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
    let configuredModel = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
    if (configuredModel.includes('2.5')) {
      configuredModel = 'gemini-1.5-flash';
    }

    if (!apiKey || apiKey.includes('replace-with')) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const tryModels = Array.from(
      new Set(['gemini-1.5-flash', configuredModel, 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'])
    );
    let lastError: Error | null = null;

    for (const model of tryModels) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
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

          if (response.status === 429 && attempt < 2) {
            // Quota / Rate limited on free tier - wait 2.5 seconds and retry
            await new Promise((resolve) => setTimeout(resolve, 2500));
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();
            lastError = new Error(`Gemini request failed (${model}): ${response.status} ${errorText}`);
            break; // Move to next model
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

          if (text) {
            return text;
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }

    throw lastError ?? new Error('Gemini API call failed across all models.');
  },
};
