# Week Planner Project

## Project Overview
A visual week planning application built with TypeScript, HTML5 Canvas, and modern web technologies. The application allows users to create, edit, and manage time blocks across a weekly grid interface.

## Core Concepts
- **Week**: Monday to Sunday
- **Time Range**: 05:00 to 24:00 (23:30 last slot)
- **Time Slot**: 30-minute intervals
- **Time Block**: Activity with duration spanning one or more time slots

## Business Rules
- Time blocks span 30 minutes to the whole week
- Time blocks MUST NOT overlap
- Time blocks MUST remain within the grid boundaries (05:00-23:30)

## User Interface

### Grid System
- **Rows**: 30-minute time slots from 05:00 to 23:30
- **Columns**: Days (Monday through Sunday)
- **Layout**: Responsive design with optimal time slot height (minimum 20px)
- **Visual Features**: Lunch time highlighting (12:00-14:00), precise grid boundaries

### Interactions
- **Create**: Click/drag to create blocks, double-click for single 30-minute blocks
- **Edit**: Double-click blocks to edit text
- **Select**: Click to select, Ctrl+click for multi-selection
- **Resize**: Drag resize handles (only visible when exactly one block is selected)
- **Move**: Drag selected blocks to new positions
- **Context Menu**: Right-click for copy/paste operations

### Keyboard Shortcuts
- **Ctrl+A**: Select all blocks
- **Ctrl+Z**: Undo last operation
- **Ctrl+Y / Ctrl+Shift+Z**: Redo operation
- **Delete/Backspace**: Remove selected blocks
- **Escape**: Cancel editing or deselect all

### Menu & Templates
- **Main Menu**: Export (PNG, SVG, JSON), Import (JSON)
- **Quick Tools Panel**: Template placement (Work, Meeting, Break, Meal) with smart UI management
- **Templates**: 30-minute blocks with drag-to-place functionality

## Architecture

### Core Components
- **WeekPlanner** (`src/week-planner.ts`) - Main application controller
- **TimeBlockManager** (`src/time-block-manager.ts`) - Time block state management
- **CanvasRenderer** (`src/canvas-renderer.ts`) - Canvas drawing and export
- **GridUtils** (`src/grid-utils.ts`) - Grid calculations and utilities
- **UndoManager** (`src/undo-manager.ts`) - Undo/redo functionality
- **UIManager** (`src/ui-manager.ts`) - UI interactions and modals

### Technology Stack
- **TypeScript** with strict configuration (no any types)
- **HTML5 Canvas** for rendering
- **Tailwind CSS** for UI styling
- **ES2020 modules** served directly (no bundler)
- **Node.js test runner** for unit testing

## Domain Model

### TimeBlock Interface
```typescript
interface TimeBlock {
  readonly id: string;
  readonly startTime: number;        // minutes from 00:00
  readonly duration: number;         // minutes (multiple of 30)
  readonly startDay: number;         // 0 = Monday, 6 = Sunday
  readonly daySpan: number;          // 1-7 days
  text: string;
  readonly color: string;            // background color
  readonly textColor: HexColor;      // text color
  readonly fontSize: number;         // 8-48 pixels
  readonly fontStyle: FontStyle;
  readonly textAlignment: TextAlignment;
  readonly verticalAlignment: VerticalAlignment;
  readonly borderStyle: BorderStyle;
  readonly cornerRadius: number;     // 0-20 pixels
  selected: boolean;
}
```

### Key Features
- **Multi-Selection**: Ctrl+click selection with batch operations
- **Professional Styling Panel**: Color pickers, typography, alignment controls
- **Undo/Redo System**: 100 operation history with full TypeScript integration, including all operations (create, edit, move, resize, style changes, import, delete)
- **Export/Import**: PNG (A4 print-optimized), SVG, JSON, Markdown formats with multi-day block support
- **Template System**: Quick placement of common block types with clean UI (hides styling panel during placement)
- **Context Menus**: Right-click copy/paste for styles and blocks

## Development

### Build System
```json
{
  "build": "npm run build:css && tsc",
  "build:css": "tailwindcss -i ./src/input.css -o ./dist/output.css --watch=false",
  "watch": "npm run build:css && tsc --watch",
  "serve": "http-server -p 8088 .",
  "test": "npm run build:test && node --test tests-dist/tests/**/*.test.js"
}
```

### TypeScript Configuration
- **Strict Settings**: `noImplicitAny`, `noImplicitReturns`, `noUncheckedIndexedAccess`
- **ES Modules**: `.js` extensions in imports required for browser ES modules
- **Target**: ES2020 with ES2020 modules

### Testing
- **35+ test cases** with 100% pass rate
- **Categories**: Grid utilities, time block management, validation, boundary testing
- **Coverage**: CRUD operations, overlap detection, export/import functionality

## Key Implementation Patterns

### Logical Coordinates
```typescript
// Domain stores logical coordinates
interface TimeBlock {
  startDay: number;     // 0-6 (Monday-Sunday)
  startTime: number;    // minutes from 00:00
  duration: number;     // minutes (multiple of 30)
  daySpan: number;      // 1-7 days
}

// Rendering extends with pixel coordinates
interface RenderedTimeBlock extends TimeBlock {
  x: number;           // calculated pixel position
  y: number;           // calculated pixel position
  width: number;       // calculated pixel width
  height: number;      // calculated pixel height
}
```

### Error Handling
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

## Current Status (August 2025)

### ✅ Production Ready Features
- **Perfect Grid Boundaries**: Precise 05:00-23:30 interaction boundaries
- **Professional UI**: Tailwind CSS with glass morphism effects
- **Complete Functionality**: Create, edit, resize, move, style, export/import
- **Robust Validation**: Business rules enforced at all levels
- **Comprehensive Testing**: All tests passing, zero known bugs
- **MIT Licensed**: Open source ready

### ✅ Latest Enhancements
- **Template Drag-to-Place System**: Mouse-following templates with 30-minute defaults
- **Functional Undo/Redo**: Complete history management with header buttons
- **Enhanced UI**: Cleaned up interface focusing on working functionality
- **Text Rendering**: Systematic text rendering without workarounds
- **Context Menus**: Professional right-click workflows
- **Smart Positioning**: Intelligent styling panel placement

### Technical Excellence
- **Zero `any` types**: Complete TypeScript type safety
- **Clean Architecture**: Modular design with single responsibilities
- **Performance Optimized**: Efficient Canvas rendering and memory management
- **Browser Compatible**: Modern ES2020 with high compatibility
- **Deployment Ready**: Static files served via http-server on port 8088

This project demonstrates modern web development best practices with a complete, production-ready week planning application.