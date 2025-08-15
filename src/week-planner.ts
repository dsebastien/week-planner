import { TimeBlock, GridConfig, Point } from './types.js';
import { GridUtils } from './grid-utils.js';
import { TimeBlockManager } from './time-block-manager.js';
import { CanvasRenderer } from './canvas-renderer.js';

export class WeekPlanner {
    private canvas: HTMLCanvasElement;
    private renderer!: CanvasRenderer;
    private blockManager!: TimeBlockManager;
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
            timeSlotHeight: 24,
            dayWidth: 140,
            headerHeight: 50,
            timeColumnWidth: 80,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        };

        this.canvas = document.getElementById('weekCanvas') as HTMLCanvasElement;
        this.textInput = document.getElementById('textInput') as HTMLInputElement;
        this.colorPicker = document.getElementById('blockColor') as HTMLInputElement;
        
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

    private setupCanvas(): void {
        // Force container to full viewport
        const container = this.canvas.parentElement!;
        container.style.width = '100vw';
        container.style.height = '100vh';
        
        // Get ACTUAL container dimensions after forcing size
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - 80; // Account for toolbar
        
        // FORCE canvas to these exact dimensions
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
        
        // Calculate grid to fill ENTIRE canvas
        const totalHours = this.config.endHour - this.config.startHour;
        
        this.config.timeColumnWidth = 120;
        this.config.headerHeight = 60;
        this.config.dayWidth = (containerWidth - this.config.timeColumnWidth) / 7;
        this.config.timeSlotHeight = (containerHeight - this.config.headerHeight) / (totalHours * 2);
        
        this.config.canvasWidth = containerWidth;
        this.config.canvasHeight = containerHeight;
        
        // Update block manager with new configuration
        if (this.blockManager) {
            this.blockManager.updateConfig(this.config);
        }
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

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.renderer) {
                this.renderer = new CanvasRenderer(this.canvas, this.config);
            }
            this.render();
        });
    }

    private updateCursor(x: number, y: number): void {
        const gridStartX = 0;
        const gridStartY = 0;
        
        // Check if mouse is over a block
        const block = this.blockManager.getBlockAt(x, y);
        
        if (block) {
            this.canvas.classList.remove('creating');
            this.canvas.classList.add('pointer');
        } else if (x >= gridStartX + this.config.timeColumnWidth && y >= gridStartY + this.config.headerHeight) {
            // In grid area
            this.canvas.classList.remove('pointer');
            this.canvas.classList.add('creating');
        } else {
            // Outside grid area
            this.canvas.classList.remove('creating', 'pointer');
        }
    }

    private onMouseDown(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridStartX = 0;
        const gridStartY = 0;

        // Check if click is in the grid area
        if (x < gridStartX + this.config.timeColumnWidth || y < gridStartY + this.config.headerHeight) {
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

    private darkenColor(color: string, factor: number): string {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const newR = Math.round(r * (1 - factor));
        const newG = Math.round(g * (1 - factor));
        const newB = Math.round(b * (1 - factor));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    private getContrastColor(hexColor: string): string {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
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
