import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Plant, plantService } from '../services/plantService';

interface PlantState {
  plants: Plant[];
  selectedPlant: Plant | null;
  loading: boolean;
  error: string | null;
}

type PlantAction =
  | { type: 'SET_PLANTS'; payload: Plant[] }
  | { type: 'SET_SELECTED_PLANT'; payload: Plant | null }
  | { type: 'ADD_PLANT'; payload: Plant }
  | { type: 'UPDATE_PLANT'; payload: Plant }
  | { type: 'DELETE_PLANT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: PlantState = {
  plants: [],
  selectedPlant: null,
  loading: false,
  error: null,
};

const plantReducer = (state: PlantState, action: PlantAction): PlantState => {
  switch (action.type) {
    case 'SET_PLANTS':
      return { ...state, plants: action.payload, loading: false };
    case 'SET_SELECTED_PLANT':
      return { ...state, selectedPlant: action.payload, loading: false };
    case 'ADD_PLANT':
      return { ...state, plants: [...state.plants, action.payload] };
    case 'UPDATE_PLANT':
      return {
        ...state,
        plants: state.plants.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PLANT':
      return {
        ...state,
        plants: state.plants.filter((p) => p.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

interface PlantContextType {
  state: PlantState;
  dispatch: React.Dispatch<PlantAction>;
  fetchPlants: () => Promise<void>;
  fetchPlant: (id: string) => Promise<void>;
  createPlant: (data: { name: string; species?: string; userId: string }) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(plantReducer, initialState);

  const fetchPlants = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await plantService.getAll();
    if (response.success && response.data) {
      dispatch({ type: 'SET_PLANTS', payload: response.data });
    } else {
      dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to fetch plants' });
    }
  };

  const fetchPlant = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await plantService.getById(id);
    if (response.success && response.data) {
      dispatch({ type: 'SET_SELECTED_PLANT', payload: response.data });
    } else {
      dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to fetch plant' });
    }
  };

  const createPlant = async (data: { name: string; species?: string; userId: string }) => {
    const response = await plantService.create(data);
    if (response.success && response.data) {
      dispatch({ type: 'ADD_PLANT', payload: response.data });
    }
  };

  const deletePlant = async (id: string) => {
    const response = await plantService.delete(id);
    if (response.success) {
      dispatch({ type: 'DELETE_PLANT', payload: id });
    }
  };

  return (
    <PlantContext.Provider value={{ state, dispatch, fetchPlants, fetchPlant, createPlant, deletePlant }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlantStore = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlantStore must be used within a PlantProvider');
  }
  return context;
};
