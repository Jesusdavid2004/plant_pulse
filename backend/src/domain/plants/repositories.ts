import type { PetTraits } from './PetTraits';

export interface PlantSummary {
  id: string;
  name: string;
  species: string | null;
  commonName: string | null;
  careCategory: string | null;
  petTraits: PetTraits;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPlant {
  ownerId: string;
  name: string;
  species: string | null;
  commonName: string | null;
  careCategory: string;
  petTraits: PetTraits;
}

export interface PlantProfileUpdate {
  species: string | null;
  commonName: string | null;
  careCategory: string;
  petTraits: PetTraits;
}

export interface PlantChanges {
  name?: string;
  species?: string | null;
}

export interface PlantRepository {
  create(plant: NewPlant): Promise<PlantSummary>;
  listByOwner(ownerId: string): Promise<PlantSummary[]>;
  findByIdForOwner(plantId: string, ownerId: string): Promise<PlantSummary | null>;
  update(plantId: string, ownerId: string, changes: PlantChanges): Promise<PlantSummary | null>;
  applyProfile(plantId: string, ownerId: string, profile: PlantProfileUpdate): Promise<void>;
  delete(plantId: string, ownerId: string): Promise<boolean>;
}

export interface NewAnalysis {
  plantId: string;
  healthScore: number;
  status: string;
  diagnosis: string;
  carePlan: string[];
}

export interface AnalysisRecord extends NewAnalysis {
  id: string;
  createdAt: Date;
}

export interface AnalysisRepository {
  create(analysis: NewAnalysis): Promise<AnalysisRecord>;
  listByPlantForOwner(plantId: string, ownerId: string): Promise<AnalysisRecord[]>;
}

export interface PhotoRecord {
  id: string;
  plantId: string;
  storageKey: string;
  label: string;
  createdAt: Date;
}

export interface PhotoRepository {
  add(plantId: string, storageKey: string, label: string): Promise<PhotoRecord>;
  findForOwner(photoId: string, ownerId: string): Promise<PhotoRecord | null>;
  listStorageKeysByOwner(ownerId: string): Promise<string[]>;
  listStorageKeysByPlant(plantId: string, ownerId: string): Promise<string[]>;
}
