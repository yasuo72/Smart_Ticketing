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

  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    return geminiProvider;
  }

  if (process.env.GROQ_API_KEY || provider === 'groq') {
    return groqProvider;
  }

  if (process.env.GEMINI_API_KEY) {
    return geminiProvider;
  }

  return groqProvider;
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

const groqProvider: AiProvider = {
  async generateText(prompt, options = {}) {
    const apiKey = process.env.GROQ_API_KEY;
    const configuredModel = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

    if (!apiKey || apiKey.includes('replace-with')) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const tryModels = Array.from(
      new Set([configuredModel, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-2.5-32b', 'mixtral-8x7b-32768'])
    );
    let lastError: Error | null = null;

    for (const model of tryModels) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const bodyPayload: Record<string, unknown> = {
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an intelligent customer support AI assistant. When requested for JSON, always reply with valid raw JSON only without extra markdown formatting or conversational text.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: options.temperature ?? 0.2,
          };

          if (options.responseMimeType === 'application/json') {
            bodyPayload.response_format = { type: 'json_object' };
          }

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(bodyPayload),
          });

          if (response.status === 429 && attempt < 2) {
            // Groq rate limit - wait 2.5 seconds and retry
            await new Promise((resolve) => setTimeout(resolve, 2500));
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();
            lastError = new Error(`Groq request failed (${model}): ${response.status} ${errorText}`);
            break; // Move to next model
          }

          const data = (await response.json()) as {
            choices?: Array<{
              message?: {
                content?: string;
              };
            }>;
          };

          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return content;
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }

    throw lastError ?? new Error('Groq API call failed across all models.');
  },
};

const geminiProvider: AiProvider = {
  async generateText(prompt, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    let configuredModel = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
    if (configuredModel.includes('2.5') || configuredModel.includes('2.0') || configuredModel.includes('lite')) {
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
            await new Promise((resolve) => setTimeout(resolve, 2500));
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();
            lastError = new Error(`Gemini request failed (${model}): ${response.status} ${errorText}`);
            break;
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
