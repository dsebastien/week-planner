import { GridConfig, TimeBlock, RenderedTimeBlock, HexColor, Point, ResizeHandle, TextAlignment } from './types.js';
import { GridUtils } from './grid-utils.js';

/**
 * Handles all Canvas drawing operations and export functionality
 */
export class CanvasRenderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private config: GridConfig;

    // Modern theme colors
    private static readonly THEME = {
        background: '#0f172a',          // dark-900
        gridBackground: '#1e293b',      // dark-800  
        headerBackground: '#334155',    // dark-700
        timeColumnBackground: '#1e293b', // dark-800
        primaryText: '#ffffff',
        secondaryText: '#cbd5e1',       // dark-300
        gridLines: '#475569',           // dark-600
        hourLines: '#64748b',           // dark-500
        separatorLines: '#64748b',      // dark-500
        selectionHighlight: '#3b82f6',  // primary-500
        lunchTimeBackground: '#334155'  // dark-700 - slightly lighter for lunch time
    } as const;

    // Typography
    private static readonly FONTS = {
        dayHeader: '600 16px Inter, "Segoe UI", system-ui, sans-serif',
        timeHour: '600 14px Inter, "Segoe UI", system-ui, sans-serif',
        timeHalf: '500 12px Inter, "Segoe UI", system-ui, sans-serif',
        blockText: '500 16px Inter, "Segoe UI", system-ui, sans-serif',
        blockTime: '500 13px Inter, "Segoe UI", system-ui, sans-serif'
    } as const;

    constructor(canvas: HTMLCanvasElement, config: GridConfig) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context');
        }
        this.ctx = context;
        this.config = config;
        this.setupHighQualityRendering();
    }

    /**
     * Main render method - draws the complete week planner
     */
    render(blocks: readonly RenderedTimeBlock[]): void {
        this.clear();
        this.drawGrid();
        this.drawBlocks(blocks);
    }

    /**
     * Draws a preview block with transparency (used during drag operations)
     */
    drawPreviewBlock(block: RenderedTimeBlock): void {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        
        // Draw preview block
        this.ctx.fillStyle = block.color;
        this.ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Draw dashed border
        this.ctx.strokeStyle = this.adjustColorBrightness(block.color, -30);
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.strokeRect(block.x, block.y, block.width, block.height);
        this.ctx.setLineDash([]);
        
        this.ctx.globalAlpha = 1.0;
        
        // Draw time information
        this.ctx.fillStyle = this.getContrastColor(block.color);
        
        if (block.height < 40) {
            // Compact time display for small preview blocks
            const timeInfo = this.getBlockTimeInfo(block);
            this.ctx.font = '500 12px Inter, "Segoe UI", system-ui, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(timeInfo, block.x + block.width / 2, block.y + block.height / 2);
        } else {
            // Full time info for larger preview blocks
            const timeInfo = this.getBlockTimeInfo(block);
            this.ctx.font = CanvasRenderer.FONTS.blockTime;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(timeInfo, block.x + block.width / 2, block.y + block.height / 2);
        }
        
        this.ctx.restore();
    }

    /**
     * Updates the configuration and triggers re-setup if needed
     */
    updateConfig(newConfig: GridConfig): void {
        this.config = newConfig;
    }

    /**
     * Exports the current canvas as SVG
     */
    exportSVG(blocks: readonly RenderedTimeBlock[]): string {
        const svgElements = [
            this.createSVGRoot(),
            this.generateBackgroundSVG(),
            this.generateGridSVG(),
            ...blocks.map(block => this.generateBlockSVG(block)),
            '</svg>'
        ];
        
        return svgElements.join('\n');
    }

    /**
     * Clears the canvas with background color
     */
    private clear(): void {
        this.ctx.fillStyle = CanvasRenderer.THEME.background;
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    }

    /**
     * Sets up high-quality rendering options
     */
    private setupHighQualityRendering(): void {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        // Note: textRenderingOptimization is not standard in all browsers
    }

    /**
     * Draws the complete grid structure
     */
    private drawGrid(): void {
        this.drawBackground();
        this.drawLunchTimeBackground();
        this.drawDayHeaders();
        this.drawTimeLabels();
        this.drawGridLines();
        this.drawSeparators();
    }

    /**
     * Draws background areas for time column and header
     */
    private drawBackground(): void {
        // Time column background
        this.ctx.fillStyle = CanvasRenderer.THEME.timeColumnBackground;
        this.ctx.fillRect(0, 0, this.config.timeColumnWidth, this.config.canvasHeight);

        // Header background
        this.ctx.fillStyle = CanvasRenderer.THEME.headerBackground;
        this.ctx.fillRect(
            this.config.timeColumnWidth, 
            0, 
            this.config.canvasWidth - this.config.timeColumnWidth, 
            this.config.headerHeight
        );
    }

    /**
     * Draws lighter background for lunch time (12:00-14:00)
     */
    private drawLunchTimeBackground(): void {
        const lunchStartHour = 12;
        const lunchEndHour = 14;
        
        // Only draw if lunch time falls within our configured hours
        if (lunchStartHour >= this.config.startHour && lunchStartHour < this.config.endHour) {
            const startTime = lunchStartHour * 60; // 12:00 in minutes
            const endTime = Math.min(lunchEndHour * 60, this.config.endHour * 60); // 14:00 or config end, whichever is earlier
            
            const startY = this.config.headerHeight + 
                ((startTime - this.config.startHour * 60) / 30) * this.config.timeSlotHeight;
            const endY = this.config.headerHeight + 
                ((endTime - this.config.startHour * 60) / 30) * this.config.timeSlotHeight;
            
            const gridWidth = this.config.days.length * this.config.dayWidth;
            
            this.ctx.fillStyle = CanvasRenderer.THEME.lunchTimeBackground;
            this.ctx.fillRect(
                this.config.timeColumnWidth,
                startY,
                gridWidth,
                endY - startY
            );
        }
    }

    /**
     * Draws day headers
     */
    private drawDayHeaders(): void {
        this.ctx.fillStyle = CanvasRenderer.THEME.primaryText;
        this.ctx.font = CanvasRenderer.FONTS.dayHeader;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + (i + 0.5) * this.config.dayWidth;
            const y = this.config.headerHeight / 2;
            this.ctx.fillText(this.config.days[i] || '', x, y);
        }
    }

    /**
     * Draws time labels in the left column
     */
    private drawTimeLabels(): void {
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        
        const totalHours = this.config.endHour - this.config.startHour;
        const totalSlots = totalHours * 2; // 30-minute slots
        
        // Draw time labels for actual time slots (0 to totalSlots-1)
        for (let i = 0; i < totalSlots; i++) {
            const minutes = this.config.startHour * 60 + i * 30;
            const timeStr = GridUtils.formatTime(minutes);
            
            // Position labels slightly offset from grid lines to avoid overlap
            const y = this.config.headerHeight + i * this.config.timeSlotHeight + (i === 0 ? 8 : 0);
            
            // Make sure we don't draw labels beyond the visible canvas area
            if (y + 10 > this.config.canvasHeight) continue;
            
            if (i % 2 === 0) { // Full hour
                this.ctx.fillStyle = CanvasRenderer.THEME.primaryText;
                this.ctx.font = CanvasRenderer.FONTS.timeHour;
            } else { // Half hour
                this.ctx.fillStyle = CanvasRenderer.THEME.secondaryText;
                this.ctx.font = CanvasRenderer.FONTS.timeHalf;
            }
            
            this.ctx.fillText(timeStr, this.config.timeColumnWidth - 8, y);
        }
        
        // Draw the final 00:00 label at the bottom boundary (non-interactive)
        const finalY = this.config.headerHeight + totalSlots * this.config.timeSlotHeight;
        if (finalY + 10 <= this.config.canvasHeight) {
            this.ctx.fillStyle = CanvasRenderer.THEME.primaryText;
            this.ctx.font = CanvasRenderer.FONTS.timeHour;
            this.ctx.fillText('00:00', this.config.timeColumnWidth - 8, finalY);
        }
    }

    /**
     * Draws grid lines (vertical and horizontal)
     */
    private drawGridLines(): void {
        const totalHours = this.config.endHour - this.config.startHour;
        const gridWidth = this.config.days.length * this.config.dayWidth;
        
        // Vertical lines (day separators)
        for (let i = 0; i <= this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + i * this.config.dayWidth;
            this.drawVerticalLine(x, this.config.headerHeight, this.config.canvasHeight, CanvasRenderer.THEME.gridLines);
        }

        // Horizontal lines (time slots)
        for (let i = 0; i <= totalHours * 2; i++) {
            const y = this.config.headerHeight + i * this.config.timeSlotHeight;
            const isHourLine = i % 2 === 0;
            const color = isHourLine ? CanvasRenderer.THEME.hourLines : CanvasRenderer.THEME.gridLines;
            const width = isHourLine ? 1.5 : 1;
            
            this.drawHorizontalLine(
                this.config.timeColumnWidth, 
                this.config.timeColumnWidth + gridWidth, 
                y, 
                color, 
                width
            );
        }
    }

    /**
     * Draws separator lines for header and time column
     */
    private drawSeparators(): void {
        const gridWidth = this.config.days.length * this.config.dayWidth;
        
        // Header separator
        this.drawHorizontalLine(
            0, 
            this.config.timeColumnWidth + gridWidth, 
            this.config.headerHeight, 
            CanvasRenderer.THEME.separatorLines, 
            2
        );
        
        // Time column separator
        this.drawVerticalLine(
            this.config.timeColumnWidth, 
            0, 
            this.config.canvasHeight, 
            CanvasRenderer.THEME.separatorLines, 
            2
        );
    }

    /**
     * Draws all time blocks
     */
    private drawBlocks(blocks: readonly RenderedTimeBlock[]): void {
        // Sort blocks by position for consistent rendering order
        const sortedBlocks = [...blocks].sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        for (const block of sortedBlocks) {
            this.drawBlock(block);
        }
    }

    /**
     * Draws a single time block
     */
    private drawBlock(block: RenderedTimeBlock): void {
        this.drawBlockBackground(block);
        this.drawBlockBorder(block);
        this.drawBlockSelection(block);
        this.drawBlockTimeInfo(block);
        this.drawBlockText(block);
        this.drawResizeHandles(block);
    }

    /**
     * Draws block background with modern gradient effect
     */
    private drawBlockBackground(block: RenderedTimeBlock): void {
        this.ctx.save();
        
        // Create path for rounded rectangle if corner radius is set
        if (block.cornerRadius > 0) {
            this.drawRoundedRect(block.x, block.y, block.width, block.height, block.cornerRadius);
            this.ctx.clip();
        }
        
        // Create subtle gradient for depth
        const gradient = this.ctx.createLinearGradient(
            block.x, block.y, 
            block.x, block.y + block.height
        );
        
        // Parse hex color and create lighter/darker variants
        const baseColor = block.color;
        const lighterColor = this.adjustColorBrightness(baseColor, 10);
        const darkerColor = this.adjustColorBrightness(baseColor, -10);
        
        gradient.addColorStop(0, lighterColor);
        gradient.addColorStop(1, darkerColor);
        
        this.ctx.fillStyle = gradient;
        
        if (block.cornerRadius > 0) {
            this.ctx.fill();
        } else {
            this.ctx.fillRect(block.x, block.y, block.width, block.height);
        }
        
        // Add subtle inner glow for modern look
        if (block.selected) {
            this.ctx.shadowColor = this.adjustColorBrightness(baseColor, 30);
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.fillStyle = this.adjustColorBrightness(baseColor, 5);
            
            if (block.cornerRadius > 0) {
                this.drawRoundedRect(block.x + 1, block.y + 1, block.width - 2, block.height - 2, Math.max(0, block.cornerRadius - 1));
                this.ctx.fill();
            } else {
                this.ctx.fillRect(block.x + 1, block.y + 1, block.width - 2, block.height - 2);
            }
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
    }

    /**
     * Draws block border (inner border)
     */
    private drawBlockBorder(block: RenderedTimeBlock): void {
        this.ctx.save();
        
        const borderStyle = block.borderStyle;
        this.ctx.strokeStyle = borderStyle.color;
        const lineWidth = block.selected ? Math.max(borderStyle.width, 3) : borderStyle.width;
        this.ctx.lineWidth = lineWidth;
        
        // Set line dash pattern based on border style
        switch (borderStyle.style) {
            case 'dashed':
                this.ctx.setLineDash([8, 4]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 2]);
                break;
            case 'solid':
            default:
                this.ctx.setLineDash([]);
                break;
        }
        
        // Calculate inner border rectangle (inset by half the line width to draw inside)
        const halfLineWidth = lineWidth / 2;
        const innerX = block.x + halfLineWidth;
        const innerY = block.y + halfLineWidth;
        const innerWidth = block.width - lineWidth;
        const innerHeight = block.height - lineWidth;
        const innerRadius = Math.max(0, block.cornerRadius - halfLineWidth);
        
        if (block.cornerRadius > 0) {
            this.drawRoundedRect(innerX, innerY, innerWidth, innerHeight, innerRadius);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(innerX, innerY, innerWidth, innerHeight);
        }
        
        // Reset line dash
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    /**
     * Draws a rounded rectangle path
     */
    private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + radius, radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.arcTo(x, y + height, x, y + height - radius, radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.arcTo(x, y, x + radius, y, radius);
        this.ctx.closePath();
    }

    /**
     * Draws selection highlight if block is selected
     */
    private drawBlockSelection(block: RenderedTimeBlock): void {
        if (!block.selected) return;

        this.ctx.strokeStyle = CanvasRenderer.THEME.selectionHighlight;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            block.x - 2, 
            block.y - 2, 
            block.width + 4, 
            block.height + 4
        );
        this.ctx.setLineDash([]);
    }

    /**
     * Draws time information in the top-left corner of the block
     */
    private drawBlockTimeInfo(block: RenderedTimeBlock): void {
        this.ctx.save();
        this.ctx.fillStyle = block.textColor;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        const isSmallBlock = block.height < 40;
        
        if (isSmallBlock) {
            // Compact format for small blocks: use full time range
            const timeInfo = this.getBlockTimeInfo(block);
            this.ctx.font = '500 12px Inter, "Segoe UI", system-ui, sans-serif';
            this.ctx.fillText(timeInfo, block.x + 3, block.y + 2);
        } else {
            // Full format for larger blocks
            const timeInfo = this.getBlockTimeInfo(block);
            this.ctx.font = CanvasRenderer.FONTS.blockTime;
            this.ctx.fillText(timeInfo, block.x + 6, block.y + 6);
        }
        
        this.ctx.restore();
    }

    /**
     * Draws block text with automatic wrapping
     */
    private drawBlockText(block: RenderedTimeBlock): void {
        if (!block.text.trim()) return;

        this.ctx.save();
        
        // Use block's text color
        this.ctx.fillStyle = block.textColor;
        
        // Build font string from block properties
        const fontWeight = block.fontStyle.bold ? '700' : '500';
        const fontStyle = block.fontStyle.italic ? 'italic' : 'normal';
        const fontSize = Math.max(8, Math.min(48, block.fontSize)); // Clamp between 8-48px
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Inter, "Segoe UI", system-ui, sans-serif`;
        
        // Set text alignment
        this.ctx.textAlign = block.textAlignment;
        
        const isSmallBlock = block.height < 40;
        this.ctx.textBaseline = isSmallBlock ? 'middle' : 'top';

        const textArea = this.getTextArea(block);
        
        if (isSmallBlock) {
            // For small blocks, use simple vertical positioning
            const textY = this.getVerticalTextY(block, block.text, true);
            const textX = this.getTextX(block, textArea.x);
            this.ctx.fillText(block.text, textX, textY);
        } else {
            // For larger blocks, use wrapped text with vertical alignment
            const textX = this.getTextX(block, textArea.x);
            this.drawWrappedTextWithVerticalAlignment(block, block.text, textX, textArea.maxWidth, textArea.maxHeight);
        }
        
        
        this.ctx.restore();
    }

    /**
     * Draws text with automatic line wrapping
     */
    private drawWrappedText(text: string, x: number, y: number, maxWidth: number, maxHeight: number): void {
        const words = text.split(' ');
        const lineHeight = 16;
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                this.ctx.fillText(line.trim(), x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
                
                if (currentY + lineHeight > y + maxHeight) {
                    // Truncate with ellipsis
                    const truncated = line.trim() + '...';
                    this.ctx.fillText(truncated, x, currentY);
                    break;
                }
            } else {
                line = testLine;
            }
        }
        
        // Draw the last line if within bounds
        if (currentY + lineHeight <= y + maxHeight && line.trim()) {
            this.ctx.fillText(line.trim(), x, currentY);
        }
    }

    /**
     * Utility methods for drawing basic shapes
     */
    private drawHorizontalLine(x1: number, x2: number, y: number, color: string, width = 1): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y);
        this.ctx.lineTo(x2, y);
        this.ctx.stroke();
    }

    private drawVerticalLine(x: number, y1: number, y2: number, color: string, width = 1): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y1);
        this.ctx.lineTo(x, y2);
        this.ctx.stroke();
    }

    /**
     * Helper methods for block content layout
     */
    private getBlockTimeInfo(block: RenderedTimeBlock): string {
        const startTime = GridUtils.formatTime(block.startTime);
        const endTime = GridUtils.formatTime(block.startTime + block.duration);
        
        // For 30-minute blocks, don't show duration to save space for text
        if (block.duration === 30) {
            return `${startTime}-${endTime}`;
        }
        
        const duration = GridUtils.formatDuration(block.duration);
        return `${startTime}-${endTime} (${duration})`;
    }


    /**
     * Gets X position for text based on alignment
     */
    private getTextX(block: RenderedTimeBlock, defaultX: number): number {
        switch (block.textAlignment) {
            case 'left':
                return block.x + 8;
            case 'right':
                return block.x + block.width - 8;
            case 'center':
            default:
                return defaultX;
        }
    }


    private getTextArea(block: RenderedTimeBlock): { x: number; y: number; maxWidth: number; maxHeight: number } {
        // Adaptive layout based on block height
        const isSmallBlock = block.height < 40;
        const padding = isSmallBlock ? 3 : 8;
        const timeInfoHeight = isSmallBlock ? 12 : 20; // Compact time info for small blocks
        
        return {
            x: block.x + block.width / 2,
            y: block.y + timeInfoHeight + padding,
            maxWidth: block.width - 2 * padding,
            maxHeight: Math.max(0, block.height - timeInfoHeight - 2 * padding)
        };
    }

    /**
     * Calculate vertical position for text based on alignment
     */
    private getVerticalTextY(block: RenderedTimeBlock, text: string, isSmallBlock: boolean): number {
        const textArea = this.getTextArea(block);
        
        if (isSmallBlock) {
            // For small blocks, use simple positioning within available area
            switch (block.verticalAlignment) {
                case 'top':
                    return textArea.y;
                case 'bottom':
                    return textArea.y + textArea.maxHeight;
                case 'middle':
                default:
                    return block.y + block.height / 2;
            }
        } else {
            // For larger blocks, calculate based on text content
            const lineHeight = 16;
            const lines = this.getTextLines(text, textArea.maxWidth);
            const totalTextHeight = lines.length * lineHeight;
            
            switch (block.verticalAlignment) {
                case 'top':
                    return textArea.y;
                case 'bottom':
                    return textArea.y + textArea.maxHeight - totalTextHeight;
                case 'middle':
                default:
                    return textArea.y + (textArea.maxHeight - totalTextHeight) / 2;
            }
        }
    }

    /**
     * Get text lines for wrapping calculation
     */
    private getTextLines(text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let line = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                lines.push(line.trim());
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        
        if (line.trim()) {
            lines.push(line.trim());
        }
        
        return lines;
    }

    /**
     * Draw wrapped text with vertical alignment support
     */
    private drawWrappedTextWithVerticalAlignment(block: RenderedTimeBlock, text: string, x: number, maxWidth: number, maxHeight: number): void {
        const lineHeight = 16;
        const lines = this.getTextLines(text, maxWidth);
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate starting Y position based on vertical alignment
        const startY = this.getVerticalTextY(block, text, false);
        
        // Draw each line
        let currentY = startY;
        for (let i = 0; i < lines.length; i++) {
            if (currentY + lineHeight > this.getTextArea(block).y + maxHeight) {
                // Truncate with ellipsis if we exceed bounds
                if (i > 0) {
                    const truncated = lines[i] + '...';
                    this.ctx.fillText(truncated, x, currentY);
                }
                break;
            }
            
            this.ctx.fillText(lines[i]!, x, currentY);
            currentY += lineHeight;
        }
    }

    /**
     * Color utility methods
     */
    private adjustColorBrightness(hexColor: HexColor, percent: number): string {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const adjust = (color: number) => {
            const adjusted = color + (color * percent / 100);
            return Math.max(0, Math.min(255, Math.round(adjusted)));
        };

        const newR = adjust(r);
        const newG = adjust(g);
        const newB = adjust(b);

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    private getContrastColor(hexColor: HexColor): string {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    /**
     * Draws resize handles on selected blocks
     */
    private drawResizeHandles(block: RenderedTimeBlock): void {
        if (!block.selected) return;

        const handleSize = 8;
        const handleColor = CanvasRenderer.THEME.selectionHighlight;
        const handleBorderColor = '#ffffff';

        // Define handle positions
        const handles = this.getResizeHandlePositions(block, handleSize);

        // Draw each handle
        for (const [handle, position] of handles.entries()) {
            this.ctx.fillStyle = handleColor;
            this.ctx.fillRect(position.x, position.y, handleSize, handleSize);
            
            this.ctx.strokeStyle = handleBorderColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(position.x, position.y, handleSize, handleSize);
        }
    }

    /**
     * Gets resize handle positions for a block
     */
    private getResizeHandlePositions(block: RenderedTimeBlock, handleSize: number): Map<ResizeHandle, Point> {
        const handles = new Map<ResizeHandle, Point>();
        const half = handleSize / 2;

        // Corner handles
        handles.set('top-left', { x: block.x - half, y: block.y - half });
        handles.set('top-right', { x: block.x + block.width - half, y: block.y - half });
        handles.set('bottom-left', { x: block.x - half, y: block.y + block.height - half });
        handles.set('bottom-right', { x: block.x + block.width - half, y: block.y + block.height - half });

        // Edge handles (only show for blocks large enough)
        if (block.width > 60) {
            handles.set('top', { x: block.x + block.width / 2 - half, y: block.y - half });
            handles.set('bottom', { x: block.x + block.width / 2 - half, y: block.y + block.height - half });
        }
        
        if (block.height > 60) {
            handles.set('left', { x: block.x - half, y: block.y + block.height / 2 - half });
            handles.set('right', { x: block.x + block.width - half, y: block.y + block.height / 2 - half });
        }

        return handles;
    }

    /**
     * Checks if a point is over a resize handle
     */
    getResizeHandleAt(point: Point, block: RenderedTimeBlock): ResizeHandle | null {
        if (!block.selected) return null;

        const handleSize = 8;
        const handles = this.getResizeHandlePositions(block, handleSize);

        for (const [handle, position] of handles.entries()) {
            if (point.x >= position.x && 
                point.x <= position.x + handleSize &&
                point.y >= position.y && 
                point.y <= position.y + handleSize) {
                return handle;
            }
        }

        return null;
    }

    /**
     * Gets the appropriate cursor for a resize handle
     */
    getResizeCursor(handle: ResizeHandle): string {
        switch (handle) {
            case 'top':
            case 'bottom':
                return 'ns-resize';
            case 'left':
            case 'right':
                return 'ew-resize';
            case 'top-left':
            case 'bottom-right':
                return 'nw-resize';
            case 'top-right':
            case 'bottom-left':
                return 'ne-resize';
            default:
                return 'default';
        }
    }

    /**
     * SVG export helper methods
     */
    private createSVGRoot(): string {
        return `<svg width="${this.config.canvasWidth}" height="${this.config.canvasHeight}" xmlns="http://www.w3.org/2000/svg">`;
    }

    private generateBackgroundSVG(): string {
        return `<rect width="100%" height="100%" fill="${CanvasRenderer.THEME.background}"/>`;
    }

    private generateGridSVG(): string {
        let svg = '';
        
        // Time column background
        svg += `<rect x="0" y="0" width="${this.config.timeColumnWidth}" height="${this.config.canvasHeight}" fill="${CanvasRenderer.THEME.timeColumnBackground}"/>`;
        
        // Header background
        svg += `<rect x="${this.config.timeColumnWidth}" y="0" width="${this.config.canvasWidth - this.config.timeColumnWidth}" height="${this.config.headerHeight}" fill="${CanvasRenderer.THEME.headerBackground}"/>`;
        
        // Lunch time background (12:00-14:00)
        const lunchStartHour = 12;
        const lunchEndHour = 14;
        if (lunchStartHour >= this.config.startHour && lunchStartHour < this.config.endHour) {
            const startTime = lunchStartHour * 60;
            const endTime = Math.min(lunchEndHour * 60, this.config.endHour * 60);
            const startY = this.config.headerHeight + ((startTime - this.config.startHour * 60) / 30) * this.config.timeSlotHeight;
            const endY = this.config.headerHeight + ((endTime - this.config.startHour * 60) / 30) * this.config.timeSlotHeight;
            const gridWidth = this.config.days.length * this.config.dayWidth;
            svg += `<rect x="${this.config.timeColumnWidth}" y="${startY}" width="${gridWidth}" height="${endY - startY}" fill="${CanvasRenderer.THEME.lunchTimeBackground}"/>`;
        }
        
        // Day headers
        for (let i = 0; i < this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + (i + 0.5) * this.config.dayWidth;
            const y = this.config.headerHeight / 2;
            const dayName = this.config.days[i] || '';
            svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${CanvasRenderer.THEME.primaryText}" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600">${dayName}</text>`;
        }
        
        // Time labels
        const totalHours = this.config.endHour - this.config.startHour;
        const totalSlots = totalHours * 2; // 30-minute slots
        
        for (let i = 0; i < totalSlots; i++) {
            const minutes = this.config.startHour * 60 + i * 30;
            const timeStr = GridUtils.formatTime(minutes);
            const y = this.config.headerHeight + i * this.config.timeSlotHeight + (i === 0 ? 8 : 0);
            
            if (y + 10 > this.config.canvasHeight) continue;
            
            const isHour = i % 2 === 0;
            const textColor = isHour ? CanvasRenderer.THEME.primaryText : CanvasRenderer.THEME.secondaryText;
            const fontSize = isHour ? "14" : "12";
            const fontWeight = isHour ? "600" : "500";
            
            svg += `<text x="${this.config.timeColumnWidth - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" fill="${textColor}" font-family="Inter, system-ui, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}">${timeStr}</text>`;
        }
        
        // Final 00:00 label
        const finalY = this.config.headerHeight + totalSlots * this.config.timeSlotHeight;
        if (finalY + 10 <= this.config.canvasHeight) {
            svg += `<text x="${this.config.timeColumnWidth - 8}" y="${finalY}" text-anchor="end" dominant-baseline="middle" fill="${CanvasRenderer.THEME.primaryText}" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600">00:00</text>`;
        }
        
        // Grid lines
        const gridWidth = this.config.days.length * this.config.dayWidth;
        
        // Vertical lines (day separators)
        for (let i = 0; i <= this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + i * this.config.dayWidth;
            svg += `<line x1="${x}" y1="${this.config.headerHeight}" x2="${x}" y2="${this.config.canvasHeight}" stroke="${CanvasRenderer.THEME.gridLines}" stroke-width="1"/>`;
        }

        // Horizontal lines (time slots)
        for (let i = 0; i <= totalHours * 2; i++) {
            const y = this.config.headerHeight + i * this.config.timeSlotHeight;
            const isHourLine = i % 2 === 0;
            const color = isHourLine ? CanvasRenderer.THEME.hourLines : CanvasRenderer.THEME.gridLines;
            const width = isHourLine ? "1.5" : "1";
            
            svg += `<line x1="${this.config.timeColumnWidth}" y1="${y}" x2="${this.config.timeColumnWidth + gridWidth}" y2="${y}" stroke="${color}" stroke-width="${width}"/>`;
        }
        
        // Separator lines
        // Header separator
        svg += `<line x1="0" y1="${this.config.headerHeight}" x2="${this.config.timeColumnWidth + gridWidth}" y2="${this.config.headerHeight}" stroke="${CanvasRenderer.THEME.separatorLines}" stroke-width="2"/>`;
        
        // Time column separator
        svg += `<line x1="${this.config.timeColumnWidth}" y1="0" x2="${this.config.timeColumnWidth}" y2="${this.config.canvasHeight}" stroke="${CanvasRenderer.THEME.separatorLines}" stroke-width="2"/>`;
        
        return svg;
    }

    private generateBlockSVG(block: RenderedTimeBlock): string {
        const timeInfo = this.getBlockTimeInfo(block);
        let svg = '';
        
        // Add defs for gradients and patterns if needed
        const gradientId = `gradient-${block.id}`;
        const lighterColor = this.adjustColorBrightness(block.color, 10);
        const darkerColor = this.adjustColorBrightness(block.color, -10);
        
        svg += `<defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${lighterColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${darkerColor};stop-opacity:1" />
            </linearGradient>
        </defs>`;
        
        // Create block shape (rectangle or rounded rectangle) with inner border
        const lineWidth = block.selected ? Math.max(block.borderStyle.width, 3) : block.borderStyle.width;
        const halfLineWidth = lineWidth / 2;
        const innerX = block.x + halfLineWidth;
        const innerY = block.y + halfLineWidth;
        const innerWidth = block.width - lineWidth;
        const innerHeight = block.height - lineWidth;
        const innerRadius = Math.max(0, block.cornerRadius - halfLineWidth);
        
        if (block.cornerRadius > 0) {
            // Background with full radius
            svg += `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" 
                rx="${block.cornerRadius}" ry="${block.cornerRadius}" 
                fill="url(#${gradientId})"/>`;
            
            // Inner border with adjusted radius
            svg += `<rect x="${innerX}" y="${innerY}" width="${innerWidth}" height="${innerHeight}" 
                rx="${innerRadius}" ry="${innerRadius}" 
                fill="none" 
                stroke="${block.borderStyle.color}" 
                stroke-width="${lineWidth}"
                stroke-dasharray="${this.getSVGStrokeDashArray(block.borderStyle.style)}"/>`;
        } else {
            // Background
            svg += `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" 
                fill="url(#${gradientId})"/>`;
            
            // Inner border
            svg += `<rect x="${innerX}" y="${innerY}" width="${innerWidth}" height="${innerHeight}" 
                fill="none" 
                stroke="${block.borderStyle.color}" 
                stroke-width="${lineWidth}"
                stroke-dasharray="${this.getSVGStrokeDashArray(block.borderStyle.style)}"/>`;
        }
        
        // Time information
        svg += `<text x="${block.x + 6}" y="${block.y + 16}" 
            fill="${block.textColor}" 
            font-family="Inter, system-ui, sans-serif" 
            font-size="13" 
            font-weight="500">${timeInfo}</text>`;
        
        // Block text with styling
        if (block.text.trim()) {
            const fontWeight = block.fontStyle.bold ? '700' : '500';
            const fontStyle = block.fontStyle.italic ? 'italic' : 'normal';
            const fontSize = Math.max(8, Math.min(48, block.fontSize));
            const textAnchor = this.getSVGTextAnchor(block.textAlignment);
            
            let textX: number;
            switch (block.textAlignment) {
                case 'left':
                    textX = block.x + 8;
                    break;
                case 'right':
                    textX = block.x + block.width - 8;
                    break;
                case 'center':
                default:
                    textX = block.x + block.width / 2;
                    break;
            }
            
            const { textY, dominantBaseline } = this.getSVGVerticalAlignment(block);
            
            svg += `<text x="${textX}" y="${textY}" 
                text-anchor="${textAnchor}" 
                dominant-baseline="${dominantBaseline}" 
                fill="${block.textColor}" 
                font-family="Inter, system-ui, sans-serif" 
                font-size="${fontSize}" 
                font-weight="${fontWeight}"
                font-style="${fontStyle}"`;
            
            
            svg += `>${this.escapeXml(block.text)}</text>`;
        }
        
        return svg;
    }

    /**
     * Calculate SVG vertical alignment properties
     */
    private getSVGVerticalAlignment(block: RenderedTimeBlock): { textY: number; dominantBaseline: string } {
        const textArea = this.getTextArea(block);
        
        switch (block.verticalAlignment) {
            case 'top':
                return {
                    textY: textArea.y,
                    dominantBaseline: 'hanging'
                };
            case 'bottom':
                return {
                    textY: textArea.y + textArea.maxHeight,
                    dominantBaseline: 'text-after-edge'
                };
            case 'middle':
            default:
                return {
                    textY: block.y + block.height / 2,
                    dominantBaseline: 'middle'
                };
        }
    }

    /**
     * Gets SVG stroke-dasharray for border styles
     */
    private getSVGStrokeDashArray(style: 'solid' | 'dashed' | 'dotted'): string {
        switch (style) {
            case 'dashed':
                return '8,4';
            case 'dotted':
                return '2,2';
            case 'solid':
            default:
                return 'none';
        }
    }

    /**
     * Gets SVG text-anchor for text alignment
     */
    private getSVGTextAnchor(alignment: TextAlignment): string {
        switch (alignment) {
            case 'left':
                return 'start';
            case 'right':
                return 'end';
            case 'center':
            default:
                return 'middle';
        }
    }

    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
