# MES Duplication Tool

A standalone React + TypeScript web application for duplicating stages, tasks, or parameters in Manufacturing Execution System (MES) workflows.

## Features

- **5-Step Workflow**: Upload → Select → Configure → Preview → Download
- **Entity Duplication**: Duplicate stages, tasks, or parameters with intelligent ID remapping
- **Multi-Select Duplication**: Select and duplicate multiple entities at once with flexible ordering strategies
  - **Interleaved**: Copies inserted as groups (A₁ → B₁ → C₁ → A₂ → B₂ → C₂)
  - **Sequential**: All copies of each entity together (A₁ → A₂ → B₁ → B₂ → C₁ → C₂)
- **Smart Reference Handling**: Internal references are remapped, external references can be kept or removed
  - Supports automations, linked parameters, parameter rules, filters & validations
  - Actions & effects with Lexical editor support (@t, @p, @e, @s references)
  - Calculation parameters with variable reference remapping (taskId, parameterId)
- **Advanced Naming Options**:
  - Custom naming patterns with `{base_name}` and `{n}` variables
  - Configurable starting number (start from any number, not just 1)
  - Zero-padding support with configurable length
  - Cascading suffix inheritance for child entities
- **Actions & Effects Duplication**: Full support for checklist-level actions
  - Automatic duplication when triggering tasks are duplicated
  - Lexical editor traversal and remapping for SQL/Mongo queries and REST APIs
  - Reference remapping for @t (task), @p (parameter), @e (effect), @s (constant)
- **Live Preview**: See exactly what will be created before execution
- **Flexible Configuration**:
  - Create 1-100 copies
  - Component selection (automations, parameters, rules, actions, calculations, schedules, media, recurrence)
  - Placement options (before/after/start/end)
  - Reference strategy (keep or remove external references)
- **Client-Side Only**: No backend required, runs entirely in browser
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels and keyboard navigation
- **Error Handling**: Error boundaries and user-friendly error messages
- **Type Safety**: Full TypeScript with strict mode

## Tech Stack

- **React 18.3.1** - UI framework
- **TypeScript 5.6.2** - Type safety
- **Vite 6.0.1** - Build tool and dev server
- **Tailwind CSS 3.4.15** - Styling
- **shadcn/ui** - Component library (built on Radix UI)
- **Lucide React** - Icons
- **React Context API** - State management

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yashasvi03/duplication-tool.git
   cd duplication-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Running Tests

```bash
npm run test
```

## Usage

### Step 1: Upload JSON Configuration

Upload or paste your MES configuration JSON file. The tool supports:
- File upload with drag-and-drop
- Direct JSON paste
- Recent files (stored in session storage)
- Automatic validation and formatting

### Step 2: Select Entity to Duplicate

Browse the hierarchical tree view to select entities:
- **Stages**: Duplicate entire workflow stages
- **Tasks**: Duplicate tasks within a stage
- **Parameters**: Duplicate individual parameters

Features:
- **Single or Multi-Select**: Select one entity or multiple entities of the same type
- Expandable/collapsible tree
- Search functionality
- Entity details panel
- Count badges (shows number of sub-entities)
- Multi-select indicator showing number of selected entities

### Step 3: Configure Duplication Options

Configure how duplication should work:

**Naming Options**:
- **Number of Copies**: 1-100
- **Naming Pattern**: Use variables like `{base_name}` and `{n}`
- **Starting Number**: Start numbering from any value (not just 1)
- **Zero-Padding**: Optional padding with configurable length (e.g., 001, 002, 003)
- **Base Name Override**: Optional custom base name for all copies
- **Cascading Suffix Inheritance**: Child entities can inherit parent's numeric suffix

**Multi-Select Options** (when multiple entities selected):
- **Ordering Strategy**:
  - Interleaved (recommended): Copies as groups
  - Sequential: All copies of each entity together
- **Grouping Strategy** (sequential only):
  - Relative: Place copies near their originals
  - Grouped: Keep all originals, then all copies

**Components to Include**:
- Automations, Linked Parameters, Parameter Rules
- Filters & Validations, Schedules, Media, Recurrence
- Actions & Effects (with Lexical editor reference remapping)
- Calculation Parameters (with variable reference remapping)

**Reference Handling**:
- **Keep**: Preserve external references (recommended)
- **Remove**: Remove automations/rules referencing external entities

**Placement Options**:
- After/Before selected entity
- Start/End of parent container
- Auto-shift subsequent entities (optional)

### Step 4: Preview Changes

Review what will be created:
- Summary statistics (tasks, parameters, automations, rules, actions, effects)
- Name preview showing first 3 copies (or all selected entities in multi-select)
- Order tree changes with before/after values
- Warnings and validation messages
  - External reference warnings
  - Order shift notifications
  - Name conflict detection

### Step 5: Execute & Download

- Watch progress animation
- View success summary
- Download modified JSON file
- Options to duplicate more or start over

## ID Generation

The tool generates 18-19 digit numeric IDs matching the MES system format:

```
[timestamp][random 6 digits]
Example: 1730116057123456
```

## Reference Remapping

The duplication engine intelligently handles references across different component types:

### Standard ID References
- **Internal References**: IDs within the selected scope are remapped to new copies
- **External References**: IDs outside the scope are kept or removed based on user preference
- **Supported Components**: Automations, linked parameters, parameter rules, filters & validations, calculation parameters

Example: When duplicating a task that references a parameter in the same task, the reference is automatically updated to point to the duplicated parameter.

### Calculation Parameters
Calculation parameters store references in a structured `data.variables` object:

```json
{
  "type": "CALCULATION",
  "data": {
    "variables": {
      "CR": {
        "taskId": "666951402617892871",
        "parameterId": "666951402634670085"
      }
    },
    "expression": "QS-CR"
  }
}
```

- **Internal References**: If `taskId` and `parameterId` are within the duplication scope, both IDs are remapped
- **External References**: Variables referencing external tasks/parameters:
  - **Keep strategy**: Original IDs preserved
  - **Remove strategy**: Variable removed from calculation
- **Smart Detection**: Uses existing `isIdReference()` logic to automatically detect ID fields
- **Scope Determination**: Parameters in the same task = internal; different task = external

### Actions & Effects (Lexical Editor Support)
Actions and effects use a Lexical editor format with special mention patterns:

- **@t (Task References)**: Task IDs in `triggerEntityId` and Lexical mentions
  - Internal: Remapped if task is being duplicated
  - External: Kept or replaced with `[REMOVED: task_name]` based on strategy
  - Handles numeric triggerEntityId values from MES backend

- **@p (Parameter References)**: Parameter IDs in effect queries/payloads
  - Internal: Remapped if parameter is in duplicated scope
  - External: Applied per reference strategy

- **@e (Effect References)**: Effect IDs referenced within the same action
  - Internal: Remapped if effect is in the same duplicated action
  - External: Applied per reference strategy
  - Supports property accessors (e.g., `data[0].objectid`)

- **@s (System Constants)**: System variables like `jobId`
  - Always external (never remapped)
  - Examples: `jobId`, `userId`, other system constants

### Lexical Editor Traversal
The tool recursively traverses Lexical editor content in:
- Effect queries (SQL/MongoDB)
- API endpoints
- API payloads
- JavaScript-enabled expressions

All `custom-beautifulMention` nodes are processed for reference remapping while preserving the complete Lexical structure.

## File Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── ErrorBoundary.tsx
│   └── Loading.tsx
├── contexts/        # React Context for state management
│   └── AppContext.tsx
├── steps/           # 5-step workflow components
│   ├── Step1Upload.tsx
│   ├── Step2Select.tsx
│   ├── Step3Configure.tsx
│   ├── Step4Preview.tsx
│   └── Step5Execute.tsx
├── utils/           # Utility functions
│   ├── duplicationEngine.ts  # Core duplication logic
│   ├── previewHelpers.ts     # Preview generation
│   ├── idGeneration.ts       # ID generation
│   ├── validation.ts         # JSON validation
│   ├── helpers.ts            # General utilities
│   ├── treeHelpers.ts        # Tree view helpers
│   ├── performance.ts        # Performance utilities
│   └── constants.ts          # Constants
├── types/           # TypeScript type definitions
│   └── index.ts
└── App.tsx          # Main application component
```

## Key Algorithms

### ID Mapping Strategy

1. **Pre-generate all IDs**: Before duplication, generate all new IDs upfront
2. **Create mapping**: Maintain old ID → new IDs array mapping
   - Maps stages, tasks, parameters, automations, actions, effects
   - Actions included only if their `triggerEntityId` matches a duplicated task
3. **Traverse and remap**: Recursively traverse all objects and remap references
   - Standard ID fields in JSON structures
   - Lexical editor mention nodes in actions/effects

### Multi-Select Duplication Strategies

**Interleaved Strategy** (Default):
```
Original: A, B, C
Copies (n=2): A, B, C, A_copy1, B_copy1, C_copy1
```
All originals stay in place, all copies inserted as one group

**Sequential Strategy with Relative Grouping**:
```
Original: A, B, C
Copies (n=2): A, A_copy1, B, B_copy1, C, C_copy1
```
Each entity's copies inserted near its original position

**Sequential Strategy with Grouped Placement**:
```
Original: A, B, C
Copies (n=2): A, B, C, A_copy1, A_copy2, B_copy1, B_copy2, C_copy1, C_copy2
```
All originals first, then all copies grouped by entity

### Reference Detection

The tool detects ID references by:
- **Standard Fields**: Checking field names that typically contain IDs (`parameterId`, `taskId`, `triggerEntityId`, etc.)
- **Type Handling**: Supports both string and numeric ID values (converts to string for comparison)
- **Format Validation**: Validates 18-19 digit numeric string format
- **Nested Structures**: Recursively scanning JSON in automation details
- **Lexical Mentions**: Detecting `custom-beautifulMention` nodes in Lexical editor content

### Cascading Suffix Inheritance

When duplicating stages with child entities:
1. Extract numeric suffix from parent's generated name (e.g., "Stage 001" → "001")
2. Optionally apply suffix to child tasks: "Task A" → "Task A 001"
3. Further cascade to parameters if enabled: "Parameter X" → "Parameter X 001"
4. Configurable prefix before suffix (e.g., "Copy " + suffix)

### Order Tree Management

When inserting copies, the tool:
1. Calculates new order tree values based on placement strategy
2. Optionally auto-shifts subsequent entities to maintain sequential numbering
3. Prevents gaps and duplicates in the order sequence
4. Handles multi-select with complex insertion patterns

## Accessibility

The application follows WCAG 2.1 AA guidelines:

- **Semantic HTML**: Proper use of `<header>`, `<nav>`, `<main>`, etc.
- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape, Arrow keys)
- **Focus Management**: Logical focus order and visible focus indicators
- **Screen Reader Support**: Announcements for state changes and errors
- **Color Contrast**: Meets AA standards for text and UI elements

## Performance Optimizations

- **React Context**: Eliminates prop drilling and unnecessary re-renders
- **useMemo/useCallback**: Memoization of expensive calculations
- **Debouncing**: For search and input operations
- **Lazy Loading**: Components loaded on demand
- **Error Boundaries**: Prevents full app crashes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Recent Enhancements

### Post-Phase 10 Features

**Multi-Select Entity Duplication** (v1.1.0)
- Select and duplicate multiple entities of the same type simultaneously
- Flexible ordering strategies: Interleaved (default) and Sequential
- Grouping strategies for sequential mode: Relative and Grouped
- Optimized for bulk operations with minimal user effort

**Advanced Naming Customization** (v1.2.0)
- Configurable starting number for naming sequences (not limited to starting from 1)
- Cascading suffix inheritance for child entities
- Optional prefix configuration for inherited suffixes
- Automatic numeric suffix extraction and propagation

**Actions & Effects Support** (v1.3.0)
- Full duplication support for checklist-level actions
- Automatic detection based on `triggerEntityId` matching duplicated tasks
- Lexical editor support for complex query structures:
  - SQL queries with parameter/task references
  - MongoDB queries with effect chaining
  - REST API endpoints and payloads
- Reference remapping for @t, @p, @e, @s mention patterns
- Handles numeric triggerEntityId values from MES backend

**Calculation Parameters Support** (v1.4.0)
- Full support for CALCULATION type parameters with variable reference remapping
- Smart detection of `taskId` and `parameterId` in `data.variables` object
- Internal/external reference classification based on task scope
- User-configurable component toggle in Step 3 Configure
- Leverages existing smart ID detection system (`isIdReference()`)
- Reference strategy support: keep or remove external variable references

**Enhanced Reference Remapping** (v1.0.1)
- Filters & Validations reference remapping for parameters
- Improved type handling for numeric ID fields
- More robust external reference detection
- Better error handling for edge cases

## Support

For issues and feature requests, please open an issue on [GitHub](https://github.com/yashasvi03/duplication-tool/issues).

---

**Generated with Claude Code** 🤖
