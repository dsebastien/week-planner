import { GridUtils } from './grid-utils.js';
import { TimeBlockManager } from './time-block-manager.js';
import { CanvasRenderer } from './canvas-renderer.js';
/**
 * Main application controller for the week planner
 * Handles UI events and coordinates other components
 */
export class WeekPlanner {
    constructor() {
        this.mouseState = {
            isDown: false,
            startPoint: null,
            currentPoint: null,
            isDragging: false
        };
        this.previewBlock = null;
        this.editingBlock = null;
        this.resizeTimeout = null;
        // Initialize DOM elements
        this.canvas = this.getRequiredElement('weekCanvas');
        this.textInput = this.getRequiredElement('textInput');
        this.colorPicker = this.getRequiredElement('blockColor');
        // Initialize configuration
        this.config = this.createInitialConfig();
        // Initialize components
        this.blockManager = new TimeBlockManager(this.config);
        this.renderer = new CanvasRenderer(this.canvas, this.config);
        // Setup and start
        this.initialize();
    }
    /**
     * Initialize the application
     */
    initialize() {
        this.setupCanvas();
        this.setupEventListeners();
        this.render();
    }
    /**
     * Create initial configuration
     */
    createInitialConfig() {
        return {
            startHour: 6,
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
    getRequiredElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required element with ID '${id}' not found`);
        }
        return element;
    }
    /**
     * Setup canvas dimensions and calculate grid layout
     */
    setupCanvas() {
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
    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
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
    setupMenuEvents() {
        const toolbarToggle = document.getElementById('toolbarToggle');
        const toolbarMenu = document.getElementById('toolbarMenu');
        toolbarToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            toolbarMenu?.classList.toggle('visible');
        });
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!toolbarToggle?.contains(target) && !toolbarMenu?.contains(target)) {
                toolbarMenu?.classList.remove('visible');
            }
        });
    }
    /**
     * Setup export and utility button events
     */
    setupExportEvents() {
        document.getElementById('exportSVG')?.addEventListener('click', () => this.exportSVG());
        document.getElementById('exportPNG')?.addEventListener('click', () => this.exportPNG());
        document.getElementById('exportJSON')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('importJSON')?.addEventListener('click', () => this.importJSON());
        document.getElementById('clearAll')?.addEventListener('click', () => this.clearAll());
    }
    /**
     * Setup window resize and zoom handling
     */
    setupWindowEvents() {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                this.handleResize();
            }
        });
    }
    /**
     * Handle window resize with debouncing
     */
    handleResize() {
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
    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
    /**
     * Update cursor based on mouse position
     */
    updateCursor(x, y) {
        if (!GridUtils.isInGridArea(x, y, this.config)) {
            this.canvas.classList.remove('creating', 'pointer');
            return;
        }
        const block = this.blockManager.getBlockAt(x, y);
        if (block) {
            this.canvas.classList.remove('creating');
            this.canvas.classList.add('pointer');
        }
        else {
            this.canvas.classList.remove('pointer');
            this.canvas.classList.add('creating');
        }
    }
    /**
     * Handle mouse down events
     */
    onMouseDown(event) {
        const point = this.getMousePosition(event);
        // Only handle clicks in the grid area
        if (!GridUtils.isInGridArea(point.x, point.y, this.config)) {
            return;
        }
        this.mouseState = {
            isDown: true,
            startPoint: point,
            currentPoint: point,
            isDragging: false
        };
        const clickedBlock = this.blockManager.getBlockAt(point.x, point.y);
        if (clickedBlock) {
            this.blockManager.selectBlock(clickedBlock.id);
        }
        else {
            this.blockManager.selectBlock(null);
            this.startBlockCreation(point);
        }
        this.render();
    }
    /**
     * Handle mouse move events
     */
    onMouseMove(event) {
        const point = this.getMousePosition(event);
        // Update cursor if not dragging
        if (!this.mouseState.isDragging) {
            this.updateCursor(point.x, point.y);
        }
        // Handle block creation dragging
        if (this.mouseState.isDown && this.mouseState.startPoint) {
            this.updateBlockCreation(point);
        }
    }
    /**
     * Handle mouse up events
     */
    onMouseUp() {
        if (this.mouseState.isDragging && this.previewBlock) {
            this.finishBlockCreation();
        }
        this.resetMouseState();
        this.render();
    }
    /**
     * Handle mouse leave events
     */
    onMouseLeave() {
        this.resetMouseState();
        this.render();
    }
    /**
     * Handle double click events for text editing and block creation
     */
    onDoubleClick(event) {
        const point = this.getMousePosition(event);
        // Only handle double clicks in the grid area
        if (!GridUtils.isInGridArea(point.x, point.y, this.config)) {
            return;
        }
        const clickedBlock = this.blockManager.getBlockAt(point.x, point.y);
        if (clickedBlock) {
            // Edit existing block
            this.startEditingBlock(clickedBlock);
        }
        else {
            // Create new block in the cell
            this.createBlockInCell(point);
        }
    }
    /**
     * Handle keyboard events
     */
    onKeyDown(event) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            const selectedBlock = this.blockManager.getSelectedBlock();
            if (selectedBlock && !this.editingBlock) {
                this.blockManager.removeBlock(selectedBlock.id);
                this.render();
            }
        }
        else if (event.key === 'Escape') {
            this.stopEditingBlock();
        }
    }
    /**
     * Start creating a new block
     */
    startBlockCreation(point) {
        this.mouseState = {
            ...this.mouseState,
            isDragging: true
        };
    }
    /**
     * Update block creation during drag
     */
    updateBlockCreation(currentPoint) {
        if (!this.mouseState.startPoint)
            return;
        this.mouseState = {
            ...this.mouseState,
            currentPoint,
            isDragging: true
        };
        // Use bulletproof cell detection for start point
        const startCell = this.getCellFromPoint(this.mouseState.startPoint);
        if (!startCell)
            return; // Start point must be valid
        // Clamp current point to grid boundaries for smooth dragging experience
        const clampedCurrentPoint = this.clampPointToGrid(currentPoint);
        const endCell = this.getCellFromPoint(clampedCurrentPoint);
        if (!endCell) {
            return; // This should not happen with clamped point, but safety check
        }
        // Calculate block dimensions using cell-based approach
        const minDay = Math.min(startCell.dayIndex, endCell.dayIndex);
        const maxDay = Math.max(startCell.dayIndex, endCell.dayIndex);
        const daySpan = maxDay - minDay + 1;
        const x = GridUtils.getXFromDay(minDay, this.config);
        const width = GridUtils.getWidthFromDaySpan(daySpan, this.config);
        // Use the earlier time slot as the start
        const minY = Math.min(startCell.y, endCell.y);
        const maxY = Math.max(startCell.y, endCell.y);
        const y = minY;
        const height = Math.max(this.config.timeSlotHeight, maxY - minY + this.config.timeSlotHeight);
        // Calculate time values using the earlier time
        const startTime = Math.min(startCell.startTime, endCell.startTime);
        const duration = GridUtils.getDurationInMinutes(height, this.config);
        const endTime = startTime + duration;
        const maxValidTime = this.config.endHour * 60; // 24:00 in minutes
        // Clamp duration if it would exceed valid time range
        const clampedDuration = endTime > maxValidTime ?
            Math.max(30, maxValidTime - startTime) : // Minimum 30 minutes, but don't exceed valid range
            duration;
        // Recalculate height based on clamped duration
        const finalHeight = GridUtils.getHeightFromDuration(clampedDuration, this.config);
        // Create preview block
        this.previewBlock = {
            id: 'preview',
            x,
            y,
            width,
            height: finalHeight,
            startTime,
            duration: clampedDuration,
            daySpan,
            text: '',
            color: this.colorPicker.value,
            selected: false
        };
        this.render();
        if (this.previewBlock) {
            this.renderer.drawPreviewBlock(this.previewBlock);
        }
    }
    /**
     * Finish creating a block
     */
    finishBlockCreation() {
        if (!this.previewBlock)
            return;
        const block = {
            ...this.previewBlock,
            id: this.generateBlockId(),
            selected: true
        };
        const result = this.blockManager.addBlock(block);
        if (result.success) {
            this.blockManager.selectBlock(block.id);
        }
        else {
            this.showError(result.error.message);
        }
        this.previewBlock = null;
    }
    /**
     * Create a single time block in the clicked cell (30-minute slot)
     */
    createBlockInCell(point) {
        // Determine which cell the user actually clicked in (not snapped to)
        const cellInfo = this.getCellFromPoint(point);
        if (!cellInfo) {
            this.showError('Invalid cell location');
            return;
        }
        // Calculate exact block position for the clicked cell
        const x = GridUtils.getXFromDay(cellInfo.dayIndex, this.config);
        const width = this.config.dayWidth;
        const y = cellInfo.y;
        const height = this.config.timeSlotHeight;
        // Calculate time values
        const startTime = cellInfo.startTime;
        const duration = 30; // Fixed 30-minute duration for single cell
        // Validate that the block doesn't exceed the time range
        const endTime = startTime + duration;
        const maxValidTime = this.config.endHour * 60; // 24:00 in minutes
        if (endTime > maxValidTime) {
            this.showError('Cannot create block: would exceed valid time range');
            return;
        }
        // Create the block
        const block = {
            id: this.generateBlockId(),
            x,
            y,
            width,
            height,
            startTime,
            duration,
            daySpan: 1,
            text: '',
            color: this.colorPicker.value,
            selected: true
        };
        const result = this.blockManager.addBlock(block);
        if (result.success) {
            this.blockManager.selectBlock(block.id);
            this.render();
        }
        else {
            this.showError(result.error.message);
        }
    }
    /**
     * Clamp a point to grid boundaries to ensure it remains within valid area
     */
    clampPointToGrid(point) {
        const gridBounds = GridUtils.getGridBounds(this.config);
        return {
            x: Math.max(gridBounds.minX, Math.min(point.x, gridBounds.maxX)),
            y: Math.max(gridBounds.minY, Math.min(point.y, gridBounds.maxY))
        };
    }
    /**
     * Determine which cell a point falls into (bulletproof cell detection)
     */
    getCellFromPoint(point) {
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
     * Reset mouse state
     */
    resetMouseState() {
        this.mouseState = {
            isDown: false,
            startPoint: null,
            currentPoint: null,
            isDragging: false
        };
        this.previewBlock = null;
    }
    /**
     * Start editing a block's text
     */
    startEditingBlock(block) {
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
    stopEditingBlock() {
        if (this.editingBlock) {
            this.blockManager.updateBlockText(this.editingBlock.id, this.textInput.value);
            this.editingBlock = null;
            this.textInput.style.display = 'none';
            this.render();
        }
    }
    /**
     * Text input event handlers
     */
    onTextInputBlur() {
        this.stopEditingBlock();
    }
    onTextInputKeyDown(event) {
        if (event.key === 'Enter') {
            this.stopEditingBlock();
        }
        else if (event.key === 'Escape') {
            this.textInput.value = this.editingBlock?.text || '';
            this.stopEditingBlock();
        }
    }
    /**
     * Generate a unique block ID
     */
    generateBlockId() {
        return `block_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    /**
     * Main render method
     */
    render() {
        this.renderer.render(this.blockManager.getBlocks());
    }
    /**
     * Export functionality
     */
    exportSVG() {
        const svg = this.renderer.exportSVG(this.blockManager.getBlocks());
        this.downloadFile(svg, 'week-planner.svg', 'image/svg+xml');
    }
    exportPNG() {
        const link = document.createElement('a');
        link.download = 'week-planner.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    exportJSON() {
        const data = this.blockManager.exportData();
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'week-planner.json', 'application/json');
    }
    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result);
                        const result = this.blockManager.importData(data);
                        if (result.success) {
                            this.render();
                        }
                        else {
                            this.showError(result.error.message);
                        }
                    }
                    catch (error) {
                        this.showError('Invalid JSON file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    /**
     * Clear all blocks with confirmation
     */
    clearAll() {
        this.blockManager.clearAll();
        this.render();
    }
    /**
     * Utility methods
     */
    downloadFile(content, filename, contentType) {
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
    showError(message) {
        console.error(message);
    }
}
//# sourceMappingURL=week-planner.js.map