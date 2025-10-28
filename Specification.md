MES Duplication Tool - Complete Specification
1. EXECUTIVE SUMMARY
A standalone web application that enables users to duplicate stages, tasks, or parameters in manufacturing execution system (MES) workflows. The tool operates entirely client-side with no backend persistence, accepting JSON configuration input and producing modified JSON output for download.

2. APPLICATION ARCHITECTURE
2.1 Technology Stack

Frontend Framework: React with TypeScript
Styling: Tailwind CSS
State Management: React Context + useState/useReducer
JSON Processing: Native JavaScript
File Handling: File API + Blob API
ID Generation: UUID v4 library

2.2 Core Principles

Stateless: No database, no server-side storage
Session-based: All data exists in browser memory during session
Downloadable Output: Modified JSON file as final deliverable
Client-side Only: Pure frontend application


3. USER WORKFLOW
3.1 Five-Step Process
Step 1: Upload JSON → Step 2: Select Entity → Step 3: Configure Options → 
Step 4: Preview → Step 5: Download Modified JSON
3.2 Detailed Step Descriptions
STEP 1: Input JSON Configuration
Purpose: Load the process configuration into the tool
Options:

File Upload:

Accept .json files via file input or drag-and-drop
Maximum file size: 50MB
Validate JSON structure immediately


Paste JSON:

Large textarea for direct JSON paste
Live syntax validation
Format/prettify option


Recent Files (sessionStorage):

Store last 3 uploaded files in browser
Quick reload without re-upload
Clear on browser close



Validation Requirements:
javascriptRequired Structure:
- Array of checklist objects
- Each checklist must have: id, name, stageRequests
- Each stage must have: id, name, orderTree, taskRequests
- Each task must have: id, name, orderTree, parameterRequests
- Each parameter must have: id, orderTree, type, label
```

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Upload Configuration                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Drop JSON file here            │  │
│  │  or click to browse             │  │
│  └─────────────────────────────────┘  │
│                                         │
│  OR                                     │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Paste JSON here...              │  │
│  │                                 │  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Format JSON] [Validate] [Continue]   │
│                                         │
│  Recent Files:                          │
│  • Division_Note_Packaging.json (2 min)│
│                                         │
└─────────────────────────────────────────┘
```

---

#### **STEP 2: Select Entity to Duplicate**

**Purpose**: Navigate the workflow tree and select what to duplicate

**Tree Structure Display**:
- Hierarchical view: Checklist → Stages → Tasks → Parameters
- Expandable/collapsible nodes
- Visual indicators for entity types (icons/colors)
- Search/filter functionality
- Entity count badges

**Selection Behavior**:
- Single selection only (v1.0)
- Click to select (highlight selected node)
- Show selection details in side panel
- Disable non-duplicatable entities

**Entity Detail Panel** (shown when entity selected):
```
┌─────────────────────────────────────────┐
│  SELECTED: Scan Container 1D            │
├─────────────────────────────────────────┤
│  Type: Task                             │
│  ID: 680757558941503493                 │
│  Current Order: 2                       │
│                                         │
│  Contains:                              │
│  ✓ 8 Parameters                         │
│  ✓ 3 Automations                        │
│  ✓ 0 Media attachments                  │
│  ✓ 0 Schedules                          │
│                                         │
│  Dependencies Detected:                 │
│  ⚠️  References external parameter in   │
│      task "DIVISION NOTE"               │
│  ⚠️  Automation references Resource     │
│      parameter from batch               │
│                                         │
│  [View Full Details]                    │
└─────────────────────────────────────────┘
```

**UI Layout**:
```
┌───────────────────┬─────────────────────┐
│   Workflow Tree   │   Details Panel     │
│                   │                     │
│ □ Division Note   │  [Entity details    │
│   □ TRANSFER NOTE │   shown here when   │
│     ⊟ Task 1      │   item selected]    │
│     ⊟ Task 2      │                     │
│   ⊞ DIVISION 1    │                     │
│     ⊟ DIVISION... │                     │
│     ■ Scan C-1D ◄─┼─ SELECTED          │
│     ⊟ Scan C-2D   │                     │
│                   │                     │
└───────────────────┴─────────────────────┘
```

---

#### **STEP 3: Configure Duplication Options**

**Purpose**: Specify how to duplicate and what to include

**Configuration Sections**:

**3A. Number of Copies**
```
┌─────────────────────────────────────────┐
│  NUMBER OF COPIES                       │
├─────────────────────────────────────────┤
│                                         │
│  How many copies?  [10        ]         │
│                                         │
│  ✓ Valid (1-100 copies allowed)         │
│                                         │
└─────────────────────────────────────────┘
```

**3B. Naming Pattern**
```
┌─────────────────────────────────────────┐
│  NAMING PATTERN                         │
├─────────────────────────────────────────┤
│                                         │
│  Base Name:                             │
│  [Scan Container 1D                 ]   │
│                                         │
│  Pattern:                               │
│  ● {base_name} {n}                      │
│  ○ {base_name} - Copy {n}               │
│  ○ {base_name} ({n})                    │
│  ○ Custom: [________________]           │
│                                         │
│  Zero-padding: [☑] Pad to [3] digits    │
│                                         │
│  Preview (first 3):                     │
│  1. Scan Container 1D 001               │
│  2. Scan Container 1D 002               │
│  3. Scan Container 1D 003               │
│                                         │
└─────────────────────────────────────────┘
```

**3C. Components to Copy**
```
┌─────────────────────────────────────────┐
│  COMPONENTS TO INCLUDE                  │
├─────────────────────────────────────────┤
│                                         │
│  ☑ Automations (3 found)                │
│     Copy automation actions and         │
│     triggers with ID remapping          │
│                                         │
│  ☑ Linked Parameters (2 found)          │
│     Maintain auto-initialization        │
│     references within copies            │
│                                         │
│  ☑ Parameter Rules (5 found)            │
│     Copy conditional visibility         │
│     and validation rules                │
│                                         │
│  ☐ Schedules (0 found) [DISABLED]       │
│                                         │
│  ☑ Media References (0 found)           │
│     Reference same media files          │
│                                         │
│  ☐ Recurrence Patterns (0 found)        │
│                                         │
└─────────────────────────────────────────┘
```

**3D. Reference Handling** (appears only if external dependencies detected)
```
┌─────────────────────────────────────────┐
│  ⚠️ EXTERNAL DEPENDENCIES FOUND          │
├─────────────────────────────────────────┤
│                                         │
│  This task references parameters in:    │
│  • Task: "DIVISION NOTE"                │
│                                         │
│  How should copies handle this?         │
│                                         │
│  ● Keep Original References             │
│     All copies reference the same       │
│     external parameters                 │
│     (Recommended)                       │
│                                         │
│  ○ Remove External References           │
│     Remove automations/rules that       │
│     reference external entities         │
│                                         │
│  [?] Help me choose                     │
│                                         │
└─────────────────────────────────────────┘
```

**3E. Placement Options**
```
┌─────────────────────────────────────────┐
│  PLACEMENT                              │
├─────────────────────────────────────────┤
│                                         │
│  Insert copies:                         │
│  ● After selected entity (default)      │
│  ○ At end of parent container           │
│                                         │
│  Order numbering:                       │
│  Current entity order: 2                │
│  First copy will be: 3                  │
│  Last copy will be: 12                  │
│                                         │
│  ☑ Auto-increment subsequent entities   │
│     (shift "Scan C-2D" from 3→13)       │
│                                         │
└─────────────────────────────────────────┘
```

---

#### **STEP 4: Preview Changes**

**Purpose**: Show exactly what will be created before execution

**Preview Sections**:

**4A. Summary Statistics**
```
┌─────────────────────────────────────────┐
│  DUPLICATION SUMMARY                    │
├─────────────────────────────────────────┤
│                                         │
│  Source: Task "Scan Container 1D"       │
│  Copies: 10                             │
│                                         │
│  Will Create:                           │
│  • 10 Tasks                             │
│  • 80 Parameters (8 per task)           │
│  • 30 Automations (3 per task)          │
│  • 50 Parameter Rules (5 per task)      │
│  • 0 Media References                   │
│  • 0 Schedules                          │
│                                         │
│  Total New Entities: 170                │
│                                         │
│  Placement:                             │
│  After "Scan Container 1D" (order 2)    │
│  in stage "DIVISION NOTE 1"             │
│                                         │
│  Order Range: 3-12                      │
│                                         │
└─────────────────────────────────────────┘
```

**4B. Naming Preview** (scrollable list)
```
┌─────────────────────────────────────────┐
│  NAMING PREVIEW                         │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Scan Container 1D 001 (Order: 3)    │
│  ✓ Scan Container 1D 002 (Order: 4)    │
│  ✓ Scan Container 1D 003 (Order: 5)    │
│  ✓ Scan Container 1D 004 (Order: 6)    │
│  ✓ Scan Container 1D 005 (Order: 7)    │
│  ✓ Scan Container 1D 006 (Order: 8)    │
│  ✓ Scan Container 1D 007 (Order: 9)    │
│  ✓ Scan Container 1D 008 (Order: 10)   │
│  ✓ Scan Container 1D 009 (Order: 11)   │
│  ✓ Scan Container 1D 010 (Order: 12)   │
│                                         │
│  ✓ All names valid, no conflicts       │
│                                         │
└─────────────────────────────────────────┘
```

**4C. Warnings & Issues**
```
┌─────────────────────────────────────────┐
│  ⚠️ WARNINGS (2)                         │
├─────────────────────────────────────────┤
│                                         │
│  1. External Reference                  │
│     3 automations reference parameter   │
│     "680757558933114880" in task        │
│     "DIVISION NOTE"                     │
│     → All copies will reference same    │
│                                         │
│  2. Order Tree Shift                    │
│     5 subsequent tasks will have        │
│     their order numbers increased by 10 │
│                                         │
└─────────────────────────────────────────┘
```

**4D. Reference Map** (for transparency)
```
┌─────────────────────────────────────────┐
│  REFERENCE HANDLING                     │
├─────────────────────────────────────────┤
│                                         │
│  Internal References: 45                │
│  ✓ All will be remapped correctly       │
│                                         │
│  External References: 3                 │
│  → Keeping original references          │
│                                         │
│  Details:                               │
│  • Parameter 680757558941503491         │
│    references external parameter        │
│    → Original reference preserved       │
│                                         │
│  [Show All References]                  │
│                                         │
└─────────────────────────────────────────┘
```

**Navigation Buttons**:
```
[← Back to Options]  [Execute Duplication →]
```

---

#### **STEP 5: Execute & Download**

**Purpose**: Perform duplication and provide downloadable result

**5A. Execution Progress** (for >20 copies)
```
┌─────────────────────────────────────────┐
│  DUPLICATING...                         │
├─────────────────────────────────────────┤
│                                         │
│  Creating 10 copies of                  │
│  "Scan Container 1D"                    │
│                                         │
│  Progress:                              │
│  [████████████████████] 100%            │
│                                         │
│  ✓ Tasks created: 10/10                 │
│  ✓ Parameters created: 80/80            │
│  ✓ Automations created: 30/30           │
│  ✓ Rules created: 50/50                 │
│  ✓ References remapped: 170/170         │
│                                         │
│  Elapsed: 0.8s                          │
│                                         │
└─────────────────────────────────────────┘
```

**5B. Success Screen**
```
┌─────────────────────────────────────────┐
│  ✅ DUPLICATION SUCCESSFUL               │
├─────────────────────────────────────────┤
│                                         │
│  Created 10 copies in 0.8 seconds       │
│                                         │
│  Summary:                               │
│  • 10 Tasks                             │
│  • 80 Parameters                        │
│  • 30 Automations                       │
│  • 50 Parameter Rules                   │
│                                         │
│  Your modified configuration is ready:  │
│                                         │
│  📄 Division_Note_Packaging_MODIFIED.json│
│     Size: 850 KB                        │
│     Created: Oct 28, 2025 10:30 AM     │
│                                         │
│  [⬇️ Download JSON]                     │
│                                         │
│  [Duplicate More] [Start Over]          │
│                                         │
└─────────────────────────────────────────┘

4. DUPLICATION LOGIC SPECIFICATIONS
4.1 ID Generation Strategy
Approach: Generate new unique IDs for all duplicated entities
javascript// ID format matches original: 18-digit numeric string
function generateNewId() {
  // Use timestamp + random for uniqueness
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return timestamp + random; // Results in 18-19 digit string
}
ID Mapping Table (maintained during duplication):
javascript{
  "tasks": {
    "680757558941503493": [  // Original ID
      "680757558941503500",  // Copy 1 ID
      "680757558941503501",  // Copy 2 ID
      // ... up to Copy 10
    ]
  },
  "parameters": {
    "680757558941503488": [
      "680757558941503600",
      "680757558941503601",
      // ...
    ]
  },
  "automations": {
    "680757561634246659": [
      "680757561634246700",
      // ...
    ]
  }
}
4.2 Reference Remapping Algorithm
Core Logic:
javascriptfunction remapReferences(entity, idMapping, copyIndex) {
  // Deep clone entity
  const copy = JSON.parse(JSON.stringify(entity));
  
  // Assign new ID
  copy.id = idMapping[entity.type][entity.id][copyIndex];
  
  // Traverse all fields recursively
  function traverse(obj) {
    for (const key in obj) {
      const value = obj[key];
      
      // Check if this looks like an ID reference
      if (isIdReference(key, value)) {
        const oldId = value;
        const newId = idMapping[inferType(key)][oldId]?.[copyIndex];
        
        if (newId) {
          // Internal reference - remap
          obj[key] = newId;
        } else {
          // External reference - keep original (per user config)
          // No change
        }
      }
      
      // Recurse into objects and arrays
      if (typeof value === 'object' && value !== null) {
        traverse(value);
      }
    }
  }
  
  traverse(copy);
  return copy;
}

function isIdReference(key, value) {
  // Check if key suggests this is an ID
  const idKeys = ['id', 'parameterId', 'taskId', 'stageId', 'referencedParameterId'];
  
  // Check if value looks like an ID (18-19 digit string)
  const looksLikeId = typeof value === 'string' && /^\d{18,19}$/.test(value);
  
  return idKeys.some(k => key.includes(k)) && looksLikeId;
}
4.3 Automation Remapping
Specific handling for automation JSON fields:
javascriptfunction remapAutomation(automation, idMapping, copyIndex) {
  const copy = { ...automation };
  copy.id = idMapping.automations[automation.id][copyIndex];
  
  // Remap actionDetails (JSON)
  if (copy.actionDetails) {
    copy.actionDetails = remapJsonField(
      copy.actionDetails, 
      idMapping, 
      copyIndex
    );
  }
  
  // Remap triggerDetails (JSON)
  if (copy.triggerDetails) {
    copy.triggerDetails = remapJsonField(
      copy.triggerDetails,
      idMapping,
      copyIndex
    );
  }
  
  return copy;
}

function remapJsonField(jsonObj, idMapping, copyIndex) {
  if (typeof jsonObj === 'string') {
    jsonObj = JSON.parse(jsonObj);
  }
  
  // Recursively find and replace IDs
  function recurse(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => recurse(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (isIdReference(key, value)) {
          const newId = idMapping.parameters[value]?.[copyIndex];
          result[key] = newId || value; // Keep original if not found
        } else {
          result[key] = recurse(value);
        }
      }
      return result;
    }
    return obj;
  }
  
  return recurse(jsonObj);
}
4.4 Parameter Rules Remapping
Handle intra-task rules:
javascriptfunction remapParameterRules(task, idMapping, copyIndex) {
  for (const parameter of task.parameterRequests) {
    if (parameter.rules && Array.isArray(parameter.rules)) {
      parameter.rules = parameter.rules.map(rule => {
        const newRule = { ...rule };
        
        // Remap show.parameters array
        if (newRule.show?.parameters) {
          newRule.show.parameters = newRule.show.parameters.map(paramId => {
            return idMapping.parameters[paramId]?.[copyIndex] || paramId;
          });
        }
        
        // Remap show.tasks array (if any)
        if (newRule.show?.tasks) {
          newRule.show.tasks = newRule.show.tasks.map(taskId => {
            return idMapping.tasks[taskId]?.[copyIndex] || taskId;
          });
        }
        
        return newRule;
      });
    }
  }
}
4.5 Order Tree Management
Algorithm:
javascriptfunction adjustOrderTrees(stage, insertPosition, numberOfCopies) {
  // Get all tasks in the stage
  const tasks = stage.taskRequests;
  
  // Find the insertion point
  const sourceTask = tasks.find(t => t.orderTree === insertPosition);
  const sourceIndex = tasks.indexOf(sourceTask);
  
  // Shift subsequent tasks
  for (let i = sourceIndex + 1; i < tasks.length; i++) {
    tasks[i].orderTree += numberOfCopies;
  }
  
  // Insert copies with sequential order numbers
  const copies = [];
  for (let i = 0; i < numberOfCopies; i++) {
    const copy = createCopy(sourceTask, i);
    copy.orderTree = insertPosition + i + 1;
    copies.push(copy);
  }
  
  // Insert copies into array
  tasks.splice(sourceIndex + 1, 0, ...copies);
  
  return stage;
}

5. DATA STRUCTURES
5.1 Application State
typescriptinterface AppState {
  // Step 1: Input
  inputJson: string | null;
  parsedConfig: ChecklistConfig | null;
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

interface SelectedEntity {
  type: 'stage' | 'task' | 'parameter';
  id: string;
  data: any; // The actual entity object
  parent: any; // Parent entity
  path: string[]; // Path from checklist root
}

interface DuplicationConfig {
  numberOfCopies: number;
  namingPattern: {
    baseNameOverride: string | null;
    template: string; // e.g., "{base_name} {n}"
    zeroPadding: boolean;
    paddingLength: number;
  };
  components: {
    automations: boolean;
    linkedParameters: boolean;
    parameterRules: boolean;
    schedules: boolean;
    media: boolean;
    recurrence: boolean;
  };
  referenceStrategy: 'keep' | 'remove';
  placement: {
    position: 'after' | 'before' | 'start' | 'end';
    autoShift: boolean;
  };
}

interface PreviewData {
  summary: {
    totalTasks: number;
    totalParameters: number;
    totalAutomations: number;
    totalRules: number;
    totalEntities: number;
  };
  namePreview: string[];
  orderTreeChanges: OrderTreeChange[];
  warnings: Warning[];
}

interface ExecutionProgress {
  phase: string;
  percentage: number;
  currentItem: number;
  totalItems: number;
  elapsedSeconds: number;
}
5.2 ID Mapping Structure
typescriptinterface IdMapping {
  tasks: Record<string, string[]>;
  parameters: Record<string, string[]>;
  automations: Record<string, string[]>;
  stages: Record<string, string[]>;
}

6. EDGE CASES & HANDLING
6.1 External Dependencies
Scenario: Task has automation referencing parameter in different task
Detection:
javascriptfunction detectExternalDependencies(entity, fullConfig) {
  const dependencies = {
    external: [],
    internal: []
  };
  
  // For tasks, check if automations reference params outside this task
  if (entity.type === 'task') {
    const taskParamIds = new Set(
      entity.parameterRequests.map(p => p.id)
    );
    
    entity.automationRequests?.forEach(auto => {
      const referencedParams = extractParameterIds(auto);
      referencedParams.forEach(paramId => {
        if (!taskParamIds.has(paramId)) {
          dependencies.external.push({
            type: 'automation',
            autoId: auto.id,
            referencedId: paramId,
            referencedEntity: findParameterInConfig(paramId, fullConfig)
          });
        }
      });
    });
  }
  
  return dependencies;
}
User Decision Required:

Present warning in Step 3
Offer "Keep Reference" (default) or "Remove Reference"
If "Keep": All copies reference same external parameter
If "Remove": Delete those automations from copies

6.2 Circular References
Constraint: Specification states no circular dependencies will exist
Handling: No special logic needed, but add validation warning if detected
javascriptfunction validateNoCircularRefs(entity) {
  // Simple check: if parameter references itself
  // (Should not happen per spec, but validate anyway)
  const issues = [];
  
  if (entity.type === 'parameter') {
    if (entity.autoInitialize?.parameterId === entity.id) {
      issues.push('Parameter references itself in autoInitialize');
    }
  }
  
  return issues;
}
6.3 Name Conflicts
Detection:
javascriptfunction detectNameConflicts(copies, existingEntities) {
  const existingNames = new Set(existingEntities.map(e => e.name));
  const conflicts = [];
  
  copies.forEach((copy, index) => {
    if (existingNames.has(copy.name)) {
      conflicts.push({
        index,
        name: copy.name,
        suggestion: `${copy.name}_${Date.now()}`
      });
    }
  });
  
  return conflicts;
}
Auto-Resolution:

Append underscore + timestamp to conflicting names
Show user before execution
Allow manual edit in preview step

6.4 Large Duplications (>50 copies)
Special Handling:

Show warning about performance
Use batched processing (process 10 at a time)
Show detailed progress indicator
Allow cancellation mid-process

javascriptasync function batchDuplicate(entity, count, batchSize = 10) {
  const batches = Math.ceil(count / batchSize);
  const results = [];
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, count);
    const batchCount = end - start;
    
    // Create this batch
    const batchResults = createCopies(entity, batchCount, start);
    results.push(...batchResults);
    
    // Update progress
    updateProgress({
      phase: 'Creating entities',
      percentage: (end / count) * 60, // 60% of total process
      currentItem: end,
      totalItems: count
    });
    
    // Yield to UI thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

7. VALIDATION REQUIREMENTS
7.1 Input Validation (Step 1)
javascriptconst inputValidation = {
  // JSON format
  isValidJson: (input) => {
    try {
      JSON.parse(input);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },
  
  // Schema validation
  hasRequiredFields: (config) => {
    const required = ['id', 'name', 'stageRequests'];
    const missing = required.filter(field => !config[0]?.[field]);
    return {
      valid: missing.length === 0,
      missing
    };
  },
  
  // Structure validation
  hasValidStructure: (config) => {
    // Check nested structure
    const issues = [];
    
    config.forEach(checklist => {
      if (!Array.isArray(checklist.stageRequests)) {
        issues.push('stageRequests must be an array');
      }
      
      checklist.stageRequests?.forEach(stage => {
        if (!Array.isArray(stage.taskRequests)) {
          issues.push(`Stage ${stage.name}: taskRequests must be an array`);
        }
      });
    });
    
    return { valid: issues.length === 0, issues };
  }
};
7.2 Configuration Validation (Step 3)
javascriptconst configValidation = {
  // Number of copies
  validateCopyCount: (count) => {
    if (count < 1) return { valid: false, error: 'Must be at least 1' };
    if (count > 100) return { valid: false, error: 'Maximum 100 copies' };
    if (!Number.isInteger(count)) return { valid: false, error: 'Must be whole number' };
    return { valid: true };
  },
  
  // Naming pattern
  validateNamingPattern: (pattern, baseNname) => {
    // Must contain {n} or similar variable
    if (!pattern.includes('{n}')) {
      return { valid: false, error: 'Pattern must include {n}' };
    }
    
    // Generate sample names to check length
    const sample = generateName(pattern, baseName, 1);
    if (sample.length > 512) {
      return { valid: false, error: 'Generated names too long (>512 chars)' };
    }
    
    return { valid: true };
  }
};
7.3 Pre-Execution Validation (Step 4)
javascriptconst preExecutionValidation = {
  // Check all IDs will be unique
  validateUniqueIds: (copies, existingConfig) => {
    const allIds = extractAllIds(existingConfig);
    const newIds = extractAllIds(copies);
    const conflicts = newIds.filter(id => allIds.has(id));
    
    return {
      valid: conflicts.length === 0,
      conflicts
    };
  },
  
  // Verify order tree sequence
  validateOrderTree: (stage) => {
    const orders = stage.taskRequests.map(t => t.orderTree);
    const sorted = [...orders].sort((a, b) => a - b);
    
    // Check for gaps or duplicates
    const issues = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i] === sorted[i+1]) {
        issues.push(`Duplicate order tree: ${sorted[i]}`);
      }
    }
    
    return { valid: issues.length === 0, issues };
  }
};
```

---

## 8. USER INTERFACE SPECIFICATIONS

### 8.1 Layout & Navigation

**Main Container**:
```
┌────────────────────────────────────────────────┐
│  MES Duplication Tool                    [?][×]│
├────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐ │
│  │  Progress: ● ○ ○ ○ ○                     │ │
│  │  Step 1: Upload   Step 2   ...  Step 5   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [Main content area for current step]         │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  [← Back]              [Next / Execute →]│ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
Progress Indicator:

Show all 5 steps
Highlight current step
Gray out future steps
Show checkmark on completed steps
Allow clicking previous steps to go back

Color Scheme:

Primary: Blue (#3B82F6)
Success: Green (#10B981)
Warning: Yellow (#F59E0B)
Error: Red (#EF4444)
Neutral: Gray (#6B7280)

8.2 Component Specifications
Button Styles:
cssPrimary Button:
- Background: Blue
- Text: White
- Hover: Darker blue
- Disabled: Gray

Secondary Button:
- Background: White
- Border: Blue
- Text: Blue
- Hover: Light blue background

Danger Button:
- Background: Red
- Text: White
- Used for: Cancel operations
Input Fields:
cssStandard Input:
- Border: Gray
- Focus: Blue border, blue glow
- Error: Red border, red text below
- Success: Green border, green check icon

Number Input:
- Include +/- buttons
- Show validation immediately
- Display unit/range info
Tree View:
cssNodes:
- Indent: 24px per level
- Icon: 16x16 px
- Expand/collapse: Click anywhere on node
- Selected: Blue background, white text
- Hover: Light gray background

Icons:
- Checklist: 📋
- Stage: 📁
- Task: ☑️
- Parameter: 🔧
```

---

## 9. ERROR HANDLING

### 9.1 Error Categories

**User Errors**:
- Invalid JSON format → Show parse error with line number
- Missing required fields → Highlight missing fields
- Invalid configuration → Explain what's wrong and how to fix

**System Errors**:
- Out of memory → Suggest reducing copies
- Browser crash → Offer to save progress
- Unexpected data → Gracefully degrade

**Validation Errors**:
- Name conflicts → Show conflicts and offer auto-fix
- Reference issues → Explain and offer strategies
- Order tree problems → Auto-correct or warn

### 9.2 Error Display Format
```
┌─────────────────────────────────────────┐
│  ❌ ERROR TITLE                          │
├─────────────────────────────────────────┤
│                                         │
│  Problem:                               │
│  [Clear explanation of what went wrong] │
│                                         │
│  Why:                                   │
│  [Technical reason if helpful]          │
│                                         │
│  Solution:                              │
│  • [Actionable step 1]                  │
│  • [Actionable step 2]                  │
│                                         │
│  [Auto-Fix] [Manual Fix] [Cancel]       │
│                                         │
└─────────────────────────────────────────┘

10. PERFORMANCE REQUIREMENTS
10.1 Response Time Targets
OperationTargetMaximumJSON parse<100ms500msTree render<200ms1sConfig validation<100ms500msPreview generation<200ms1sDuplication (10 copies)<1s3sDuplication (100 copies)<10s30sJSON downloadInstant1s
10.2 Memory Management
Constraints:

Maximum JSON file size: 50MB
Maximum entities in memory: 10,000
Browser memory target: <500MB

Optimization Strategies:

Use shallow copies where possible
Clean up references after steps
Batch process large duplications
Defer non-critical operations


11. ACCESSIBILITY
11.1 Keyboard Navigation

Tab: Move between interactive elements
Enter: Activate buttons, expand/collapse nodes
Space: Select checkboxes
Arrow keys: Navigate tree view
Escape: Close modals, cancel operations

11.2 Screen Reader Support

Proper ARIA labels on all interactive elements
Announce state changes (e.g., "Duplication successful")
Describe complex interactions
Provide text alternatives for visual indicators

11.3 Visual Accessibility

Minimum contrast ratio: 4.5:1 for text
Don't rely on color alone for information
Provide text labels for icons
Support browser zoom up to 200%


12. TESTING STRATEGY
12.1 Test Scenarios
Basic Functionality:

Upload valid JSON → Parse successfully
Select task → Show details correctly
Configure 10 copies → Generate preview
Execute duplication → Download modified JSON
Re-upload modified JSON → Parse successfully

Edge Cases:
6. Duplicate 1 copy → Works correctly
7. Duplicate 100 copies → Completes within time limit
8. Task with external refs → Handle correctly
9. Duplicate stage with 20 tasks → All tasks duplicated
10. Duplicate parameter only → Works in isolation
Error Scenarios:
11. Upload invalid JSON → Show helpful error
12. Select entity then go back → State preserved
13. Cancel mid-duplication → Clean rollback
14. Name conflicts → Detect and offer fix
15. Browser refresh mid-process → Graceful handling
12.2 Validation Tests
For each step, validate:

Input sanitization
State consistency
ID uniqueness
Reference integrity
Order tree validity


13. FUTURE ENHANCEMENTS (v2.0)
Not in v1.0, but good to note:

Multi-select duplication: Select multiple entities at once
CSV-based naming: Upload CSV with names for each copy
Template library: Save and reuse duplication configs
Diff view: Show before/after comparison
Undo/redo: Allow reverting changes before download
Batch mode: Process multiple checklists in sequence
Export formats: Support YAML, XML output
Cloud sync: Optional save to browser storage
Collaboration: Share duplication configs via URL
Advanced rules: Complex naming patterns with variables