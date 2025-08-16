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
        const containerHeight = window.innerHeight;
        // Set canvas size
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        this.canvas.style.width = `${containerWidth}px`;
        this.canvas.style.height = `${containerHeight}px`;
        // Calculate grid dimensions
        const totalHours = this.config.endHour - this.config.startHour;
        const availableWidth = containerWidth - this.config.timeColumnWidth;
        // Update configuration with calculated values
        this.config.dayWidth = availableWidth / this.config.days.length;
        this.config.timeSlotHeight = (containerHeight - this.config.headerHeight) / (totalHours * 2);
        this.config.canvasWidth = containerWidth;
        this.config.canvasHeight = containerHeight;
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
     * Handle double click events for text editing
     */
    onDoubleClick(event) {
        const point = this.getMousePosition(event);
        const clickedBlock = this.blockManager.getBlockAt(point.x, point.y);
        if (clickedBlock) {
            this.startEditingBlock(clickedBlock);
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
        const snappedStart = GridUtils.snapToGrid(this.mouseState.startPoint.x, this.mouseState.startPoint.y, this.config);
        const snappedEnd = GridUtils.snapToGrid(currentPoint.x, currentPoint.y, this.config);
        // Calculate block dimensions
        const startDay = GridUtils.getDayFromX(snappedStart.x, this.config);
        const endDay = GridUtils.getDayFromX(snappedEnd.x, this.config);
        const minDay = Math.min(startDay, endDay);
        const maxDay = Math.max(startDay, endDay);
        const daySpan = maxDay - minDay + 1;
        const x = GridUtils.getXFromDay(minDay, this.config);
        const width = GridUtils.getWidthFromDaySpan(daySpan, this.config);
        const y = Math.min(snappedStart.y, snappedEnd.y);
        const height = Math.max(this.config.timeSlotHeight, Math.abs(snappedEnd.y - snappedStart.y));
        // Create preview block
        this.previewBlock = {
            id: 'preview',
            x,
            y,
            width,
            height,
            startTime: GridUtils.getTimeFromY(y, this.config),
            duration: GridUtils.getDurationInMinutes(height, this.config),
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
        if (confirm('Are you sure you want to clear all blocks?')) {
            this.blockManager.clearAll();
            this.render();
        }
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
        // Could be enhanced with a proper notification system
        alert(message);
    }
}
//# sourceMappingURL=week-planner.js.map