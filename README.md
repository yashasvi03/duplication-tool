# MES Duplication Tool

A standalone React + TypeScript web application for duplicating stages, tasks, or parameters in Manufacturing Execution System (MES) workflows.

## Features

- **5-Step Workflow**: Upload → Select → Configure → Preview → Download
- **Entity Duplication**: Duplicate stages, tasks, or parameters with intelligent ID remapping
- **Smart Reference Handling**: Internal references are remapped, external references can be kept or removed
- **Live Preview**: See exactly what will be created before execution
- **Flexible Configuration**:
  - Create 1-100 copies
  - Custom naming patterns with variables
  - Zero-padding support
  - Component selection (automations, parameters, rules)
  - Placement options (before/after/start/end)
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

Browse the hierarchical tree view to select:
- **Stages**: Duplicate entire workflow stages
- **Tasks**: Duplicate tasks within a stage
- **Parameters**: Duplicate individual parameters

Features:
- Expandable/collapsible tree
- Search functionality
- Entity details panel
- Count badges (shows number of sub-entities)

### Step 3: Configure Duplication Options

Configure how duplication should work:
- **Number of Copies**: 1-100
- **Naming Pattern**: Use variables like `{basename}`, `{number}`, `{order}`
- **Components**: Select which components to include
- **External References**: Keep or remove references to entities outside the scope
- **Placement**: Where to insert copies (before/after/start/end)

### Step 4: Preview Changes

Review what will be created:
- Summary statistics (tasks, parameters, automations, rules)
- Name preview for all copies
- Order tree changes
- Warnings and validation messages

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

The duplication engine intelligently handles references:

- **Internal References**: IDs within the selected scope are remapped to new copies
- **External References**: IDs outside the scope are kept or removed based on user preference

Example: When duplicating a task that references a parameter in the same task, the reference is automatically updated to point to the duplicated parameter.

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
3. **Traverse and remap**: Recursively traverse all objects and remap references

### Reference Detection

The tool detects ID references by:
- Checking field names that typically contain IDs (`parameterId`, `taskId`, etc.)
- Validating the value format (18-19 digit numeric string)
- Recursively scanning nested JSON structures in automation details

### Order Tree Management

When inserting copies, the tool:
1. Calculates new order tree values based on placement strategy
2. Optionally auto-shifts subsequent entities to maintain sequential numbering
3. Prevents gaps and duplicates in the order sequence

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

## Support

For issues and feature requests, please open an issue on [GitHub](https://github.com/yashasvi03/duplication-tool/issues).

---

**Generated with Claude Code** 🤖
