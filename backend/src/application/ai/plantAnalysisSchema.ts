import { z } from 'zod';
import { CARE_CATEGORIES } from '../../domain/care/CareCatalog';
import { HEALTH_CONDITIONS, SEVERITIES } from '../../domain/plants/HealthAssessment';
import {
  BLOOM_COLORS,
  BLOOM_SHAPES,
  LEAF_COLORS,
  LEAF_SHAPES,
} from '../../domain/plants/PetTraits';

const MAX_NAME_LENGTH = 80;
const MAX_SCIENTIFIC_NAME_LENGTH = 120;
const MAX_SIGN_LENGTH = 160;
const MAX_SIGNS = 5;
const MAX_DIAGNOSIS_LENGTH = 600;
const MAX_ADVICE_LENGTH = 200;
const MAX_ADVICE_ITEMS = 4;
const MAX_VISIBLE_LEAVES = 30;

export const plantAnalysisSchema = z.object({
  isPlant: z.boolean(),
  commonName: z.string().min(1).max(MAX_NAME_LENGTH),
  scientificName: z.string().max(MAX_SCIENTIFIC_NAME_LENGTH).nullable(),
  careCategory: z.enum(CARE_CATEGORIES),
  leafShape: z.enum(LEAF_SHAPES),
  leafCount: z.number().int().min(1).max(MAX_VISIBLE_LEAVES),
  leafColor: z.enum(LEAF_COLORS),
  bloomShape: z.enum(BLOOM_SHAPES),
  bloomColor: z.enum(BLOOM_COLORS),
  healthCondition: z.enum(HEALTH_CONDITIONS),
  severity: z.enum(SEVERITIES),
  visibleSigns: z.array(z.string().max(MAX_SIGN_LENGTH)).max(MAX_SIGNS),
  diagnosis: z.string().min(1).max(MAX_DIAGNOSIS_LENGTH),
  advice: z.array(z.string().min(1).max(MAX_ADVICE_LENGTH)).min(1).max(MAX_ADVICE_ITEMS),
});

export type PlantAnalysisResponse = z.infer<typeof plantAnalysisSchema>;
