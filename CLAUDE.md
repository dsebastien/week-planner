# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MAIN RULES
- NEVER read or modify the TODO.md file
- I'm an expert, consult me for everything you're not certain about
- Always run `npm run serve` in the background
- **ALWAYS use Puppeteer or Playwright MCP to verify/test/troubleshoot anything you implement/change/fix** - check results, functionality, UI behavior, bugs, etc
- Read @./PROJECT_KNOWLEDGE.md to refresh your memory about the project
- Whenever you make changes, update/save PROJECT_KNOWLEDGE.md

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Watch mode**: `npm run watch` - Auto-compiles TypeScript on file changes
- **Serve**: `npm run serve` - Starts HTTP server on port 8080
- **Development**: `npm run dev` - Builds and serves the application
- **Test**: `npm run test` - Runs comprehensive unit tests

## Quick Reference

- **Project**: Visual week planner with TypeScript + Canvas
- **URL**: http://localhost:8080 when serving
- **Architecture**: Clean TypeScript with strict configuration
- **Key Files**: See PROJECT_KNOWLEDGE.md for complete documentation

## Development Notes

- Application uses full-page Canvas grid (06:00-24:00, Monday-Sunday)
- Time blocks snap to 30-minute grid intersections  
- All business rules enforced with validation
- 35 unit tests ensure code quality
- Export/import functionality with PNG, SVG, JSON formats
