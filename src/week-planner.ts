import { TimeBlock, GridConfig, Point } from './types.js';
import { GridUtils } from './grid-utils.js';
import { TimeBlockManager } from './time-block-manager.js';
import { CanvasRenderer } from './canvas-renderer.js';

export class WeekPlanner {
    private canvas: HTMLCanvasElement;
    private renderer: CanvasRenderer;
    private blockManager: TimeBlockManager;
    private config: GridConfig;
    private textInput: HTMLInputElement;
    private colorPicker: HTMLInputElement;

    private isDragging = false;
    private dragStartPoint: Point | null = null;
    private currentDragBlock: TimeBlock | null = null;
    private editingBlock: TimeBlock | null = null;

    constructor() {
        this.config = {
            startHour: 6,
            endHour: 24,
            timeSlotHeight: 20,
            dayWidth: 140,
            headerHeight: 40,
            timeColumnWidth: 80,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        };

        this.canvas = document.getElementById('weekCanvas') as HTMLCanvasElement;
        this.textInput = document.getElementById('textInput') as HTMLInputElement;
        this.colorPicker = document.getElementById('blockColor') as HTMLInputElement;
        
        this.renderer = new CanvasRenderer(this.canvas, this.config);
        this.blockManager = new TimeBlockManager();

        this.setupEventListeners();
        this.render();
    }

    private setupEventListeners(): void {
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

    private onMouseDown(event: MouseEvent): void {
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
        } else {
            // Start creating a new block
            this.blockManager.selectBlock(null);
            this.isDragging = true;
            this.dragStartPoint = GridUtils.snapToGrid(x, y, this.config);
        }
        
        this.render();
    }

    private onMouseMove(event: MouseEvent): void {
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

    private onMouseUp(event: MouseEvent): void {
        if (!this.isDragging || !this.currentDragBlock) {
            this.isDragging = false;
            this.dragStartPoint = null;
            this.currentDragBlock = null;
            return;
        }

        // Create the actual block
        const block: TimeBlock = {
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

    private onDoubleClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedBlock = this.blockManager.getBlockAt(x, y);
        if (clickedBlock) {
            this.startEditingBlock(clickedBlock);
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            const selectedBlock = this.blockManager.getSelectedBlock();
            if (selectedBlock && !this.editingBlock) {
                this.blockManager.removeBlock(selectedBlock.id);
                this.render();
            }
        } else if (event.key === 'Escape') {
            this.stopEditingBlock();
        }
    }

    private startEditingBlock(block: TimeBlock): void {
        this.editingBlock = block;
        this.textInput.value = block.text;
        this.textInput.style.display = 'block';
        this.textInput.style.left = `${block.x + 4}px`;
        this.textInput.style.top = `${block.y + block.height / 2 - 10}px`;
        this.textInput.style.width = `${Math.max(100, block.width - 8)}px`;
        this.textInput.focus();
        this.textInput.select();
    }

    private stopEditingBlock(): void {
        if (this.editingBlock) {
            this.blockManager.updateBlockText(this.editingBlock.id, this.textInput.value);
            this.editingBlock = null;
            this.textInput.style.display = 'none';
            this.render();
        }
    }

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

    private drawPreviewBlock(block: TimeBlock): void {
        const ctx = this.canvas.getContext('2d')!;
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

    private generateBlockId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    private render(): void {
        this.renderer.render(this.blockManager.getBlocks());
    }

    private exportSVG(): void {
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

    private exportPNG(): void {
        const link = document.createElement('a');
        link.download = 'week-planner.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    private clearAll(): void {
        if (confirm('Are you sure you want to clear all blocks?')) {
            this.blockManager.clearAll();
            this.render();
        }
    }
}
