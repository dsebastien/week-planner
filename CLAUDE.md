# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MAIN RULES
- I'm an expert, consult me for everything you're not certain about
- In doubt, ask me questions about the desired behavior
- Always run `npm run serve` in the background
- Use Puppeteer via the Dockmaster MCP server to check the results, see if everything works correctly, understand issues, bugs, etc

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Watch mode**: `npm run watch` - Auto-compiles TypeScript on file changes
- **Serve**: `npm run serve` - Starts HTTP server on port 8080
- **Development**: `npm run dev` - Builds and serves the application

## Overview
This is a visual week planning creator.

## Main concepts
- Week: Monday to Sunday
- Hours: 06:00 to 24:00
- Time slot: Hours split in 30 minute time slots
- Time block: time to spend on some activity

## Business rules
- Time blocks can span from 30 minutes to the whole week
- Time blocks MUST NOT overlap each other
- Time blocks MUST remain within the grid

## User interface
The UI is a grid on a Canvas with:
- Rows: Time slots (one line = 30 minutes)
- Same height for all rows
- Columns: Days
- Same width for all columns
- Hours/Time displayed using HH:mm

Behavior:
- Clicking on an empty cell in the grid creates a time block
- Clicking and dragging in the grid creates a time block that can span over multiple time slots/days
- Time blocks snap to grid

## Domain model
Time blocks:
- id
- X position
- Y position
- Start time
- Duration
- Day span (number of days: 1-7)
- Text
- Color (string)
- Selected (boolean)

## Architecture Overview
This is a TypeScript-based Canvas week planner application with a modular architecture:

### Core Classes

- **WeekPlanner** (`src/week-planner.ts`) - Main application controller, handles UI events and coordinates other components
- **TimeBlockManager** (`src/time-block-manager.ts`) - Manages time blocks data, validation, and overlap detection
- **CanvasRenderer** (`src/canvas-renderer.ts`) - Handles all Canvas drawing operations and SVG export
- **GridUtils** (`src/grid-utils.ts`) - Utility functions for grid calculations, time formatting, and coordinate conversions

### Application Flow

1. **Initialization**: `main.ts` bootstraps the WeekPlanner on DOM ready
2. **Event Handling**: WeekPlanner manages mouse/keyboard events for creating, selecting, and editing blocks
3. **Block Management**: TimeBlockManager validates blocks and prevents overlaps
4. **Rendering**: CanvasRenderer draws the grid and blocks on HTML5 Canvas
5. **Export**: Supports PNG (Canvas) and SVG export functionality

### File Structure

- `src/main.ts` - Entry point
- `src/types.ts` - TypeScript interfaces
- `src/week-planner.ts` - Main application logic
- `src/time-block-manager.ts` - Block state management
- `src/canvas-renderer.ts` - Drawing and export
- `src/grid-utils.ts` - Grid calculations
- `index.html` - Complete HTML with embedded CSS
- `tsconfig.json` - TypeScript configuration targeting ES2020
