import { createContext, useContext, useState, ReactNode } from 'react';
import type { ChecklistConfig, SelectedEntity, DuplicationConfig } from '@/types';

/**
 * Application State Interface
 */
interface AppState {
  // Navigation
  currentStep: 1 | 2 | 3 | 4 | 5;

  // Data State
  inputJson: string | null;
  parsedConfig: ChecklistConfig[] | null;
  selectedEntities: SelectedEntity[]; // Changed from single entity to array
  duplicationConfig: DuplicationConfig | null;
  modifiedConfig: ChecklistConfig[] | null;
}

/**
 * Application Actions Interface
 */
interface AppActions {
  // Navigation Actions
  goToStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceed: () => boolean;

  // Data Actions
  setJsonLoaded: (json: string, parsed: ChecklistConfig[]) => void;
  setEntitySelected: (entity: SelectedEntity) => void; // Legacy - sets single entity
  addSelectedEntity: (entity: SelectedEntity) => void; // Multi-select: add entity
  removeSelectedEntity: (entityId: string) => void; // Multi-select: remove entity
  toggleEntitySelection: (entity: SelectedEntity) => void; // Multi-select: toggle entity
  clearSelection: () => void; // Multi-select: clear all selections
  setConfigUpdated: (config: DuplicationConfig) => void;
  setPreviewGenerated: (modified: ChecklistConfig[]) => void;

  // Flow Actions
  startOver: () => void;
  duplicateMore: () => void;

  // Direct Setters (for advanced use cases)
  setInputJson: (json: string | null) => void;
  setParsedConfig: (config: ChecklistConfig[] | null) => void;
  setSelectedEntities: (entities: SelectedEntity[]) => void;
  setDuplicationConfig: (config: DuplicationConfig | null) => void;
  setModifiedConfig: (config: ChecklistConfig[] | null) => void;
}

/**
 * Combined Context Type
 */
type AppContextType = AppState & AppActions;

/**
 * Create Context
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Provider Props
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * App Context Provider
 */
export function AppProvider({ children }: AppProviderProps) {
  // State Management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [inputJson, setInputJson] = useState<string | null>(null);
  const [parsedConfig, setParsedConfig] = useState<ChecklistConfig[] | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>([]);
  const [duplicationConfig, setDuplicationConfig] = useState<DuplicationConfig | null>(null);
  const [modifiedConfig, setModifiedConfig] = useState<ChecklistConfig[] | null>(null);

  // Navigation Actions
  const goToStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep((prev) => Math.min(5, prev + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const canProceed = (): boolean => {
    if (currentStep === 1) return inputJson !== null && parsedConfig !== null;
    if (currentStep === 2) return selectedEntities.length > 0;
    if (currentStep === 3) return duplicationConfig !== null;
    if (currentStep === 4) return modifiedConfig !== null;
    return true;
  };

  // Data Actions
  const setJsonLoaded = (json: string, parsed: ChecklistConfig[]) => {
    setInputJson(json);
    setParsedConfig(parsed);
  };

  const setEntitySelected = (entity: SelectedEntity) => {
    // Legacy function - now sets array with single entity for backward compatibility
    setSelectedEntities([entity]);
  };

  const addSelectedEntity = (entity: SelectedEntity) => {
    setSelectedEntities((prev) => {
      // Check if already selected
      if (prev.some((e) => e.id === entity.id)) {
        return prev;
      }
      return [...prev, entity];
    });
  };

  const removeSelectedEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  const toggleEntitySelection = (entity: SelectedEntity) => {
    setSelectedEntities((prev) => {
      const isSelected = prev.some((e) => e.id === entity.id);
      if (isSelected) {
        return prev.filter((e) => e.id !== entity.id);
      } else {
        return [...prev, entity];
      }
    });
  };

  const clearSelection = () => {
    setSelectedEntities([]);
  };

  const setConfigUpdated = (config: DuplicationConfig) => {
    setDuplicationConfig(config);
  };

  const setPreviewGenerated = (modified: ChecklistConfig[]) => {
    setModifiedConfig(modified);
  };

  // Flow Actions
  const startOver = () => {
    setCurrentStep(1);
    setInputJson(null);
    setParsedConfig(null);
    setSelectedEntities([]);
    setDuplicationConfig(null);
    setModifiedConfig(null);
  };

  const duplicateMore = () => {
    setCurrentStep(2);
    setSelectedEntities([]);
    setDuplicationConfig(null);
    setModifiedConfig(null);
  };

  // Context Value
  const value: AppContextType = {
    // State
    currentStep,
    inputJson,
    parsedConfig,
    selectedEntities,
    duplicationConfig,
    modifiedConfig,

    // Navigation Actions
    goToStep,
    nextStep,
    previousStep,
    canProceed,

    // Data Actions
    setJsonLoaded,
    setEntitySelected,
    addSelectedEntity,
    removeSelectedEntity,
    toggleEntitySelection,
    clearSelection,
    setConfigUpdated,
    setPreviewGenerated,

    // Flow Actions
    startOver,
    duplicateMore,

    // Direct Setters
    setInputJson,
    setParsedConfig,
    setSelectedEntities,
    setDuplicationConfig,
    setModifiedConfig,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to use App Context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Hook to use App State only
 */
export function useAppState() {
  const context = useAppContext();
  return {
    currentStep: context.currentStep,
    inputJson: context.inputJson,
    parsedConfig: context.parsedConfig,
    selectedEntities: context.selectedEntities,
    duplicationConfig: context.duplicationConfig,
    modifiedConfig: context.modifiedConfig,
  };
}

/**
 * Hook to use App Actions only
 */
export function useAppActions() {
  const context = useAppContext();
  return {
    goToStep: context.goToStep,
    nextStep: context.nextStep,
    previousStep: context.previousStep,
    canProceed: context.canProceed,
    setJsonLoaded: context.setJsonLoaded,
    setEntitySelected: context.setEntitySelected,
    addSelectedEntity: context.addSelectedEntity,
    removeSelectedEntity: context.removeSelectedEntity,
    toggleEntitySelection: context.toggleEntitySelection,
    clearSelection: context.clearSelection,
    setConfigUpdated: context.setConfigUpdated,
    setPreviewGenerated: context.setPreviewGenerated,
    startOver: context.startOver,
    duplicateMore: context.duplicateMore,
    setInputJson: context.setInputJson,
    setParsedConfig: context.setParsedConfig,
    setSelectedEntities: context.setSelectedEntities,
    setDuplicationConfig: context.setDuplicationConfig,
    setModifiedConfig: context.setModifiedConfig,
  };
}
