import { readFileSync } from 'node:fs';
import { config } from '../src/shared/config';
import { createAIProvider } from '../src/infrastructure/ai/createAIProvider';
import { SharpImageProcessor } from '../src/infrastructure/images/SharpImageProcessor';
import { plantAnalysisSchema } from '../src/application/ai/plantAnalysisSchema';
import {
  buildPlantAnalysisSystemPrompt,
  buildPlantAnalysisUserPrompt,
  PLANT_ANALYSIS_PROMPT_VERSION,
  PLANT_ANALYSIS_SCHEMA_NAME,
} from '../src/application/ai/prompts/plantAnalysis.v1';

const [imagePath, localeArg = 'en'] = process.argv.slice(2);
if (!imagePath || (localeArg !== 'en' && localeArg !== 'es')) {
  process.stderr.write('Usage: npm run ai:smoke -- <image-path> [en|es]\n');
  process.exit(1);
}

const noCache = { get: async () => null, set: async () => undefined };
const provider = createAIProvider(config, noCache);
const image = await new SharpImageProcessor().sanitize(readFileSync(imagePath));

const result = await provider.generateStructured({
  systemPrompt: buildPlantAnalysisSystemPrompt(localeArg),
  userPrompt: buildPlantAnalysisUserPrompt(),
  images: [{ mimeType: image.mimeType, base64Data: image.buffer.toString('base64') }],
  schema: plantAnalysisSchema,
  schemaName: PLANT_ANALYSIS_SCHEMA_NAME,
  promptVersion: PLANT_ANALYSIS_PROMPT_VERSION,
  locale: localeArg,
});

process.stdout.write(
  `${JSON.stringify(
    {
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      latencyMs: result.latencyMs,
      data: result.data,
    },
    null,
    2,
  )}\n`,
);
