# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Watch mode**: `npm run watch` - Auto-compiles TypeScript on file changes
- **Serve**: `npm run serve` - Starts HTTP server on port 8080
- **Development**: `npm run dev` - Builds and serves the application

## Architecture Overview

This is a TypeScript-based Canvas week planner application with a modular architecture:

### Core Classes

- **WeekPlanner** (`src/week-planner.ts`) - Main application controller, handles UI events and coordinates other components
- **TimeBlockManager** (`src/time-block-manager.ts`) - Manages time blocks data, validation, and overlap detection
- **CanvasRenderer** (`src/canvas-renderer.ts`) - Handles all Canvas drawing operations and SVG export
- **GridUtils** (`src/grid-utils.ts`) - Utility functions for grid calculations, time formatting, and coordinate conversions

### Key Interfaces

- **TimeBlock** - Represents a scheduled time block with position, duration, text, and color
- **GridConfig** - Configuration for grid layout (time slots, day width, etc.)
- **Point** - Simple x,y coordinate representation

### Application Flow

1. **Initialization**: `main.ts` bootstraps the WeekPlanner on DOM ready
2. **Event Handling**: WeekPlanner manages mouse/keyboard events for creating, selecting, and editing blocks
3. **Block Management**: TimeBlockManager validates blocks and prevents overlaps
4. **Rendering**: CanvasRenderer draws the grid and blocks on HTML5 Canvas
5. **Export**: Supports PNG (Canvas) and SVG export functionality

### Grid System

- Work week: Monday-Friday, 6:00-24:00
- 30-minute time slots (20px height)
- 140px day width, 80px time column
- Blocks snap to grid and can span 1-5 days
- Overlap prevention enforced in TimeBlockManager

### File Structure

- `src/main.ts` - Entry point
- `src/types.ts` - TypeScript interfaces
- `src/week-planner.ts` - Main application logic
- `src/time-block-manager.ts` - Block state management
- `src/canvas-renderer.ts` - Drawing and export
- `src/grid-utils.ts` - Grid calculations
- `index.html` - Complete HTML with embedded CSS
- `tsconfig.json` - TypeScript configuration targeting ES2020