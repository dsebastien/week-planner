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
            timeSlotHeight: 20,
            dayWidth: 140,
            headerHeight: 40,
            timeColumnWidth: 80,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        };
        this.canvas = document.getElementById('weekCanvas');
        this.textInput = document.getElementById('textInput');
        this.colorPicker = document.getElementById('blockColor');
        this.renderer = new CanvasRenderer(this.canvas, this.config);
        this.blockManager = new TimeBlockManager();
        this.setupEventListeners();
        this.render();
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
    }
    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // Check if click is in the grid area
        if (x < this.config.timeColumnWidth || y < this.config.headerHeight) {
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
        if (!this.isDragging || !this.dragStartPoint) {
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const snappedPoint = GridUtils.snapToGrid(x, y, this.config);
        // Calculate dimensions
        const width = Math.abs(snappedPoint.x - this.dragStartPoint.x);
        const height = Math.abs(snappedPoint.y - this.dragStartPoint.y);
        // Ensure minimum size
        const finalWidth = Math.max(this.config.dayWidth, width);
        const finalHeight = Math.max(this.config.timeSlotHeight, height);
        // Calculate position (top-left corner)
        const finalX = Math.min(this.dragStartPoint.x, snappedPoint.x);
        const finalY = Math.min(this.dragStartPoint.y, snappedPoint.y);
        // Constrain to grid boundaries
        const maxX = this.config.timeColumnWidth + (this.config.days.length - 1) * this.config.dayWidth;
        const constrainedX = Math.min(finalX, maxX);
        const constrainedWidth = Math.min(finalWidth, maxX + this.config.dayWidth - constrainedX);
        // Create preview block
        this.currentDragBlock = {
            id: 'preview',
            x: constrainedX,
            y: finalY,
            width: constrainedWidth,
            height: finalHeight,
            startTime: GridUtils.getTimeFromY(finalY, this.config),
            duration: GridUtils.getDurationInMinutes(finalHeight, this.config),
            daySpan: GridUtils.getDaySpan(constrainedWidth, this.config),
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
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
    }
    generateBlockId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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