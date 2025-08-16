import { GridConfig, TimeBlock, Point, ResizeHandle } from './types.js';
/**
 * Handles all Canvas drawing operations and export functionality
 */
export declare class CanvasRenderer {
    private readonly canvas;
    private readonly ctx;
    private config;
    private static readonly THEME;
    private static readonly FONTS;
    constructor(canvas: HTMLCanvasElement, config: GridConfig);
    /**
     * Main render method - draws the complete week planner
     */
    render(blocks: readonly TimeBlock[]): void;
    /**
     * Draws a preview block with transparency (used during drag operations)
     */
    drawPreviewBlock(block: TimeBlock): void;
    /**
     * Updates the configuration and triggers re-setup if needed
     */
    updateConfig(newConfig: GridConfig): void;
    /**
     * Exports the current canvas as SVG
     */
    exportSVG(blocks: readonly TimeBlock[]): string;
    /**
     * Clears the canvas with background color
     */
    private clear;
    /**
     * Sets up high-quality rendering options
     */
    private setupHighQualityRendering;
    /**
     * Draws the complete grid structure
     */
    private drawGrid;
    /**
     * Draws background areas for time column and header
     */
    private drawBackground;
    /**
     * Draws lighter background for lunch time (12:00-14:00)
     */
    private drawLunchTimeBackground;
    /**
     * Draws day headers
     */
    private drawDayHeaders;
    /**
     * Draws time labels in the left column
     */
    private drawTimeLabels;
    /**
     * Draws grid lines (vertical and horizontal)
     */
    private drawGridLines;
    /**
     * Draws separator lines for header and time column
     */
    private drawSeparators;
    /**
     * Draws all time blocks
     */
    private drawBlocks;
    /**
     * Draws a single time block
     */
    private drawBlock;
    /**
     * Draws block background with modern gradient effect
     */
    private drawBlockBackground;
    /**
     * Draws block border
     */
    private drawBlockBorder;
    /**
     * Draws selection highlight if block is selected
     */
    private drawBlockSelection;
    /**
     * Draws time information in the top-left corner of the block
     */
    private drawBlockTimeInfo;
    /**
     * Draws block text with automatic wrapping
     */
    private drawBlockText;
    /**
     * Draws text with automatic line wrapping
     */
    private drawWrappedText;
    /**
     * Utility methods for drawing basic shapes
     */
    private drawHorizontalLine;
    private drawVerticalLine;
    /**
     * Helper methods for block content layout
     */
    private getBlockTimeInfo;
    private getTextArea;
    /**
     * Color utility methods
     */
    private adjustColorBrightness;
    private getContrastColor;
    /**
     * Draws resize handles on selected blocks
     */
    private drawResizeHandles;
    /**
     * Gets resize handle positions for a block
     */
    private getResizeHandlePositions;
    /**
     * Checks if a point is over a resize handle
     */
    getResizeHandleAt(point: Point, block: TimeBlock): ResizeHandle | null;
    /**
     * Gets the appropriate cursor for a resize handle
     */
    getResizeCursor(handle: ResizeHandle): string;
    /**
     * SVG export helper methods
     */
    private createSVGRoot;
    private generateBackgroundSVG;
    private generateGridSVG;
    private generateBlockSVG;
    private escapeXml;
}
//# sourceMappingURL=canvas-renderer.d.ts.map