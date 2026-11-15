import {
  ProviderHttpError,
  StructuredAIProvider,
  type ModelCall,
  type RawModelResponse,
} from './StructuredAIProvider';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GENERATION_TEMPERATURE = 0.2;
const THINKING_BUDGET_TOKENS = 0;

export interface GeminiProviderOptions {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
  timeoutMs: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  modelVersion?: string;
}

export class GeminiProvider extends StructuredAIProvider {
  readonly providerName = 'gemini';
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: GeminiProviderOptions) {
    super(options.sleepFn);
    this.fetchFn = options.fetchFn ?? fetch;
  }

  protected async callModel({
    request,
    jsonSchema,
    correction,
  }: ModelCall): Promise<RawModelResponse> {
    const userText = correction
      ? `${request.userPrompt}\n\nYour previous answer was invalid: ${correction}\nReturn corrected JSON only.`
      : request.userPrompt;

    const response = await this.fetchFn(
      `${GEMINI_BASE_URL}/${this.options.model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.options.apiKey },
        signal: AbortSignal.timeout(this.options.timeoutMs),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemPrompt }] },
          contents: [
            {
              role: 'user',
              parts: [
                { text: userText },
                ...request.images.map((image) => ({
                  inlineData: { mimeType: image.mimeType, data: image.base64Data },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: jsonSchema,
            maxOutputTokens: this.options.maxOutputTokens,
            temperature: GENERATION_TEMPERATURE,
            thinkingConfig: { thinkingBudget: THINKING_BUDGET_TOKENS },
          },
        }),
      },
    );

    if (!response.ok) throw new ProviderHttpError(response.status);
    const body = (await response.json()) as GeminiResponse;
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('');

    return {
      text,
      model: body.modelVersion ?? this.options.model,
      usage: {
        inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}
