/**
 * Main application controller for the week planner
 * Handles UI events and coordinates other components
 */
export declare class WeekPlanner {
    private readonly canvas;
    private readonly textInput;
    private readonly colorPicker;
    private renderer;
    private blockManager;
    private config;
    private mouseState;
    private previewBlock;
    private editingBlock;
    private resizeTimeout;
    constructor();
    /**
     * Initialize the application
     */
    private initialize;
    /**
     * Create initial configuration
     */
    private createInitialConfig;
    /**
     * Helper to get required DOM elements with error handling
     */
    private getRequiredElement;
    /**
     * Setup canvas dimensions and calculate grid layout
     */
    private setupCanvas;
    /**
     * Setup all event listeners
     */
    private setupEventListeners;
    /**
     * Setup menu toggle functionality
     */
    private setupMenuEvents;
    /**
     * Setup export and utility button events
     */
    private setupExportEvents;
    /**
     * Setup window resize and zoom handling
     */
    private setupWindowEvents;
    /**
     * Handle window resize with debouncing
     */
    private handleResize;
    /**
     * Get mouse position relative to canvas
     */
    private getMousePosition;
    /**
     * Get mouse position relative to canvas from document-level events
     */
    private getMousePositionFromDocument;
    /**
     * Update cursor based on mouse position
     */
    private updateCursor;
    /**
     * Handle mouse down events
     */
    private onMouseDown;
    /**
     * Handle mouse move events
     */
    private onMouseMove;
    /**
     * Handle mouse up events
     */
    private onMouseUp;
    /**
     * Handle mouse leave events from canvas
     */
    private onMouseLeave;
    /**
     * Handle document-level mouse move events (for tracking outside window)
     */
    private onDocumentMouseMove;
    /**
     * Handle document-level mouse up events (for releasing outside window)
     */
    private onDocumentMouseUp;
    /**
     * Handle double click events for text editing and block creation
     */
    private onDoubleClick;
    /**
     * Handle keyboard events
     */
    private onKeyDown;
    /**
     * Start creating a new block
     */
    private startBlockCreation;
    /**
     * Update block creation during drag
     */
    private updateBlockCreation;
    /**
     * Finish creating a block
     */
    private finishBlockCreation;
    /**
     * Create a single time block in the clicked cell (30-minute slot)
     */
    private createBlockInCell;
    /**
     * Clamp a point to grid boundaries to ensure it remains within valid area
     */
    private clampPointToGrid;
    /**
     * Determine which cell a point falls into (bulletproof cell detection)
     */
    private getCellFromPoint;
    /**
     * Reset mouse state
     */
    private resetMouseState;
    /**
     * Start editing a block's text
     */
    private startEditingBlock;
    /**
     * Stop editing a block's text
     */
    private stopEditingBlock;
    /**
     * Text input event handlers
     */
    private onTextInputBlur;
    private onTextInputKeyDown;
    /**
     * Generate a unique block ID
     */
    private generateBlockId;
    /**
     * Main render method
     */
    private render;
    /**
     * Export functionality
     */
    private exportSVG;
    private exportPNG;
    private exportJSON;
    private importJSON;
    /**
     * Clear all blocks with confirmation
     */
    private clearAll;
    /**
     * Utility methods
     */
    private downloadFile;
    private showError;
}
//# sourceMappingURL=week-planner.d.ts.map