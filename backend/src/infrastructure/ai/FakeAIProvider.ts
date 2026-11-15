import type { AIProvider, StructuredRequest, StructuredResult } from '../../domain/ai/AIProvider';

export const FAKE_PROVIDER_NAME = 'fake';

export const DEFAULT_FAKE_PLANT_ANALYSIS = {
  isPlant: true,
  commonName: 'Monstera',
  scientificName: 'Monstera deliciosa',
  careCategory: 'TROPICAL',
  leafShape: 'HEART',
  leafCount: 5,
  healthCondition: 'HEALTHY',
  severity: 'NONE',
  visibleSigns: ['Glossy deep green leaves', 'No visible spots'],
  diagnosis: 'The plant looks healthy, with vibrant green foliage.',
  advice: ['Water when the top inch of soil is dry.', 'Keep it in bright, indirect light.'],
} as const;

export class FakeAIProvider implements AIProvider {
  readonly calls: StructuredRequest<unknown>[] = [];

  constructor(private fixture: unknown = DEFAULT_FAKE_PLANT_ANALYSIS) {}

  useFixture(fixture: unknown): void {
    this.fixture = fixture;
  }

  async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    this.calls.push(request as StructuredRequest<unknown>);
    return {
      data: request.schema.parse(this.fixture),
      provider: FAKE_PROVIDER_NAME,
      model: FAKE_PROVIDER_NAME,
      usage: { inputTokens: 0, outputTokens: 0 },
      latencyMs: 0,
      cached: false,
    };
  }
}
