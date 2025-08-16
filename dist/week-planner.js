import { GridUtils } from './grid-utils.js';
import { TimeBlockManager } from './time-block-manager.js';
import { CanvasRenderer } from './canvas-renderer.js';
export class WeekPlanner {
    constructor() {
        this.isDragging = false;
        this.dragStartPoint = null;
        this.currentDragBlock = null;
        this.editingBlock = null;
        this.config = {
            startHour: 6,
            endHour: 24,
            timeSlotHeight: 24,
            dayWidth: 140,
            headerHeight: 50,
            timeColumnWidth: 80,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        };
        this.canvas = document.getElementById('weekCanvas');
        this.textInput = document.getElementById('textInput');
        this.colorPicker = document.getElementById('blockColor');
        // Initialize block manager first
        this.blockManager = new TimeBlockManager(this.config);
        // Wait for next frame to ensure layout is complete
        requestAnimationFrame(() => {
            this.setupCanvas();
            this.renderer = new CanvasRenderer(this.canvas, this.config);
            this.setupEventListeners();
            this.render();
        });
    }
    setupCanvas() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
        const totalHours = this.config.endHour - this.config.startHour;
        this.config.timeColumnWidth = 120;
        this.config.headerHeight = 60;
        // Calculate exact day width so 7 days fit perfectly
        const availableWidth = containerWidth - this.config.timeColumnWidth;
        this.config.dayWidth = availableWidth / 7; // Use exact division to utilize all available space
        this.config.timeSlotHeight = (containerHeight - this.config.headerHeight) / (totalHours * 2);
        this.config.canvasWidth = containerWidth;
        this.config.canvasHeight = containerHeight;
        if (this.blockManager) {
            this.blockManager.updateConfig(this.config);
        }
    }
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        // Text input events
        this.textInput.addEventListener('blur', this.onTextInputBlur.bind(this));
        this.textInput.addEventListener('keydown', this.onTextInputKeyDown.bind(this));
        // Toolbar events
        document.getElementById('exportSVG')?.addEventListener('click', this.exportSVG.bind(this));
        document.getElementById('exportPNG')?.addEventListener('click', this.exportPNG.bind(this));
        document.getElementById('clearAll')?.addEventListener('click', this.clearAll.bind(this));
        // Toolbar toggle functionality
        const toolbarToggle = document.getElementById('toolbarToggle');
        const toolbarMenu = document.getElementById('toolbarMenu');
        toolbarToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            toolbarMenu?.classList.toggle('visible');
        });
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toolbarToggle?.contains(e.target) && !toolbarMenu?.contains(e.target)) {
                toolbarMenu?.classList.remove('visible');
            }
        });
        // Window resize and zoom handling
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                if (this.renderer) {
                    this.renderer = new CanvasRenderer(this.canvas, this.config);
                }
                this.render();
            }, 100);
        });
        // Handle zoom changes
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                // Zoom detected, recalculate after a short delay
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.setupCanvas();
                    if (this.renderer) {
                        this.renderer = new CanvasRenderer(this.canvas, this.config);
                    }
                    this.render();
                }, 200);
            }
        });
    }
    updateCursor(x, y) {
        const block = this.blockManager.getBlockAt(x, y);
        if (block) {
            this.canvas.classList.remove('creating');
            this.canvas.classList.add('pointer');
        }
        else if (x >= this.config.timeColumnWidth && y >= this.config.headerHeight) {
            this.canvas.classList.remove('pointer');
            this.canvas.classList.add('creating');
        }
        else {
            this.canvas.classList.remove('creating', 'pointer');
        }
    }
    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // Check if click is in the valid grid area (not in time column or header)
        if (x < this.config.timeColumnWidth || y < this.config.headerHeight) {
            return;
        }
        // Also check if we're beyond the right edge of the grid
        const gridEndX = this.config.timeColumnWidth + (this.config.days.length * this.config.dayWidth);
        if (x >= gridEndX) {
            return;
        }
        const clickedBlock = this.blockManager.getBlockAt(x, y);
        if (clickedBlock) {
            // Select the clicked block
            this.blockManager.selectBlock(clickedBlock.id);
        }
        else {
            // Start creating a new block
            this.blockManager.selectBlock(null);
            this.isDragging = true;
            this.dragStartPoint = GridUtils.snapToGrid(x, y, this.config);
        }
        this.render();
    }
    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // Update cursor if not dragging
        if (!this.isDragging) {
            this.updateCursor(x, y);
        }
        if (!this.isDragging || !this.dragStartPoint) {
            return;
        }
        const snappedPoint = GridUtils.snapToGrid(x, y, this.config);
        // Calculate which days the block spans
        const startDay = GridUtils.getDayFromX(this.dragStartPoint.x, this.config);
        const endDay = GridUtils.getDayFromX(snappedPoint.x, this.config);
        const minDay = Math.min(startDay, endDay);
        const maxDay = Math.max(startDay, endDay);
        const daySpan = maxDay - minDay + 1;
        // Calculate dimensions based on day boundaries
        const finalX = GridUtils.getXFromDay(minDay, this.config);
        const finalWidth = daySpan * this.config.dayWidth;
        // Calculate height normally
        const height = Math.abs(snappedPoint.y - this.dragStartPoint.y);
        const finalHeight = Math.max(this.config.timeSlotHeight, height);
        const finalY = Math.min(this.dragStartPoint.y, snappedPoint.y);
        // Strict grid boundaries - prevent any overflow
        const gridStartX = this.config.timeColumnWidth;
        const gridEndX = this.config.timeColumnWidth + (this.config.days.length * this.config.dayWidth);
        // Ensure block doesn't extend beyond grid
        const constrainedX = Math.max(gridStartX, Math.min(finalX, gridEndX - finalWidth));
        const maxWidth = gridEndX - constrainedX;
        const constrainedWidth = Math.min(finalWidth, maxWidth);
        // Create preview block
        this.currentDragBlock = {
            id: 'preview',
            x: constrainedX,
            y: finalY,
            width: constrainedWidth,
            height: finalHeight,
            startTime: GridUtils.getTimeFromY(finalY, this.config),
            duration: GridUtils.getDurationInMinutes(finalHeight, this.config),
            daySpan: daySpan, // Use calculated daySpan directly
            text: '',
            color: this.colorPicker.value,
            selected: false
        };
        this.render();
        // Draw preview block with transparency
        if (this.currentDragBlock) {
            this.drawPreviewBlock(this.currentDragBlock);
        }
    }
    onMouseUp(event) {
        if (!this.isDragging || !this.currentDragBlock) {
            this.isDragging = false;
            this.dragStartPoint = null;
            this.currentDragBlock = null;
            return;
        }
        // Create the actual block
        const block = {
            ...this.currentDragBlock,
            id: this.generateBlockId(),
            selected: true
        };
        const success = this.blockManager.addBlock(block);
        if (success) {
            this.blockManager.selectBlock(block.id);
        }
        this.isDragging = false;
        this.dragStartPoint = null;
        this.currentDragBlock = null;
        this.render();
    }
    onDoubleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const clickedBlock = this.blockManager.getBlockAt(x, y);
        if (clickedBlock) {
            this.startEditingBlock(clickedBlock);
        }
    }
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
    stopEditingBlock() {
        if (this.editingBlock) {
            this.blockManager.updateBlockText(this.editingBlock.id, this.textInput.value);
            this.editingBlock = null;
            this.textInput.style.display = 'none';
            this.render();
        }
    }
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
    drawPreviewBlock(block) {
        const ctx = this.canvas.getContext('2d');
        // Draw preview block with transparency
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        // Draw dashed border
        ctx.strokeStyle = this.darkenColor(block.color, 0.3);
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        ctx.setLineDash([]);
        // Draw time information
        ctx.globalAlpha = 1.0;
        const startTime = GridUtils.formatTime(block.startTime);
        const endTime = GridUtils.formatTime(block.startTime + block.duration);
        const timeText = `${startTime} - ${endTime}`;
        ctx.fillStyle = this.getContrastColor(block.color);
        ctx.font = '500 11px Inter, "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeText, block.x + block.width / 2, block.y + block.height / 2);
        ctx.globalAlpha = 1.0;
    }
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const newR = Math.round(r * (1 - factor));
        const newG = Math.round(g * (1 - factor));
        const newB = Math.round(b * (1 - factor));
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    getContrastColor(hexColor) {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }
    generateBlockId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 11);
    }
    render() {
        this.renderer.render(this.blockManager.getBlocks());
    }
    exportSVG() {
        const svg = this.renderer.exportSVG(this.blockManager.getBlocks());
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'week-planner.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    exportPNG() {
        const link = document.createElement('a');
        link.download = 'week-planner.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    clearAll() {
        if (confirm('Are you sure you want to clear all blocks?')) {
            this.blockManager.clearAll();
            this.render();
        }
    }
}
//# sourceMappingURL=week-planner.js.map