import { config } from '../config/env';

interface AnalysisResult {
  health_score: number;
  status: string;
  diagnosis: string;
  prognosis: string;
  care_plan: any[];
  images_analysis: any[];
  temporal_comparison: any;
}

class AIServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.aiServiceUrl;
  }

  async analyze(images: Record<string, string>, plantId: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plant_id: plantId, images }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('AI service unavailable');
    }
    return response.json();
  }
}

export const aiServiceClient = new AIServiceClient();
