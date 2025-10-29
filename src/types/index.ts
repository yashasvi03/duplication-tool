// ==================== MES Configuration Types ====================

export interface ChecklistConfig {
  id: string;
  name: string;
  stageRequests: Stage[];
  actionRequests?: Action[];
}

export interface Stage {
  id: string;
  name: string;
  orderTree: number;
  taskRequests: Task[];
}

export interface Task {
  id: string;
  name: string;
  orderTree: number;
  parameterRequests: Parameter[];
  automationRequests?: Automation[];
}

export interface Parameter {
  id: string;
  orderTree: number;
  type: string;
  label: string;
  autoInitialize?: {
    parameterId: string;
    [key: string]: any;
  };
  rules?: ParameterRule[];
  [key: string]: any;
}

export interface Automation {
  id: string;
  actionDetails?: string | Record<string, any>; // JSON string or object
  triggerDetails?: string | Record<string, any>; // JSON string or object
  [key: string]: any;
}

export interface ParameterRule {
  show?: {
    parameters?: string[];
    tasks?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Action {
  id: string;
  name: string;
  description: string | null;
  triggerType: string; // "COMPLETE_TASK", "START_TASK", etc.
  triggerEntityId: string; // Task ID that triggers this action
  successMessage: string;
  failureMessage: string;
  checklistId: string | null;
  effectRequests: Effect[];
  [key: string]: any;
}

export interface Effect {
  id: string;
  name: string;
  description: string;
  orderTree: number;
  effectType: 'SQL_QUERY' | 'MONGO_QUERY' | 'REST_API';
  query?: LexicalEditorContent | null;
  apiEndpoint?: LexicalEditorContent | null;
  apiMethod?: string | null;
  apiHeaders?: any | null;
  apiPayload?: LexicalEditorContent | null;
  javascriptEnabled: boolean;
  archived: boolean;
  actionId: string | null;
  [key: string]: any;
}

export interface LexicalEditorContent {
  root: {
    type?: string;
    format?: string;
    indent?: number;
    version?: number;
    children: LexicalNode[];
    direction?: string;
    textFormat?: number;
  };
}

export interface LexicalNode {
  type?: string;
  format?: string;
  indent?: number;
  version?: number;
  children?: Array<LexicalTextNode | LexicalMentionNode>;
  direction?: string;
  textStyle?: string;
  textFormat?: number;
}

export interface LexicalTextNode {
  mode?: string;
  text: string;
  type: 'text';
  style?: string;
  detail?: number;
  format?: number;
  version?: number;
}

export interface LexicalMentionNode {
  data: {
    id: string;
    uuid: string;
    entity: 'parameter' | 'task' | 'effect' | 'constant';
    postfix?: string; // For @e references with property access
  };
  type: 'custom-beautifulMention';
  value: string;
  trigger: '@p' | '@t' | '@e' | '@s';
  version?: number;
  detail?: number;
  format?: number;
}

// ==================== Application State Types ====================

export interface AppState {
  // Step 1: Input
  inputJson: string | null;
  parsedConfig: ChecklistConfig[] | null;
  inputError: string | null;

  // Step 2: Selection
  selectedEntity: SelectedEntity | null;

  // Step 3: Configuration
  duplicationConfig: DuplicationConfig;

  // Step 4: Preview
  previewData: PreviewData | null;
  validationResults: ValidationResult[];

  // Step 5: Execution
  isExecuting: boolean;
  executionProgress: ExecutionProgress | null;
  modifiedJson: string | null;

  // Navigation
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export interface SelectedEntity {
  type: 'stage' | 'task' | 'parameter';
  id: string;
  data: Stage | Task | Parameter;
  parent: ChecklistConfig | Stage | Task | null;
  path: string[]; // Path from checklist root
  checklistIndex: number; // Index of the checklist in the array
  stageIndex?: number; // Index of the stage within checklist
  taskIndex?: number; // Index of the task within stage
}

export interface DuplicationConfig {
  numberOfCopies: number;
  namingPattern: {
    baseNameOverride: string | null;
    template: string; // e.g., "{base_name} {n}"
    zeroPadding: boolean;
    paddingLength: number;
    startingNumber: number; // Starting value for {n}
  };
  orderingStrategy: 'interleaved' | 'sequential'; // Multi-select: how copies are ordered
  groupingStrategy?: 'relative' | 'grouped'; // Sequential only: where to place copies
  components: {
    automations: boolean;
    linkedParameters: boolean;
    parameterRules: boolean;
    parameterValidations: boolean;
    schedules: boolean;
    media: boolean;
    recurrence: boolean;
    actions: boolean;
  };
  referenceStrategy: 'keep' | 'remove';
  placement: {
    position: 'after' | 'before' | 'start' | 'end';
    autoShift: boolean;
  };
  childNaming: {
    tasks: {
      applyInheritedSuffix: boolean;
      suffixPrefix: string;
    };
    parameters: {
      applyInheritedSuffix: boolean;
      suffixPrefix: string;
    };
  };
}

export interface PreviewData {
  summary: {
    totalTasks: number;
    totalParameters: number;
    totalAutomations: number;
    totalRules: number;
    totalActions: number;
    totalEffects: number;
    totalEntities: number;
  };
  namePreview: string[];
  orderTreeChanges: OrderTreeChange[];
  warnings: Warning[];
}

export interface OrderTreeChange {
  entityType: 'stage' | 'task' | 'parameter';
  entityId: string;
  entityName: string;
  oldOrder: number;
  newOrder: number;
}

export interface Warning {
  type: 'external_reference' | 'order_shift' | 'name_conflict' | 'circular_reference' | 'other';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  affectedEntities?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExecutionProgress {
  phase: string;
  percentage: number;
  currentItem: number;
  totalItems: number;
  elapsedSeconds: number;
}

// ==================== ID Mapping Types ====================

export interface IdMapping {
  tasks: Record<string, string[]>;
  parameters: Record<string, string[]>;
  automations: Record<string, string[]>;
  stages: Record<string, string[]>;
  actions: Record<string, string[]>;
  effects: Record<string, string[]>;
}

// ==================== Dependency Detection Types ====================

export interface ExternalDependency {
  type: 'automation' | 'parameter_rule' | 'auto_initialize';
  sourceId: string;
  sourceName: string;
  referencedId: string;
  referencedEntityType: 'parameter' | 'task' | 'stage';
  referencedName?: string;
}

export interface DependencyAnalysis {
  internal: ExternalDependency[];
  external: ExternalDependency[];
}

// ==================== Validation Types ====================

export interface JsonValidationError {
  type: 'syntax' | 'schema' | 'structure';
  message: string;
  line?: number;
  field?: string;
}

export interface ConfigValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

// ==================== Recent Files Types ====================

export interface RecentFile {
  name: string;
  content: string;
  timestamp: number;
  size: number;
}

// ==================== Entity Count Types ====================

export interface EntityCounts {
  stages: number;
  tasks: number;
  parameters: number;
  automations: number;
  rules: number;
  actions: number;
  effects: number;
}

// ==================== Tree Node Types ====================

export interface TreeNode {
  id: string;
  name: string;
  type: 'checklist' | 'stage' | 'task' | 'parameter';
  data: ChecklistConfig | Stage | Task | Parameter;
  children: TreeNode[];
  parent: TreeNode | null;
  level: number;
  orderTree?: number;
  counts?: EntityCounts;
}
