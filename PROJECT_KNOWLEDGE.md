# Week Planner Project

## Project Overview
A visual week planning application built with TypeScript, HTML5 Canvas, and modern web technologies. The application allows users to create, edit, and manage time blocks across a weekly grid interface.

## Architecture

### Core Components
- **WeekPlanner** (`src/week-planner.ts`) - Main application controller handling UI events and coordination
- **TimeBlockManager** (`src/time-block-manager.ts`) - Manages time blocks with validation and overlap detection  
- **CanvasRenderer** (`src/canvas-renderer.ts`) - Handles all Canvas drawing operations and export functionality
- **GridUtils** (`src/grid-utils.ts`) - Utility functions for grid calculations, time formatting, and coordinate conversions

### Technology Stack
- **TypeScript** with strict configuration (no any types, comprehensive type safety)
- **HTML5 Canvas** for rendering the grid and time blocks
- **ES2020 modules** for clean module architecture
- **Node.js built-in test runner** for unit testing

## Key Features

### Grid System
- Time slots: 30-minute intervals from 06:00 to 24:00
- Days: Monday through Sunday
- Full viewport utilization with responsive design
- Precise grid snapping for time block placement

### Time Block Management
- Create blocks by clicking and dragging
- Automatic overlap prevention
- Duration validation (minimum 30 minutes, multiples of 30)
- Text editing via double-click
- Keyboard shortcuts (Delete/Backspace to remove, Escape to cancel editing)

### Export/Import System
- **PNG Export**: Canvas-based image export
- **SVG Export**: Vector-based export with proper styling
- **JSON Export/Import**: Complete data persistence with version compatibility

### UI/UX
- Dark theme with Inter font family
- Menu system (⋯ button) with organized options
- Visual feedback with preview blocks during creation
- Selection highlighting with dashed borders
- Responsive canvas resizing

## Business Rules
- Time blocks span 30 minutes to full week
- No overlapping blocks allowed
- Blocks must remain within grid boundaries
- Time blocks snap to 30-minute grid intersections

## Development Setup

### Scripts
```json
{
  "build": "tsc",
  "build:test": "tsc -p tsconfig.test.json", 
  "serve": "http-server -p 8080 .",
  "dev": "npm run build && npm run serve",
  "test": "npm run build:test && node --test tests-dist/tests/**/*.test.js"
}
```

### File Structure
```
src/
├── types.ts              # Domain types and interfaces
├── grid-utils.ts          # Grid calculations and utilities
├── time-block-manager.ts  # Time block state management
├── canvas-renderer.ts     # Canvas drawing and export
├── week-planner.ts        # Main application controller
└── main.ts               # Application entry point

tests/
├── grid-utils.test.ts     # Grid utility tests
└── time-block-manager.test.ts # Block management tests
```

## TypeScript Configuration

### Strict Settings
- `noImplicitAny: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- Complete type safety without any `any` types

### Domain Types
```typescript
interface TimeBlock {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly startTime: number; // minutes from 00:00
  readonly duration: number;  // minutes (multiple of 30)
  readonly daySpan: number;   // 1-7 days
  text: string;
  readonly color: string;     // hex format
  selected: boolean;
}

interface GridConfig {
  startHour: number;          // 6 for 06:00
  endHour: number;            // 24 for 00:00 (next day)
  timeSlotHeight: number;     // height in pixels for 30 minutes
  dayWidth: number;           // width in pixels for one day
  headerHeight: number;       // height for day labels
  timeColumnWidth: number;    // width for time labels
  days: readonly string[];
  canvasWidth: number;        // actual canvas width
  canvasHeight: number;       // actual canvas height
}

type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

## Testing
- **35 test cases** with 100% pass rate
- Comprehensive coverage of core functionality
- Unit tests for grid utilities, time block management, validation
- Result types for error handling testing

### Test Categories
1. **Grid Utilities**: Coordinate conversion, time formatting, validation
2. **Time Block Management**: CRUD operations, overlap detection, selection
3. **Data Persistence**: Export/import functionality with validation
4. **Boundary Testing**: Edge cases and error conditions

## Performance Considerations
- Efficient Canvas rendering with high-quality settings
- Event debouncing for window resize
- Immutable state management
- Proper memory cleanup

## Browser Compatibility
- Modern browsers supporting ES2020
- HTML5 Canvas API
- CSS Grid and Flexbox
- ES Modules

## Deployment
- Static file serving via http-server
- No backend dependencies
- Client-side only application
- Runs on port 8080 by default

## Key Implementation Patterns

### Error Handling
```typescript
// Result pattern for operations that can fail
const result = timeBlockManager.addBlock(block);
if (result.success) {
  // Handle success
} else {
  console.error(result.error.message);
}
```

### Event Management
```typescript
// Proper event listener setup with binding
this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
```

### State Management
```typescript
// Immutable updates
const updatedBlock: TimeBlock = { ...existingBlock, text: newText };
this.blocks.set(blockId, updatedBlock);
```

## Security Considerations
- Input validation on all user data
- Hex color format validation
- File size limits for import functionality
- XSS prevention in text content

## Key Lessons Learned
1. **Type Safety First**: Strict TypeScript configuration prevents runtime errors
2. **Separation of Concerns**: Each class has a single responsibility
3. **Validation is Critical**: Business rules must be enforced at the data layer
4. **Testing Pays Off**: Comprehensive tests catch edge cases early
5. **User Experience**: Visual feedback and keyboard shortcuts improve usability
6. **Clean Architecture**: Modular design makes code maintainable and testable

## Future Enhancement Ideas
- Drag and drop for moving existing blocks
- Block resizing handles
- Multiple color themes
- Recurring time blocks
- Calendar integration
- Collaboration features
- Mobile touch support optimization
- Undo/redo functionality
- Block templates
- Time zone support

## Development Best Practices Applied
- Strict TypeScript configuration
- Comprehensive unit testing
- Clean code architecture
- Proper error handling
- Type-safe event management
- Immutable state patterns
- Responsive design principles
- Accessibility considerations

This project demonstrates clean TypeScript architecture, comprehensive testing, and modern web development practices for a complex interactive Canvas application.

## Command Reference
```bash
# Development
npm run build        # Compile TypeScript
npm run serve        # Start HTTP server
npm run dev          # Build and serve

# Testing
npm run test         # Run all tests
npm run build:test   # Build test files

# Linting (if configured)
npm run lint         # Check code style
npm run typecheck    # Type checking only
```