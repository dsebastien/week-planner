# Changelog

All notable changes to the Week Planner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions
- ESLint configuration for code quality checks
- Automated deployment to GitHub Pages
- Release workflow with version management
- CHANGELOG.md for tracking version history

## [1.0.0] - 2025-08-01

### Initial Release
- Visual week planning application with TypeScript and Canvas
- Grid system with 30-minute time slots (05:00-23:30)
- Create, edit, move, and resize time blocks
- Multi-selection support with Ctrl+click
- Professional styling panel with colors, fonts, and alignments
- Undo/redo system with 100 operation history
- Export functionality (PNG, SVG, JSON, Markdown)
- Import functionality with JSON and Markdown support
- Template system for quick block placement
- Context menus for copy/paste operations
- Keyboard shortcuts for common operations
- Responsive design with Tailwind CSS
- Comprehensive unit test suite

### Features
- **Time Management**: Monday to Sunday weekly view with 30-minute intervals
- **Business Rules**: Enforced non-overlapping blocks within grid boundaries
- **Export Options**: A4 print-optimized PNG, scalable SVG, data formats
- **Styling Options**: Colors, typography, borders, alignments, corner radius
- **Smart UI**: Automatic panel positioning, template drag-to-place
- **Professional UI**: Glass morphism effects, clean modern design

### Technical
- TypeScript with strict configuration (zero `any` types)
- ES2020 modules served directly without bundler
- HTML5 Canvas for rendering
- Tailwind CSS for UI styling
- Node.js test runner for unit testing
- MIT License