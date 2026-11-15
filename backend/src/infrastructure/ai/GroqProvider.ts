import {
  ProviderHttpError,
  StructuredAIProvider,
  type ModelCall,
  type RawModelResponse,
} from './StructuredAIProvider';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GENERATION_TEMPERATURE = 0.2;

export interface GroqProviderOptions {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
  timeoutMs: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

interface GroqResponse {
  model?: string;
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class GroqProvider extends StructuredAIProvider {
  readonly providerName = 'groq';
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: GroqProviderOptions) {
    super(options.sleepFn);
    this.fetchFn = options.fetchFn ?? fetch;
  }

  protected async callModel({
    request,
    jsonSchema,
    correction,
  }: ModelCall): Promise<RawModelResponse> {
    const systemText = `${request.systemPrompt}\n\nReturn ONLY a JSON object that conforms to this JSON Schema:\n${JSON.stringify(jsonSchema)}`;
    const userText = correction
      ? `${request.userPrompt}\n\nYour previous answer was invalid: ${correction}\nReturn corrected JSON only.`
      : request.userPrompt;

    const response = await this.fetchFn(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      signal: AbortSignal.timeout(this.options.timeoutMs),
      body: JSON.stringify({
        model: this.options.model,
        temperature: GENERATION_TEMPERATURE,
        max_tokens: this.options.maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemText },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              ...request.images.map((image) => ({
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.base64Data}` },
              })),
            ],
          },
        ],
      }),
    });

    if (!response.ok) throw new ProviderHttpError(response.status);
    const body = (await response.json()) as GroqResponse;

    return {
      text: body.choices?.[0]?.message?.content ?? '',
      model: body.model ?? this.options.model,
      usage: {
        inputTokens: body.usage?.prompt_tokens ?? 0,
        outputTokens: body.usage?.completion_tokens ?? 0,
      },
    };
  }
}
