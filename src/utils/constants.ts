import type { DuplicationConfig } from '@/types';

/**
 * Default duplication configuration
 */
export const DEFAULT_DUPLICATION_CONFIG: DuplicationConfig = {
  numberOfCopies: 1,
  namingPattern: {
    baseNameOverride: null,
    template: '{base_name} {n}',
    zeroPadding: true,
    paddingLength: 3,
  },
  orderingStrategy: 'interleaved',
  groupingStrategy: 'relative',
  components: {
    automations: true,
    linkedParameters: true,
    parameterRules: true,
    parameterValidations: true,
    schedules: true,
    media: true,
    recurrence: true,
  },
  referenceStrategy: 'keep',
  placement: {
    position: 'after',
    autoShift: true,
  },
};

/**
 * Naming pattern templates
 */
export const NAMING_PATTERNS = [
  { label: '{base_name} {n}', value: '{base_name} {n}' },
  { label: '{base_name} - Copy {n}', value: '{base_name} - Copy {n}' },
  { label: '{base_name} ({n})', value: '{base_name} ({n})' },
  { label: '{base_name}_{n}', value: '{base_name}_{n}' },
];

/**
 * Maximum values
 */
export const MAX_COPIES = 100;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Step labels
 */
export const STEP_LABELS = {
  1: 'Upload',
  2: 'Select',
  3: 'Configure',
  4: 'Preview',
  5: 'Download',
} as const;

export const STEP_TITLES = {
  1: 'Upload JSON Configuration',
  2: 'Select Entity to Duplicate',
  3: 'Configure Duplication Options',
  4: 'Preview Changes',
  5: 'Execute & Download',
} as const;

/**
 * Entity type display names
 */
export const ENTITY_TYPE_LABELS = {
  checklist: 'Checklist',
  stage: 'Stage',
  task: 'Task',
  parameter: 'Parameter',
} as const;

/**
 * Component labels
 */
export const COMPONENT_LABELS = {
  automations: 'Automations',
  linkedParameters: 'Linked Parameters',
  parameterRules: 'Parameter Rules',
  parameterValidations: 'Filters & Validations',
  schedules: 'Schedules',
  media: 'Media References',
  recurrence: 'Recurrence Patterns',
} as const;

/**
 * Component descriptions
 */
export const COMPONENT_DESCRIPTIONS = {
  automations: 'Copy automation actions and triggers with ID remapping',
  linkedParameters: 'Maintain auto-initialization references within copies',
  parameterRules: 'Copy conditional visibility and validation rules',
  parameterValidations: 'Copy parameter filters and validations with reference remapping',
  schedules: 'Copy schedule configurations',
  media: 'Reference same media files in copies',
  recurrence: 'Copy recurrence pattern settings',
} as const;

/**
 * Reference strategy labels
 */
export const REFERENCE_STRATEGY_LABELS = {
  keep: 'Keep Original References',
  remove: 'Remove External References',
} as const;

/**
 * Reference strategy descriptions
 */
export const REFERENCE_STRATEGY_DESCRIPTIONS = {
  keep: 'All copies reference the same external parameters (Recommended)',
  remove: 'Remove automations/rules that reference external entities',
} as const;

/**
 * Placement position labels
 */
export const PLACEMENT_LABELS = {
  after: 'After selected entity',
  before: 'Before selected entity',
  start: 'At start of parent container',
  end: 'At end of parent container',
} as const;

/**
 * Warning severity colors
 */
export const WARNING_COLORS = {
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
} as const;

/**
 * Warning type icons (using lucide-react icon names)
 */
export const WARNING_ICONS = {
  external_reference: 'ExternalLink',
  order_shift: 'ArrowUpDown',
  name_conflict: 'AlertTriangle',
  circular_reference: 'RotateCw',
  other: 'Info',
} as const;

/**
 * Ordering strategy labels
 */
export const ORDERING_STRATEGY_LABELS = {
  interleaved: 'Interleaved (Recommended)',
  sequential: 'Sequential',
} as const;

/**
 * Ordering strategy descriptions
 */
export const ORDERING_STRATEGY_DESCRIPTIONS = {
  interleaved: 'Copies inserted as one group: A₁ → B₁ → C₁ → A₂ → B₂ → C₂',
  sequential: 'All copies of each entity together: A₁ → A₂ → B₁ → B₂ → C₁ → C₂',
} as const;

/**
 * Grouping strategy labels
 */
export const GROUPING_STRATEGY_LABELS = {
  relative: 'Relative to Each Original',
  grouped: 'Keep All Together',
} as const;

/**
 * Grouping strategy descriptions
 */
export const GROUPING_STRATEGY_DESCRIPTIONS = {
  relative: 'Insert each entity\'s copies near its original position',
  grouped: 'Keep all originals together, then add all copies as a block',
} as const;
