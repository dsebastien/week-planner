import { 
    TimeBlock, 
    RenderedTimeBlock,
    GridConfig, 
    Point, 
    MouseState, 
    ValidationError,
    HexColor,
    WeekPlannerData,
    ResizeHandle,
    FontStyle,
    BorderStyle,
    TextAlignment,
    VerticalAlignment
} from './types.js';
import { GridUtils } from './grid-utils.js';
import { TimeBlockManager } from './time-block-manager.js';
import { CanvasRenderer } from './canvas-renderer.js';
import { UIManager } from './ui-manager.js';
import { UndoManager } from './undo-manager.js';

/**
 * Main application controller for the week planner
 * Handles UI events and coordinates other components
 */
export class WeekPlanner {
    private readonly canvas: HTMLCanvasElement;
    private readonly textInput: HTMLInputElement;
    
    private renderer: CanvasRenderer;
    public blockManager: TimeBlockManager;
    public uiManager: UIManager;
    private config: GridConfig;
    
    private mouseState: MouseState = {
        isDown: false,
        startPoint: null,
        currentPoint: null,
        isDragging: false,
        resizing: false,
        moving: false,
        movingBlockIds: [],
        originalBlockPositions: null,
        resizeHandle: null,
        resizeBlockId: null,
        originalBlock: null
    };
    
    private previewBlock: RenderedTimeBlock | null = null;
    private movingPreviewBlocks: RenderedTimeBlock[] = [];
    private editingBlock: RenderedTimeBlock | null = null;
    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    private highlightedCell: { day: number; timeMinutes: number } | null = null;
    private resizeOriginalState: { startDay: number; startTime: number; duration: number; daySpan: number } | null = null;
    
    // Template placement mode
    private templatePlacementMode: boolean = false;
    private templatePlacementData: TimeBlock | null = null;

    constructor() {
        // Initialize DOM elements
        this.canvas = this.getRequiredElement('weekCanvas') as HTMLCanvasElement;
        this.textInput = this.getRequiredElement('textInput') as HTMLInputElement;
        
        // Initialize configuration
        this.config = this.createInitialConfig();
        
        // Initialize components
        this.blockManager = new TimeBlockManager(this.config);
        this.renderer = new CanvasRenderer(this.canvas, this.config);
        this.uiManager = new UIManager();
        
        // Setup and start
        this.initialize();
    }

    /**
     * Initialize the application
     */
    private initialize(): void {
        this.setupCanvas();
        this.setupEventListeners();
        this.render();
    }

    /**
     * Create initial configuration
     */
    private createInitialConfig(): GridConfig {
        return {
            startHour: 5,
            endHour: 24,
            timeSlotHeight: 24,
            dayWidth: 140,
            headerHeight: 60,
            timeColumnWidth: 120,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            canvasWidth: window.innerWidth,
            canvasHeight: window.innerHeight
        };
    }

    /**
     * Helper to get required DOM elements with error handling
     */
    private getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required element with ID '${id}' not found`);
        }
        return element;
    }

    /**
     * Setup canvas dimensions and calculate grid layout
     */
    private setupCanvas(): void {
        const containerWidth = window.innerWidth;
        
        // Calculate exact height needed for the grid
        const totalHours = this.config.endHour - this.config.startHour; // 18 hours (6:00 to 24:00)
        const totalSlots = totalHours * 2; // 36 slots (30-minute intervals)
        
        // Calculate optimal time slot height based on available screen space
        const availableScreenHeight = window.innerHeight - this.config.headerHeight - 40; // 40px buffer for browser UI
        const optimalSlotHeight = Math.max(20, Math.floor(availableScreenHeight / totalSlots));
        
        // Calculate exact canvas height needed (no extra space below 00:00)
        const exactCanvasHeight = this.config.headerHeight + totalSlots * optimalSlotHeight;
        
        // Set canvas size
        this.canvas.width = containerWidth;
        this.canvas.height = exactCanvasHeight;
        this.canvas.style.width = `${containerWidth}px`;
        this.canvas.style.height = `${exactCanvasHeight}px`;
        
        // Calculate grid dimensions
        const availableWidth = containerWidth - this.config.timeColumnWidth;
        
        // Update configuration with calculated values
        this.config.dayWidth = availableWidth / this.config.days.length;
        this.config.timeSlotHeight = optimalSlotHeight;
        this.config.canvasWidth = containerWidth;
        this.config.canvasHeight = exactCanvasHeight;
        
        // Update components with new configuration
        this.blockManager.updateConfig(this.config);
        this.renderer.updateConfig(this.config);
    }

    /**
     * Setup all event listeners
     */
    private setupEventListeners(): void {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));

        // Document-level events for tracking mouse outside window during drag
        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
        document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));

        // Text input events
        this.textInput.addEventListener('blur', this.onTextInputBlur.bind(this));
        this.textInput.addEventListener('keydown', this.onTextInputKeyDown.bind(this));

        // Menu and export events
        this.setupMenuEvents();
        this.setupExportEvents();

        // Window events
        this.setupWindowEvents();
    }

    /**
     * Setup menu toggle functionality
     */
    private setupMenuEvents(): void {
        // The sidebar functionality is now handled in the HTML script section
        // No additional JavaScript needed here as it's handled directly
    }

    /**
     * Setup export and utility button events
     */
    private setupExportEvents(): void {
        document.getElementById('exportSVG')?.addEventListener('click', () => this.exportSVG());
        document.getElementById('exportPNG')?.addEventListener('click', () => this.exportPNG());
        document.getElementById('exportJSON')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('exportMarkdown')?.addEventListener('click', () => this.exportMarkdown());
        document.getElementById('importJSON')?.addEventListener('click', () => this.importJSON());
        document.getElementById('importMarkdown')?.addEventListener('click', () => this.importMarkdown());
        document.getElementById('clearAll')?.addEventListener('click', () => this.clearAll());
    }

    /**
     * Setup window resize handling
     */
    private setupWindowEvents(): void {
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle window resize with debouncing
     */
    private handleResize(): void {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.setupCanvas();
            this.render();
        }, 100);
    }

    /**
     * Get mouse position relative to canvas
     */
    private getMousePosition(event: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Get mouse position relative to canvas from document-level events
     */
    private getMousePositionFromDocument(event: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Update cursor based on mouse position
     */
    private updateCursor(x: number, y: number): void {
        if (!GridUtils.isInGridArea(x, y, this.config)) {
            this.canvas.classList.remove('creating', 'pointer');
            this.canvas.style.cursor = 'default';
            return;
        }

        const block = this.blockManager.getBlockAt(x, y);
        if (block && block.selected) {
            // Check for resize handles first (only show resize handles for single selection)
            const selectedCount = this.blockManager.getSelectedBlockCount();
            if (selectedCount === 1) {
                const resizeHandle = this.renderer.getResizeHandleAt({ x, y }, block);
                if (resizeHandle) {
                    this.canvas.classList.remove('creating', 'pointer');
                    this.canvas.style.cursor = this.renderer.getResizeCursor(resizeHandle);
                    return;
                }
            }
        }

        if (block) {
            this.canvas.classList.remove('creating');
            this.canvas.classList.add('pointer');
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.classList.remove('pointer');
            this.canvas.classList.add('creating');
            this.canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * Handle mouse down events
     */
    private onMouseDown(event: MouseEvent): void {
        // Only handle left mouse button for drag operations
        // Right-clicks should only trigger context menu, not create blocks
        if (event.button !== 0) {
            return;
        }
        
        const point = this.getMousePosition(event);
        
        // Handle template placement mode
        if (this.templatePlacementMode) {
            // Only handle clicks in the grid area
            if (GridUtils.isInGridArea(point.x, point.y, this.config)) {
                this.placeTemplate();
            }
            return;
        }
        
        // Only handle clicks in the grid area
        if (!GridUtils.isInGridArea(point.x, point.y, this.config)) {
            return;
        }

        const clickedBlock = this.blockManager.getBlockAt(point.x, point.y);
        
        // Check for resize handle on selected block (only for single selection)
        if (clickedBlock && clickedBlock.selected && this.blockManager.getSelectedBlockCount() === 1) {
            const resizeHandle = this.renderer.getResizeHandleAt(point, clickedBlock);
            if (resizeHandle) {
                this.mouseState = {
                    isDown: true,
                    startPoint: point,
                    currentPoint: point,
                    isDragging: false,
                    resizing: true,
                    moving: false,
                    movingBlockIds: [],
                    originalBlockPositions: null,
                    resizeHandle,
                    resizeBlockId: clickedBlock.id,
                    originalBlock: { ...clickedBlock }
                };
                
                // Store original state for undo
                this.resizeOriginalState = {
                    startDay: clickedBlock.startDay,
                    startTime: clickedBlock.startTime,
                    duration: clickedBlock.duration,
                    daySpan: clickedBlock.daySpan
                };
                
                // Hide styling panel during resize to prevent interference
                if ((window as any).editToolbar) {
                    (window as any).editToolbar.hide();
                }
                
                this.render();
                return;
            }
        }

        if (clickedBlock) {
            // Clicking on any block - handle selection and prepare for potential move operation
            if (event.ctrlKey || event.metaKey) {
                // Multi-selection toggle
                this.blockManager.toggleBlockSelection(clickedBlock.id);
                this.updateToolbarForMultiSelection();
            } else if (!clickedBlock.selected) {
                // Select the clicked block if not already selected
                this.handleSelectionChange(clickedBlock.id);
            }
            
            // Get all currently selected blocks (after potential selection change)
            const selectedBlocks = this.blockManager.getSelectedBlocks();
            const originalPositions = new Map<string, { startDay: number; startTime: number }>();
            
            for (const block of selectedBlocks) {
                originalPositions.set(block.id, {
                    startDay: block.startDay,
                    startTime: block.startTime
                });
            }
            
            this.mouseState = {
                isDown: true,
                startPoint: point,
                currentPoint: point,
                isDragging: false,
                resizing: false,
                moving: false,
                movingBlockIds: selectedBlocks.map(b => b.id),
                originalBlockPositions: originalPositions,
                resizeHandle: null,
                resizeBlockId: null,
                originalBlock: null
            };
            
            // Clear any existing preview block when preparing to move
            this.previewBlock = null;
        } else {
            // Clicking on empty space - start block creation
            this.mouseState = {
                isDown: true,
                startPoint: point,
                currentPoint: point,
                isDragging: false,
                resizing: false,
                moving: false,
                movingBlockIds: [],
                originalBlockPositions: null,
                resizeHandle: null,
                resizeBlockId: null,
                originalBlock: null
            };

            this.handleSelectionChange(null);
            this.startBlockCreation(point);
        }
        
        this.render();
    }

    /**
     * Handle mouse move events
     */
    private onMouseMove(event: MouseEvent): void {
        const point = this.getMousePosition(event);
        this.mouseState = { ...this.mouseState, currentPoint: point };
        
        // Handle template placement mode
        if (this.templatePlacementMode) {
            this.updateTemplatePreview();
            return;
        }

        // Update cursor if not dragging or resizing
        if (!this.mouseState.isDragging && !this.mouseState.resizing) {
            this.updateCursor(point.x, point.y);
        }

        // Handle resize operation
        if (this.mouseState.isDown && this.mouseState.resizing && this.mouseState.resizeBlockId) {
            this.updateResize(point);
            return;
        }

        // Handle block moving operation (highest priority after resize)
        if (this.mouseState.isDown && this.mouseState.movingBlockIds.length > 0) {
            this.updateBlockMove(point);
            return; // Early return to prevent any other operations
        }

        // Handle block creation dragging (only if no other operation is active)
        if (this.mouseState.isDown && this.mouseState.startPoint && 
            !this.mouseState.resizing && 
            !this.mouseState.moving && 
            this.mouseState.movingBlockIds.length === 0) {
            this.updateBlockCreation(point);
        }
    }

    /**
     * Handle mouse up events
     */
    private onMouseUp(): void {
        if (this.mouseState.resizing && this.mouseState.resizeBlockId && this.resizeOriginalState) {
            // Resize operation is finished - create undo operation
            const currentBlock = this.blockManager.getBlock(this.mouseState.resizeBlockId);
            if (currentBlock) {
                const blockId = this.mouseState.resizeBlockId;
                const originalState = this.resizeOriginalState;
                const finalState = {
                    startDay: currentBlock.startDay,
                    startTime: currentBlock.startTime,
                    duration: currentBlock.duration,
                    daySpan: currentBlock.daySpan
                };
                
                // Only create undo operation if the block actually changed
                if (originalState.startDay !== finalState.startDay || 
                    originalState.startTime !== finalState.startTime ||
                    originalState.duration !== finalState.duration ||
                    originalState.daySpan !== finalState.daySpan) {
                    
                    const operation = UndoManager.createOperation(
                        'resize',
                        `Resize block: ${currentBlock.text || 'Untitled'}`,
                        () => {
                            // Undo: restore original state
                            this.blockManager.resizeBlockLogical(blockId, originalState.startDay, originalState.startTime, originalState.duration, originalState.daySpan);
                        },
                        () => {
                            // Redo: restore final state
                            this.blockManager.resizeBlockLogical(blockId, finalState.startDay, finalState.startTime, finalState.duration, finalState.daySpan);
                        }
                    );
                    this.blockManager.undoManager.addOperation(operation);
                }
            }
            
            // Clear resize state
            this.resizeOriginalState = null;
        } else if (this.mouseState.moving && this.mouseState.movingBlockIds.length > 0) {
            this.finishBlockMove();
        } else if (this.mouseState.isDragging && this.previewBlock) {
            this.finishBlockCreation();
        }

        this.resetMouseState();
        this.render();
    }

    /**
     * Handle mouse leave events from canvas
     */
    private onMouseLeave(): void {
        // Don't reset mouse state if we're in the middle of dragging
        // Document-level events will handle the rest
        if (!this.mouseState.isDragging) {
            this.resetMouseState();
            this.render();
        }
    }

    /**
     * Handle document-level mouse move events (for tracking outside window)
     */
    private onDocumentMouseMove(event: MouseEvent): void {
        // Only handle if we're currently dragging
        if (!this.mouseState.isDragging || !this.mouseState.startPoint) {
            return;
        }

        const point = this.getMousePositionFromDocument(event);
        this.updateBlockCreation(point);
    }

    /**
     * Handle document-level mouse up events (for releasing outside window)
     */
    private onDocumentMouseUp(): void {
        // Only handle if we're currently dragging
        if (!this.mouseState.isDragging) {
            return;
        }

        if (this.previewBlock) {
            this.finishBlockCreation();
        }

        this.resetMouseState();
        this.render();
    }

    /**
     * Handle double click events for text editing and block creation
     */
    private onDoubleClick(event: MouseEvent): void {
        const point = this.getMousePosition(event);
        
        // Only handle double clicks in the grid area
        if (!GridUtils.isInGridArea(point.x, point.y, this.config)) {
            return;
        }
        
        const clickedBlock = this.blockManager.getBlockAt(point.x, point.y);
        
        if (clickedBlock) {
            // Edit existing block
            this.startEditingBlock(clickedBlock);
        } else {
            // Create new block in the cell
            this.createBlockInCell(point);
        }
    }

    /**
     * Handle right-click context menu events
     */
    private onContextMenu(event: MouseEvent): void {
        event.preventDefault(); // Prevent default browser context menu
        
        const point = this.getMousePosition(event);
        
        // Only handle right clicks in the grid area
        if (!GridUtils.isInGridArea(point.x, point.y, this.config)) {
            return;
        }
        
        const clickedBlock = this.blockManager.getBlockAt(point.x, point.y);
        const contextMenuSystem = (window as any).contextMenuSystem;
        
        if (!contextMenuSystem) {
            console.warn('Context menu system not available');
            return;
        }
        
        if (clickedBlock) {
            // Right-clicked on a block - show block context menu
            const menuItems = [
                {
                    label: 'Copy Style',
                    disabled: false,
                    action: () => contextMenuSystem.copyBlockStyle(clickedBlock)
                },
                {
                    label: 'Paste Style',
                    disabled: !contextMenuSystem.hasCopiedStyle(),
                    action: () => {
                        this.blockManager.selectBlock(clickedBlock.id);
                        contextMenuSystem.pasteBlockStyle(clickedBlock);
                    }
                },
                {
                    label: this.blockManager.getSelectedBlockCount() > 1 ? `Copy ${this.blockManager.getSelectedBlockCount()} blocks` : 'Copy',
                    disabled: false,
                    action: () => contextMenuSystem.copyBlock(clickedBlock)
                }
            ];
            
            contextMenuSystem.showContextMenu(event.clientX, event.clientY, menuItems);
        } else {
            // Right-clicked on empty cell - show cell context menu
            const day = GridUtils.getDayFromX(point.x, this.config);
            const timeMinutes = GridUtils.getTimeFromY(point.y, this.config);
            
            if (day < 0 || day > 6 || !GridUtils.isValidTime(timeMinutes, this.config)) {
                return;
            }
            
            // Highlight the target cell
            this.highlightedCell = { day, timeMinutes };
            this.render(); // Re-render to show highlight
            
            const menuItems = [
                {
                    label: contextMenuSystem.getCopiedBlockCount() > 1 ? `Paste ${contextMenuSystem.getCopiedBlockCount()} blocks` : 'Paste',
                    disabled: !contextMenuSystem.hasCopiedBlock(),
                    action: () => {
                        contextMenuSystem.pasteBlock(day, timeMinutes);
                        this.clearCellHighlight();
                    }
                },
                {
                    label: 'Create time block',
                    disabled: false,
                    action: () => {
                        this.createBlockInCell(point);
                        this.clearCellHighlight();
                    }
                }
            ];
            
            contextMenuSystem.showContextMenu(event.clientX, event.clientY, menuItems);
        }
    }

    /**
     * Clear cell highlighting
     */
    public clearCellHighlight(): void {
        if (this.highlightedCell) {
            this.highlightedCell = null;
            this.render(); // Re-render to remove highlight
        }
    }

    /**
     * Handle keyboard events
     */
    private onKeyDown(event: KeyboardEvent): void {
        // Handle Ctrl+Z for undo
        if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            if (this.blockManager.undoManager.undo()) {
                this.render();
            }
            return;
        }
        
        // Handle Ctrl+Y for redo (or Ctrl+Shift+Z)
        if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
            event.preventDefault();
            if (this.blockManager.undoManager.redo()) {
                this.render();
            }
            return;
        }
        
        // Handle Ctrl+I for JSON import
        if (event.ctrlKey && event.key === 'i') {
            event.preventDefault();
            this.importJSON();
            return;
        }
        
        // Handle Ctrl+O for JSON export
        if (event.ctrlKey && event.key === 'o') {
            event.preventDefault();
            this.exportJSON();
            return;
        }
        
        // Handle Ctrl+A for select all
        if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            const allBlockIds = this.blockManager.getBlocks().map(block => block.id);
            this.blockManager.selectBlocks(allBlockIds);
            this.updateToolbarForMultiSelection();
            this.render();
            return;
        }
        
        // Handle Ctrl+C for copy selected blocks
        if (event.ctrlKey && event.key === 'c') {
            event.preventDefault();
            const selectedBlocks = this.blockManager.getSelectedBlocks();
            if (selectedBlocks.length > 0) {
                // Copy all selected blocks using the first selected block as reference
                const firstBlock = selectedBlocks[0];
                if (firstBlock) {
                    this.uiManager.copyBlock(firstBlock);
                }
            }
            return;
        }
        
        // Handle Ctrl+V for paste at current mouse location
        if (event.ctrlKey && event.key === 'v') {
            event.preventDefault();
            if (this.uiManager.hasCopiedBlock()) {
                let pastePoint = this.mouseState.currentPoint;
                
                // If no current mouse position, use center of canvas
                if (!pastePoint) {
                    const rect = this.canvas.getBoundingClientRect();
                    pastePoint = {
                        x: rect.width / 2,
                        y: rect.height / 2
                    };
                }
                
                // Get the cell at paste position
                const cell = this.getCellFromPoint(pastePoint);
                if (cell) {
                    this.uiManager.pasteBlock(cell.dayIndex, cell.startTime);
                    this.render();
                }
            }
            return;
        }
        
        // Handle Escape to cancel template placement or deselect all
        if (event.key === 'Escape') {
            if (this.templatePlacementMode) {
                this.cancelTemplatePlacement();
                return;
            } else if (!this.editingBlock) {
                this.blockManager.clearSelection();
                this.updateToolbarForMultiSelection();
                this.render();
                return;
            }
        }
        
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (!this.editingBlock) {
                const selectedCount = this.blockManager.getSelectedBlockCount();
                if (selectedCount > 0) {
                    this.blockManager.removeSelectedBlocksWithUndo();
                    // Hide toolbar when blocks are deleted
                    if ((window as any).editToolbar) {
                        (window as any).editToolbar.hide();
                    }
                    this.render();
                }
            }
        } else if (event.key === 'Escape') {
            this.stopEditingBlock();
        }
    }

    /**
     * Start creating a new block
     */
    private startBlockCreation(point: Point): void {
        this.mouseState = {
            ...this.mouseState,
            isDragging: true
        };
    }

    /**
     * Update block creation during drag
     */
    private updateBlockCreation(currentPoint: Point): void {
        if (!this.mouseState.startPoint) return;
        
        // Prevent block creation if we're in a move operation
        if (this.mouseState.movingBlockIds.length > 0 || this.mouseState.moving) {
            return;
        }

        this.mouseState = {
            ...this.mouseState,
            currentPoint,
            isDragging: true
        };

        // Use bulletproof cell detection for start point
        const startCell = this.getCellFromPoint(this.mouseState.startPoint!);
        if (!startCell) return; // Start point must be valid

        // Clamp current point to grid boundaries for smooth dragging experience
        const clampedCurrentPoint = this.clampPointToGrid(currentPoint);
        const endCell = this.getCellFromPoint(clampedCurrentPoint);
        
        if (!endCell) {
            return; // This should not happen with clamped point, but safety check
        }

        // Calculate block dimensions using cell-based approach
        // Calculate logical properties first (source of truth)
        const startDay = Math.min(startCell.dayIndex, endCell.dayIndex);
        const maxDay = Math.max(startCell.dayIndex, endCell.dayIndex);
        const daySpan = maxDay - startDay + 1;
        const startTime = Math.min(startCell.startTime, endCell.startTime);
        
        // Calculate duration based on drag area
        const minY = Math.min(startCell.y, endCell.y);
        const maxY = Math.max(startCell.y, endCell.y);
        const dragHeight = Math.max(this.config.timeSlotHeight, maxY - minY + this.config.timeSlotHeight);
        const duration = GridUtils.getDurationInMinutes(dragHeight, this.config);
        
        // Clamp duration if it would exceed valid time range
        const endTime = startTime + duration;
        const maxValidTime = this.config.endHour * 60; // 24:00 in minutes
        const clampedDuration = endTime > maxValidTime ? 
            Math.max(30, maxValidTime - startTime) : // Minimum 30 minutes, but don't exceed valid range
            duration;
        
        const defaultStyling = this.getDefaultStyling();
        
        // Create domain TimeBlock (without pixel coordinates)
        const domainBlock: TimeBlock = {
            id: 'preview',
            startTime,
            duration: clampedDuration,
            startDay,
            daySpan,
            text: '',
            color: '#e5007d',
            textColor: defaultStyling.textColor,
            fontSize: defaultStyling.fontSize,
            fontStyle: defaultStyling.fontStyle,
            textAlignment: defaultStyling.textAlignment,
            verticalAlignment: defaultStyling.verticalAlignment,
            borderStyle: defaultStyling.borderStyle,
            cornerRadius: defaultStyling.cornerRadius,
            selected: false
        };

        // Calculate pixel properties for rendering
        const { x, y, width, height } = GridUtils.calculateBlockPixelProperties(
            startDay, startTime, clampedDuration, daySpan, this.config
        );
        
        // Create preview block with calculated pixel positions
        this.previewBlock = {
            ...domainBlock,
            x,
            y,
            width,
            height
        };

        this.render();
    }

    /**
     * Finish creating a block
     */
    private finishBlockCreation(): void {
        if (!this.previewBlock) return;

        // Create domain TimeBlock (without pixel coordinates)
        const block: TimeBlock = {
            id: this.generateBlockId(),
            startTime: this.previewBlock.startTime,
            duration: this.previewBlock.duration,
            startDay: this.previewBlock.startDay,
            daySpan: this.previewBlock.daySpan,
            text: this.previewBlock.text,
            color: this.previewBlock.color,
            textColor: this.previewBlock.textColor,
            fontSize: this.previewBlock.fontSize,
            fontStyle: this.previewBlock.fontStyle,
            textAlignment: this.previewBlock.textAlignment,
            verticalAlignment: this.previewBlock.verticalAlignment,
            borderStyle: this.previewBlock.borderStyle,
            cornerRadius: this.previewBlock.cornerRadius,
            selected: false
        };

        const result = this.blockManager.addBlockWithUndo(block);
        if (!result.success) {
            this.showError(result.error.message);
        }

        this.previewBlock = null;
    }

    /**
     * Create a single time block in the clicked cell (30-minute slot)
     */
    private createBlockInCell(point: Point): void {
        // Determine which cell the user actually clicked in (not snapped to)
        const cellInfo = this.getCellFromPoint(point);
        if (!cellInfo) {
            this.showError('Invalid cell location');
            return;
        }
        
        // Store logical properties (source of truth)
        const startDay = cellInfo.dayIndex;
        const startTime = cellInfo.startTime;
        const duration = 30; // Fixed 30-minute duration for single cell
        const daySpan = 1; // Single cell spans one day
        
        // Validate that the block doesn't exceed the time range
        const endTime = startTime + duration;
        const maxValidTime = this.config.endHour * 60; // 24:00 in minutes
        
        if (endTime > maxValidTime) {
            this.showError('Cannot create block: would exceed valid time range');
            return;
        }
        
        const defaultStyling = this.getDefaultStyling();
        
        // Create the domain TimeBlock (without pixel coordinates)
        const block: TimeBlock = {
            id: this.generateBlockId(),
            startTime,
            duration,
            startDay,
            daySpan,
            text: '',
            color: '#e5007d',
            textColor: defaultStyling.textColor,
            fontSize: defaultStyling.fontSize,
            fontStyle: defaultStyling.fontStyle,
            textAlignment: defaultStyling.textAlignment,
            verticalAlignment: defaultStyling.verticalAlignment,
            borderStyle: defaultStyling.borderStyle,
            cornerRadius: defaultStyling.cornerRadius,
            selected: false
        };
        
        const result = this.blockManager.addBlockWithUndo(block);
        if (result.success) {
            this.render();
        } else {
            this.showError(result.error.message);
        }
    }

    /**
     * Complete block move operation
     */
    private finishBlockMove(): void {
        if (!this.mouseState.startPoint || !this.mouseState.originalBlockPositions || this.mouseState.movingBlockIds.length === 0) {
            return;
        }

        // Calculate the offset from original position
        const currentPoint = this.mouseState.currentPoint || this.mouseState.startPoint;
        const deltaX = currentPoint.x - this.mouseState.startPoint.x;
        const deltaY = currentPoint.y - this.mouseState.startPoint.y;

        // Convert pixel offset to logical offset (days and time slots)
        const dayOffset = Math.round(deltaX / this.config.dayWidth);
        const timeSlotOffset = Math.round(deltaY / this.config.timeSlotHeight);
        const timeOffset = timeSlotOffset * 30; // 30 minutes per slot

        // Get the first block to determine new position
        const firstBlockId = this.mouseState.movingBlockIds[0];
        if (!firstBlockId) return;
        
        const originalPositions = this.mouseState.originalBlockPositions;
        if (!originalPositions) return;
        
        const originalPosition = originalPositions.get(firstBlockId);
        if (!originalPosition) return;

        let newStartDay = originalPosition.startDay + dayOffset;
        let newStartTime = originalPosition.startTime + timeOffset;
        
        // Clamp to valid grid boundaries
        newStartDay = Math.max(0, Math.min(6, newStartDay));
        newStartTime = Math.max(this.config.startHour * 60, Math.min((this.config.endHour * 60) - 30, newStartTime));

        // Only move if there was actual movement and the move is valid
        if ((dayOffset !== 0 || timeOffset !== 0) && 
            this.blockManager.canMoveToPosition(this.mouseState.movingBlockIds, newStartDay, newStartTime)) {
            
            const result = this.blockManager.moveBlocksWithUndo(this.mouseState.movingBlockIds, newStartDay, newStartTime);
            
            if (!result.success) {
                this.showError(result.error.message);
            }
        }

        // Reset cursor
        this.canvas.style.cursor = 'default';
    }

    /**
     * Clamp a point to grid boundaries to ensure it remains within valid area
     */
    private clampPointToGrid(point: Point): Point {
        const gridBounds = GridUtils.getGridBounds(this.config);
        
        return {
            x: Math.max(gridBounds.minX, Math.min(point.x, gridBounds.maxX)),
            y: Math.max(gridBounds.minY, Math.min(point.y, gridBounds.maxY))
        };
    }

    /**
     * Determine which cell a point falls into (bulletproof cell detection)
     */
    private getCellFromPoint(point: Point): { dayIndex: number; y: number; startTime: number } | null {
        // Check if point is in grid area
        if (!GridUtils.isInGridArea(point.x, point.y, this.config)) {
            return null;
        }
        
        // Determine day index (which column)
        const relativeX = point.x - this.config.timeColumnWidth;
        const dayIndex = Math.floor(relativeX / this.config.dayWidth);
        
        // Clamp day index to valid range
        const clampedDayIndex = Math.max(0, Math.min(this.config.days.length - 1, dayIndex));
        
        // Determine time slot (which row) - use floor to get the cell the point is actually in
        const relativeY = point.y - this.config.headerHeight;
        const timeSlotIndex = Math.floor(relativeY / this.config.timeSlotHeight);
        
        // Calculate the Y position of the top of this cell
        const cellY = this.config.headerHeight + timeSlotIndex * this.config.timeSlotHeight;
        
        // Calculate start time for this cell
        const startTime = this.config.startHour * 60 + timeSlotIndex * 30; // 30 minutes per slot
        
        // Validate the time slot is within valid bounds
        const maxValidTime = this.config.endHour * 60;
        if (startTime < this.config.startHour * 60 || startTime >= maxValidTime) {
            return null;
        }
        
        return {
            dayIndex: clampedDayIndex,
            y: cellY,
            startTime
        };
    }

    /**
     * Update resize operation during mouse drag
     */
    private updateResize(currentPoint: Point): void {
        if (!this.mouseState.startPoint || !this.mouseState.resizeHandle || !this.mouseState.resizeBlockId || !this.mouseState.originalBlock) {
            return;
        }

        const originalBlock = this.mouseState.originalBlock;
        
        // Convert current mouse position to grid cell
        const currentCell = this.getCellFromPoint(currentPoint);
        if (!currentCell) return;
        
        // Calculate the new TimeBlock properties based on resize handle
        const newProperties = this.calculateResizeProperties(originalBlock, currentCell, this.mouseState.resizeHandle);
        if (!newProperties) return;

        // Apply the resize using logical coordinates
        const result = this.blockManager.resizeBlockLogical(
            this.mouseState.resizeBlockId, 
            newProperties.startDay,
            newProperties.startTime,
            newProperties.duration,
            newProperties.daySpan
        );
        
        if (result.success) {
            this.render();
        }
        // If resize failed due to overlap, we don't render to maintain visual feedback
    }

    /**
     * Calculate new TimeBlock properties for resize operation
     */
    private calculateResizeProperties(
        originalBlock: RenderedTimeBlock, 
        currentCell: { dayIndex: number; startTime: number },
        handle: ResizeHandle
    ): { startDay: number; startTime: number; duration: number; daySpan: number } | null {
        
        // Calculate original end boundaries
        const originalEndDay = originalBlock.startDay + originalBlock.daySpan - 1;
        const originalEndTime = originalBlock.startTime + originalBlock.duration;
        
        // Start with original properties
        let newStartDay = originalBlock.startDay;
        let newStartTime = originalBlock.startTime;
        let newDaySpan = originalBlock.daySpan;
        let newDuration = originalBlock.duration;

        switch (handle) {
            case 'top':
                // Resize from top: change start time, preserve end time
                newStartTime = currentCell.startTime;
                newDuration = originalEndTime - newStartTime;
                break;
                
            case 'bottom':
                // Resize from bottom: preserve start time, change end time
                const newEndTime = currentCell.startTime + 30; // End of current cell
                newDuration = newEndTime - originalBlock.startTime;
                break;
                
            case 'left':
                // Resize from left: change start day, preserve end day
                newStartDay = currentCell.dayIndex;
                newDaySpan = originalEndDay - newStartDay + 1;
                break;
                
            case 'right':
                // Resize from right: preserve start day, change end day
                newDaySpan = currentCell.dayIndex - originalBlock.startDay + 1;
                break;
                
            case 'top-left':
                // Resize from top-left: change both start time and start day
                newStartTime = currentCell.startTime;
                newDuration = originalEndTime - newStartTime;
                newStartDay = currentCell.dayIndex;
                newDaySpan = originalEndDay - newStartDay + 1;
                break;
                
            case 'top-right':
                // Resize from top-right: change start time and end day
                newStartTime = currentCell.startTime;
                newDuration = originalEndTime - newStartTime;
                newDaySpan = currentCell.dayIndex - originalBlock.startDay + 1;
                break;
                
            case 'bottom-left':
                // Resize from bottom-left: change end time and start day
                const newEndTimeBL = currentCell.startTime + 30;
                newDuration = newEndTimeBL - originalBlock.startTime;
                newStartDay = currentCell.dayIndex;
                newDaySpan = originalEndDay - newStartDay + 1;
                break;
                
            case 'bottom-right':
                // Resize from bottom-right: change both end time and end day
                const newEndTimeBR = currentCell.startTime + 30;
                newDuration = newEndTimeBR - originalBlock.startTime;
                newDaySpan = currentCell.dayIndex - originalBlock.startDay + 1;
                break;
                
            default:
                return null;
        }

        // Validate and clamp the properties
        newStartDay = Math.max(0, Math.min(6, newStartDay));
        newDaySpan = Math.max(1, Math.min(7 - newStartDay, newDaySpan));
        newStartTime = Math.max(this.config.startHour * 60, newStartTime);
        newDuration = Math.max(30, newDuration);
        
        // Ensure the block doesn't exceed the time range
        const maxValidTime = this.config.endHour * 60;
        if (newStartTime + newDuration > maxValidTime) {
            newDuration = maxValidTime - newStartTime;
        }

        return {
            startDay: newStartDay,
            startTime: newStartTime,
            duration: newDuration,
            daySpan: newDaySpan
        };
    }

    /**
     * Handle block moving during drag
     */
    private updateBlockMove(currentPoint: Point): void {
        if (!this.mouseState.startPoint || !this.mouseState.originalBlockPositions || this.mouseState.movingBlockIds.length === 0) {
            return;
        }

        const startPoint = this.mouseState.startPoint;

        // Start moving mode if not already active
        if (!this.mouseState.moving) {
            this.mouseState = {
                ...this.mouseState,
                moving: true,
                isDragging: true
            };
            
            // Hide styling panel during move to prevent interference
            if ((window as any).editToolbar) {
                (window as any).editToolbar.hide();
            }
        }

        this.mouseState = {
            ...this.mouseState,
            currentPoint
        };

        // Calculate the offset from original position
        const deltaX = currentPoint.x - startPoint.x;
        const deltaY = currentPoint.y - startPoint.y;

        // Convert pixel offset to logical offset (days and time slots)
        const dayOffset = Math.round(deltaX / this.config.dayWidth);
        const timeSlotOffset = Math.round(deltaY / this.config.timeSlotHeight);
        const timeOffset = timeSlotOffset * 30; // 30 minutes per slot

        // Get the first block to determine new position
        const firstBlockId = this.mouseState.movingBlockIds[0];
        if (!firstBlockId) return;
        
        const originalPositions = this.mouseState.originalBlockPositions;
        if (!originalPositions) return;
        
        const originalPosition = originalPositions.get(firstBlockId);
        if (!originalPosition) return;

        let newStartDay = originalPosition.startDay + dayOffset;
        let newStartTime = originalPosition.startTime + timeOffset;
        
        // Clamp to valid grid boundaries
        newStartDay = Math.max(0, Math.min(6, newStartDay));
        newStartTime = Math.max(this.config.startHour * 60, Math.min((this.config.endHour * 60) - 30, newStartTime));
        
        // Check if the move is valid
        const canMove = this.blockManager.canMoveToPosition(
            this.mouseState.movingBlockIds, 
            newStartDay, 
            newStartTime
        );

        // Update cursor to show move state
        this.canvas.style.cursor = canMove ? 'grabbing' : 'not-allowed';

        // Store preview positions for visual feedback
        this.createMovingPreviewBlocks(newStartDay, newStartTime);
        this.render();
    }

    /**
     * Create preview blocks for moving blocks at their target positions
     */
    private createMovingPreviewBlocks(newStartDay: number, newStartTime: number): void {
        this.movingPreviewBlocks = [];
        
        if (!this.mouseState.originalBlockPositions || this.mouseState.movingBlockIds.length === 0) {
            return;
        }
        
        // Get the first block to calculate the offset
        const firstBlockId = this.mouseState.movingBlockIds[0];
        if (!firstBlockId) return;
        
        const originalPosition = this.mouseState.originalBlockPositions.get(firstBlockId);
        if (!originalPosition) return;
        
        // Calculate offset from original position
        const dayOffset = newStartDay - originalPosition.startDay;
        const timeOffset = newStartTime - originalPosition.startTime;
        
        // Create preview blocks for all moving blocks
        for (const blockId of this.mouseState.movingBlockIds) {
            const block = this.blockManager.getBlock(blockId);
            const originalPos = this.mouseState.originalBlockPositions.get(blockId);
            
            if (block && originalPos) {
                let previewStartDay = originalPos.startDay + dayOffset;
                let previewStartTime = originalPos.startTime + timeOffset;
                
                // Clamp to valid grid boundaries
                previewStartDay = Math.max(0, Math.min(6, previewStartDay));
                previewStartTime = Math.max(this.config.startHour * 60, Math.min((this.config.endHour * 60) - 30, previewStartTime));
                
                // Calculate pixel positions for preview
                const { x, y, width, height } = GridUtils.calculateBlockPixelProperties(
                    previewStartDay,
                    previewStartTime,
                    block.duration,
                    block.daySpan,
                    this.config
                );
                
                // Create preview block with transparency
                const previewBlock: RenderedTimeBlock = {
                    ...block,
                    startDay: previewStartDay,
                    startTime: previewStartTime,
                    x,
                    y,
                    width,
                    height
                };
                
                this.movingPreviewBlocks.push(previewBlock);
            }
        }
    }

    /**
     * Reset mouse state
     */
    private resetMouseState(): void {
        // Check if we were resizing or moving to show toolbar again
        const wasResizing = this.mouseState.resizing;
        const wasMoving = this.mouseState.moving;
        
        this.mouseState = {
            isDown: false,
            startPoint: null,
            currentPoint: null,
            isDragging: false,
            resizing: false,
            moving: false,
            movingBlockIds: [],
            originalBlockPositions: null,
            resizeHandle: null,
            resizeBlockId: null,
            originalBlock: null
        };
        this.previewBlock = null;
        this.movingPreviewBlocks = [];
        
        // Show styling panel again if we were resizing or moving and there's a selected block
        if ((wasResizing || wasMoving) && (window as any).editToolbar) {
            const selectedBlocks = this.blockManager.getSelectedBlocks();
            if (selectedBlocks.length === 1) {
                (window as any).editToolbar.show(selectedBlocks[0]);
            } else if (selectedBlocks.length > 1) {
                (window as any).editToolbar.showMultiple(selectedBlocks);
            }
        }
    }

    /**
     * Start editing a block's text
     */
    private startEditingBlock(block: RenderedTimeBlock): void {
        this.editingBlock = block;
        this.textInput.value = block.text;
        this.textInput.style.display = 'block';
        this.textInput.style.left = `${block.x + 4}px`;
        this.textInput.style.top = `${block.y + block.height / 2 - 10}px`;
        this.textInput.style.width = `${Math.max(100, block.width - 8)}px`;
        this.textInput.focus();
        this.textInput.select();
    }

    /**
     * Stop editing a block's text
     */
    private stopEditingBlock(): void {
        if (this.editingBlock) {
            this.blockManager.updateBlockTextWithUndo(this.editingBlock.id, this.textInput.value);
            this.editingBlock = null;
            this.textInput.style.display = 'none';
            this.render();
        }
    }

    /**
     * Text input event handlers
     */
    private onTextInputBlur(): void {
        this.stopEditingBlock();
    }

    private onTextInputKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.stopEditingBlock();
        } else if (event.key === 'Escape') {
            this.textInput.value = this.editingBlock?.text || '';
            this.stopEditingBlock();
        }
    }

    /**
     * Generate a unique block ID
     */
    private generateBlockId(): string {
        return `block_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Gets default styling properties for new blocks
     */
    private getDefaultStyling(): {
        textColor: HexColor;
        fontSize: number;
        fontStyle: FontStyle;
        textAlignment: TextAlignment;
        verticalAlignment: VerticalAlignment;
        borderStyle: BorderStyle;
        cornerRadius: number;
    } {
        return {
            textColor: '#ffffff',
            fontSize: 16,
            fontStyle: {
                bold: false,
                italic: false
            },
            textAlignment: 'center',
            verticalAlignment: 'middle',
            borderStyle: {
                width: 0,
                style: 'solid',
                color: '#e5007d'
            },
            cornerRadius: 0
        };
    }

    /**
     * Main render method
     */
    public render(): void {
        // Get all blocks, but exclude ones that are currently being moved
        let blocksToRender = this.blockManager.getBlocks();
        
        if (this.mouseState.moving && this.mouseState.movingBlockIds.length > 0) {
            // Filter out blocks that are being moved so they don't show in original position
            blocksToRender = blocksToRender.filter(block => 
                !this.mouseState.movingBlockIds.includes(block.id)
            );
        }
        
        this.renderer.render(blocksToRender);
        
        // Draw moving preview blocks during drag operations
        if (this.mouseState.moving && this.movingPreviewBlocks.length > 0) {
            for (const previewBlock of this.movingPreviewBlocks) {
                this.renderer.drawPreviewBlock(previewBlock);
            }
        }
        
        // Draw highlighted cell for context menu
        if (this.highlightedCell) {
            this.renderer.drawHighlightedCell(this.highlightedCell.day, this.highlightedCell.timeMinutes);
        }
        
        // Draw preview block during block creation (drag) or template placement
        if (this.previewBlock) {
            this.renderer.drawPreviewBlock(this.previewBlock);
        }
    }

    /**
     * Closes the main menu
     */
    private closeMenu(): void {
        // Use UIManager to close the modal
        this.uiManager.closeModal();
    }

    /**
     * Updates the styling of the currently selected block(s)
     */
    updateSelectedBlockStyle(property: string, value: any): void {
        const selectedCount = this.blockManager.getSelectedBlockCount();
        if (selectedCount === 0) return;

        const updates: any = {};
        updates[property] = value;

        // Use the undo-enabled version for style updates
        const result = this.blockManager.updateSelectedBlocksStyleWithUndo(updates);
        if (result.success) {
            this.render();
            // Toolbar stays in user-positioned location
        }
    }

    /**
     * Handles block selection changes and updates toolbar
     */
    private handleSelectionChange(blockId: string | null): void {
        this.blockManager.selectBlock(blockId);
        this.updateToolbarForMultiSelection();
    }

    /**
     * Updates toolbar for multi-selection
     */
    private updateToolbarForMultiSelection(): void {
        const selectedBlocks = this.blockManager.getSelectedBlocks();
        const selectedCount = this.blockManager.getSelectedBlockCount();
        
        if (selectedCount > 1 && (window as any).editToolbar) {
            // For multi-selection, show toolbar with first block as reference
            if (typeof (window as any).editToolbar.showMultiple === 'function') {
                (window as any).editToolbar.showMultiple(selectedBlocks);
            } else {
                // Fallback: show toolbar with first block
                (window as any).editToolbar.show(selectedBlocks[0]);
            }
        } else if (selectedCount === 1 && (window as any).editToolbar) {
            // Single selection - show normal toolbar
            (window as any).editToolbar.show(selectedBlocks[0]);
        } else if ((window as any).editToolbar) {
            // No selection - hide toolbar
            (window as any).editToolbar.hide();
        }
    }


    /**
     * Generate filename with current date
     */
    private generateFilename(extension: string): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} - Week Planning.${extension}`;
    }

    /**
     * Export functionality
     */
    private exportSVG(): void {
        const svg = this.renderer.exportSVG(this.blockManager.getBlocks());
        this.downloadFile(svg, this.generateFilename('svg'), 'image/svg+xml');
    }

    private exportPNG(): void {
        const link = document.createElement('a');
        link.download = this.generateFilename('png');
        link.href = this.canvas.toDataURL();
        link.click();
    }

    private exportJSON(): void {
        const data = this.blockManager.exportData();
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, this.generateFilename('json'), 'application/json');
    }

    private exportMarkdown(): void {
        const blocks = this.blockManager.getBlocks();
        const markdown = this.generateMarkdown(blocks);
        this.downloadFile(markdown, this.generateFilename('md'), 'text/markdown');
    }

    private generateMarkdown(blocks: readonly RenderedTimeBlock[]): string {
        // Get current date for header
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Start with header
        let markdown = `# ${dateStr} - Week Planning\n\n`;

        // Group blocks by day
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const blocksByDay: { [key: number]: RenderedTimeBlock[] } = {};

        // Initialize empty arrays for each day
        for (let i = 0; i < 7; i++) {
            blocksByDay[i] = [];
        }

        // Group blocks by all days they span (including multi-day blocks)
        for (const block of blocks) {
            for (let day = block.startDay; day < block.startDay + block.daySpan; day++) {
                if (day >= 0 && day < 7) {
                    if (!blocksByDay[day]) {
                        blocksByDay[day] = [];
                    }
                    blocksByDay[day]!.push(block);
                }
            }
        }

        // Generate markdown for each day
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayName = dayNames[dayIndex];
            const dayBlocks = blocksByDay[dayIndex] || [];

            markdown += `## ${dayName}\n`;

            if (dayBlocks.length === 0) {
                markdown += '- No events scheduled\n\n';
            } else {
                // Sort blocks by start time
                const sortedBlocks = dayBlocks.sort((a, b) => a.startTime - b.startTime);

                for (const block of sortedBlocks) {
                    const startTime = GridUtils.formatTime(block.startTime);
                    const endTime = GridUtils.formatTime(block.startTime + block.duration);
                    let text = block.text.trim() || 'Untitled event';
                    
                    // Add "(Day x/y)" notation for multi-day blocks
                    if (block.daySpan > 1) {
                        const dayNumber = dayIndex - block.startDay + 1;
                        text += ` (Day ${dayNumber}/${block.daySpan})`;
                    }
                    
                    markdown += `- ${startTime} - ${endTime}: ${text}\n`;
                }
                markdown += '\n';
            }
        }

        return markdown;
    }

    private importJSON(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result as string) as WeekPlannerData;
                        const result = this.blockManager.importDataWithUndo(data);
                        if (result.success) {
                            this.render();
                            // Close the menu after successful import
                            this.closeMenu();
                        } else {
                            this.showError(result.error.message);
                        }
                    } catch (error) {
                        this.showError('Invalid JSON file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    private importMarkdown(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const markdownContent = e.target?.result as string;
                        const blocks = this.parseMarkdown(markdownContent);
                        
                        if (blocks.length === 0) {
                            this.showError('No valid time blocks found in Markdown file');
                            return;
                        }

                        // Create import data structure for undo support
                        const importData: WeekPlannerData = {
                            version: '1.0',
                            blocks: blocks,
                            config: this.config,
                            exportedAt: new Date().toISOString()
                        };
                        
                        // Use importDataWithUndo for proper undo support
                        const result = this.blockManager.importDataWithUndo(importData);
                        let importedCount = result.success ? blocks.length : 0;
                        
                        if (result.success) {
                            this.render();
                            this.closeMenu();
                        } else {
                            this.showError(`Failed to import Markdown: ${result.error.message}`);
                        }
                    } catch (error) {
                        this.showError('Invalid Markdown file format');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    private parseMarkdown(content: string): TimeBlock[] {
        const blocks: TimeBlock[] = [];
        const lines = content.split('\n');
        let currentDay = -1;
        
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const multiDayBlocks = new Map<string, {
            startDay: number;
            startTime: number;
            duration: number;
            text: string;
            daySpan: number;
            dayParts: Array<{ day: number; dayNumber: number }>;
        }>();
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check if this is a day header (## Monday, ## Tuesday, etc.)
            const dayMatch = trimmedLine.match(/^##\s+(.+)$/);
            if (dayMatch) {
                const dayName = dayMatch[1]?.trim();
                const dayIndex = dayNames.findIndex(name => 
                    name.toLowerCase() === dayName?.toLowerCase()
                );
                if (dayIndex !== -1) {
                    currentDay = dayIndex;
                }
                continue;
            }
            
            // Check if this is a time block line (- 09:00 - 10:30: Meeting)
            const timeBlockMatch = trimmedLine.match(/^-\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2}):\s*(.+)$/);
            if (timeBlockMatch && currentDay !== -1) {
                const [, startHour, startMin, endHour, endMin, fullText] = timeBlockMatch;
                
                if (!startHour || !startMin || !endHour || !endMin || !fullText) {
                    continue;
                }
                
                const startTime = parseInt(startHour) * 60 + parseInt(startMin);
                const endTime = parseInt(endHour) * 60 + parseInt(endMin);
                const duration = endTime - startTime;
                
                // Validate time values
                if (startTime < 0 || endTime < 0 || duration <= 0 || startTime >= endTime) {
                    continue;
                }
                
                // Ensure duration is a multiple of 30 minutes
                const adjustedDuration = Math.max(30, Math.round(duration / 30) * 30);
                
                // Check if this is a multi-day block with "(Day x/y)" notation
                const multiDayMatch = fullText.match(/^(.+?)\s+\(Day\s+(\d+)\/(\d+)\)$/);
                if (multiDayMatch) {
                    const [, text, dayNumberStr, totalDaysStr] = multiDayMatch;
                    
                    if (!text || !dayNumberStr || !totalDaysStr) {
                        continue;
                    }
                    
                    const dayNumber = parseInt(dayNumberStr);
                    const totalDays = parseInt(totalDaysStr);
                    
                    if (dayNumber > 0 && totalDays > 1 && dayNumber <= totalDays) {
                        // Create a unique key for this multi-day block
                        const blockKey = `${text.trim()}-${startTime}-${adjustedDuration}-${totalDays}`;
                        
                        if (!multiDayBlocks.has(blockKey)) {
                            // First occurrence - calculate the start day
                            const blockStartDay = currentDay - (dayNumber - 1);
                            multiDayBlocks.set(blockKey, {
                                startDay: blockStartDay,
                                startTime,
                                duration: adjustedDuration,
                                text: text.trim(),
                                daySpan: totalDays,
                                dayParts: []
                            });
                        }
                        
                        // Record this day part
                        const multiDayBlock = multiDayBlocks.get(blockKey)!;
                        multiDayBlock.dayParts.push({ day: currentDay, dayNumber });
                        continue;
                    }
                }
                
                // Regular single-day block
                const defaultStyling = this.getDefaultStyling();
                
                const block: TimeBlock = {
                    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    startDay: currentDay,
                    startTime: startTime,
                    duration: adjustedDuration,
                    daySpan: 1,
                    text: fullText.trim(),
                    color: '#e5007d', // Default background color (same as new blocks)
                    textColor: defaultStyling.textColor,
                    fontSize: defaultStyling.fontSize,
                    fontStyle: defaultStyling.fontStyle,
                    textAlignment: defaultStyling.textAlignment,
                    verticalAlignment: defaultStyling.verticalAlignment,
                    borderStyle: defaultStyling.borderStyle,
                    cornerRadius: defaultStyling.cornerRadius,
                    selected: false
                };
                
                blocks.push(block);
            }
        }
        
        // Add reconstructed multi-day blocks
        const defaultStyling = this.getDefaultStyling();
        for (const multiDayBlock of multiDayBlocks.values()) {
            // Only add if we have collected all day parts
            if (multiDayBlock.dayParts.length === multiDayBlock.daySpan) {
                const block: TimeBlock = {
                    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    startDay: multiDayBlock.startDay,
                    startTime: multiDayBlock.startTime,
                    duration: multiDayBlock.duration,
                    daySpan: multiDayBlock.daySpan,
                    text: multiDayBlock.text,
                    color: '#e5007d', // Default background color (same as new blocks)
                    textColor: defaultStyling.textColor,
                    fontSize: defaultStyling.fontSize,
                    fontStyle: defaultStyling.fontStyle,
                    textAlignment: defaultStyling.textAlignment,
                    verticalAlignment: defaultStyling.verticalAlignment,
                    borderStyle: defaultStyling.borderStyle,
                    cornerRadius: defaultStyling.cornerRadius,
                    selected: false
                };
                
                blocks.push(block);
            }
        }
        
        return blocks;
    }

    /**
     * Clear all blocks with confirmation
     */
    private clearAll(): void {
        this.blockManager.clearAllWithUndo();
        // Hide toolbar since no blocks are selected
        if ((window as any).editToolbar) {
            (window as any).editToolbar.hide();
        }
        this.render();
    }

    /**
     * Template placement methods
     */
    
    /**
     * Start template placement mode with a template block
     */
    startTemplatePlacement(templateBlock: Omit<TimeBlock, 'id'>): void {
        this.templatePlacementMode = true;
        this.templatePlacementData = {
            ...templateBlock,
            id: 'template-preview',
            duration: 30 // Always 30 minutes for templates
        };
        
        // Hide the block styling panel during template placement
        if ((window as any).editToolbar) {
            (window as any).editToolbar.hide();
        }
        
        // Change cursor to indicate placement mode
        this.canvas.style.cursor = 'crosshair';
        
        // Get current mouse position from the canvas if available
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Initialize mouse state with center position
        this.mouseState = { 
            ...this.mouseState, 
            currentPoint: { x: centerX, y: centerY } 
        };
        
        // Create initial preview at center or mouse position if available
        this.updateTemplatePreview();
        this.render();
    }
    
    /**
     * Cancel template placement mode
     */
    cancelTemplatePlacement(): void {
        this.templatePlacementMode = false;
        this.templatePlacementData = null;
        this.previewBlock = null;
        this.canvas.style.cursor = 'default';
        
        // Restore the styling panel if there are selected blocks
        this.updateToolbarForMultiSelection();
        
        this.render();
    }
    
    /**
     * Update template preview based on current mouse position
     */
    private updateTemplatePreview(): void {
        if (!this.templatePlacementMode || !this.templatePlacementData || !this.mouseState.currentPoint) {
            return;
        }
        
        // Get grid cell from current mouse position
        const cell = this.getCellFromPoint(this.mouseState.currentPoint);
        if (!cell) {
            this.previewBlock = null;
            this.render();
            return;
        }
        
        // Create preview block at the grid cell
        const { x, y, width, height } = GridUtils.calculateBlockPixelProperties(
            cell.dayIndex,
            cell.startTime,
            30, // Always 30 minutes
            1, // Always single day
            this.config
        );
        
        this.previewBlock = {
            ...this.templatePlacementData,
            startDay: cell.dayIndex,
            startTime: cell.startTime,
            duration: 30,
            daySpan: 1,
            x,
            y,
            width,
            height
        };
        
        this.render();
    }
    
    /**
     * Place the template at the current position
     */
    private placeTemplate(): void {
        if (!this.templatePlacementMode || !this.templatePlacementData || !this.previewBlock) {
            return;
        }
        
        // Create the actual block
        const blockData: TimeBlock = {
            ...this.templatePlacementData,
            id: this.generateBlockId(),
            startDay: this.previewBlock.startDay,
            startTime: this.previewBlock.startTime,
            duration: 30,
            daySpan: 1,
            selected: false
        };
        
        // Try to add the block
        const result = this.blockManager.addBlockWithUndo(blockData);
        if (result.success) {
            // Exit template placement mode
            this.cancelTemplatePlacement();
        }
    }

    /**
     * Utility methods
     */
    private downloadFile(content: string, filename: string, contentType: string): void {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private showError(message: string): void {
        console.error(message);
    }
}