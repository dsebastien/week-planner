import { GridUtils } from './grid-utils.js';
/**
 * Handles all Canvas drawing operations and export functionality
 */
export class CanvasRenderer {
    constructor(canvas, config) {
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
    render(blocks) {
        this.clear();
        this.drawGrid();
        this.drawBlocks(blocks);
    }
    /**
     * Draws a preview block with transparency (used during drag operations)
     */
    drawPreviewBlock(block) {
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
            const startTime = GridUtils.formatTime(block.startTime);
            this.ctx.font = '500 9px Inter, "Segoe UI", system-ui, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(startTime, block.x + block.width / 2, block.y + block.height / 2);
        }
        else {
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
    updateConfig(newConfig) {
        this.config = newConfig;
    }
    /**
     * Exports the current canvas as SVG
     */
    exportSVG(blocks) {
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
    clear() {
        this.ctx.fillStyle = CanvasRenderer.THEME.background;
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    }
    /**
     * Sets up high-quality rendering options
     */
    setupHighQualityRendering() {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        // Note: textRenderingOptimization is not standard in all browsers
    }
    /**
     * Draws the complete grid structure
     */
    drawGrid() {
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
    drawBackground() {
        // Time column background
        this.ctx.fillStyle = CanvasRenderer.THEME.timeColumnBackground;
        this.ctx.fillRect(0, 0, this.config.timeColumnWidth, this.config.canvasHeight);
        // Header background
        this.ctx.fillStyle = CanvasRenderer.THEME.headerBackground;
        this.ctx.fillRect(this.config.timeColumnWidth, 0, this.config.canvasWidth - this.config.timeColumnWidth, this.config.headerHeight);
    }
    /**
     * Draws lighter background for lunch time (12:00-14:00)
     */
    drawLunchTimeBackground() {
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
            this.ctx.fillRect(this.config.timeColumnWidth, startY, gridWidth, endY - startY);
        }
    }
    /**
     * Draws day headers
     */
    drawDayHeaders() {
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
    drawTimeLabels() {
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
            if (y + 10 > this.config.canvasHeight)
                continue;
            if (i % 2 === 0) { // Full hour
                this.ctx.fillStyle = CanvasRenderer.THEME.primaryText;
                this.ctx.font = CanvasRenderer.FONTS.timeHour;
            }
            else { // Half hour
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
    drawGridLines() {
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
            this.drawHorizontalLine(this.config.timeColumnWidth, this.config.timeColumnWidth + gridWidth, y, color, width);
        }
    }
    /**
     * Draws separator lines for header and time column
     */
    drawSeparators() {
        const gridWidth = this.config.days.length * this.config.dayWidth;
        // Header separator
        this.drawHorizontalLine(0, this.config.timeColumnWidth + gridWidth, this.config.headerHeight, CanvasRenderer.THEME.separatorLines, 2);
        // Time column separator
        this.drawVerticalLine(this.config.timeColumnWidth, 0, this.config.canvasHeight, CanvasRenderer.THEME.separatorLines, 2);
    }
    /**
     * Draws all time blocks
     */
    drawBlocks(blocks) {
        // Sort blocks by position for consistent rendering order
        const sortedBlocks = [...blocks].sort((a, b) => {
            if (a.y !== b.y)
                return a.y - b.y;
            return a.x - b.x;
        });
        for (const block of sortedBlocks) {
            this.drawBlock(block);
        }
    }
    /**
     * Draws a single time block
     */
    drawBlock(block) {
        this.drawBlockBackground(block);
        this.drawBlockBorder(block);
        this.drawBlockSelection(block);
        this.drawBlockTimeInfo(block);
        this.drawBlockText(block);
    }
    /**
     * Draws block background with modern gradient effect
     */
    drawBlockBackground(block) {
        // Create subtle gradient for depth
        const gradient = this.ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
        // Parse hex color and create lighter/darker variants
        const baseColor = block.color;
        const lighterColor = this.adjustColorBrightness(baseColor, 10);
        const darkerColor = this.adjustColorBrightness(baseColor, -10);
        gradient.addColorStop(0, lighterColor);
        gradient.addColorStop(1, darkerColor);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(block.x, block.y, block.width, block.height);
        // Add subtle inner glow for modern look
        if (block.selected) {
            this.ctx.shadowColor = this.adjustColorBrightness(baseColor, 30);
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.fillStyle = this.adjustColorBrightness(baseColor, 5);
            this.ctx.fillRect(block.x + 1, block.y + 1, block.width - 2, block.height - 2);
            this.ctx.shadowBlur = 0;
        }
    }
    /**
     * Draws block border
     */
    drawBlockBorder(block) {
        const borderColor = this.adjustColorBrightness(block.color, -20);
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = block.selected ? 3 : 2;
        this.ctx.strokeRect(block.x, block.y, block.width, block.height);
    }
    /**
     * Draws selection highlight if block is selected
     */
    drawBlockSelection(block) {
        if (!block.selected)
            return;
        this.ctx.strokeStyle = CanvasRenderer.THEME.selectionHighlight;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(block.x - 2, block.y - 2, block.width + 4, block.height + 4);
        this.ctx.setLineDash([]);
    }
    /**
     * Draws time information in the top-left corner of the block
     */
    drawBlockTimeInfo(block) {
        this.ctx.fillStyle = this.getContrastColor(block.color);
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const isSmallBlock = block.height < 40;
        if (isSmallBlock) {
            // Compact format for small blocks: just start time
            const startTime = GridUtils.formatTime(block.startTime);
            this.ctx.font = '500 9px Inter, "Segoe UI", system-ui, sans-serif';
            this.ctx.fillText(startTime, block.x + 3, block.y + 2);
        }
        else {
            // Full format for larger blocks
            const timeInfo = this.getBlockTimeInfo(block);
            this.ctx.font = CanvasRenderer.FONTS.blockTime;
            this.ctx.fillText(timeInfo, block.x + 6, block.y + 6);
        }
    }
    /**
     * Draws block text with automatic wrapping
     */
    drawBlockText(block) {
        if (!block.text.trim())
            return;
        this.ctx.fillStyle = this.getContrastColor(block.color);
        // Use smaller font for small blocks
        const isSmallBlock = block.height < 40;
        this.ctx.font = isSmallBlock ? '500 11px Inter, "Segoe UI", system-ui, sans-serif' : CanvasRenderer.FONTS.blockText;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = isSmallBlock ? 'middle' : 'top';
        const textArea = this.getTextArea(block);
        if (isSmallBlock) {
            // For small blocks, center text vertically and use single line
            const centerY = block.y + block.height / 2;
            this.ctx.fillText(block.text, textArea.x, centerY);
        }
        else {
            // For larger blocks, use wrapped text
            this.drawWrappedText(block.text, textArea.x, textArea.y, textArea.maxWidth, textArea.maxHeight);
        }
    }
    /**
     * Draws text with automatic line wrapping
     */
    drawWrappedText(text, x, y, maxWidth, maxHeight) {
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
            }
            else {
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
    drawHorizontalLine(x1, x2, y, color, width = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y);
        this.ctx.lineTo(x2, y);
        this.ctx.stroke();
    }
    drawVerticalLine(x, y1, y2, color, width = 1) {
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
    getBlockTimeInfo(block) {
        const startTime = GridUtils.formatTime(block.startTime);
        const endTime = GridUtils.formatTime(block.startTime + block.duration);
        const duration = GridUtils.formatDuration(block.duration);
        return `${startTime}-${endTime} (${duration})`;
    }
    getTextArea(block) {
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
     * Color utility methods
     */
    adjustColorBrightness(hexColor, percent) {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const adjust = (color) => {
            const adjusted = color + (color * percent / 100);
            return Math.max(0, Math.min(255, Math.round(adjusted)));
        };
        const newR = adjust(r);
        const newG = adjust(g);
        const newB = adjust(b);
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    getContrastColor(hexColor) {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
    /**
     * SVG export helper methods
     */
    createSVGRoot() {
        return `<svg width="${this.config.canvasWidth}" height="${this.config.canvasHeight}" xmlns="http://www.w3.org/2000/svg">`;
    }
    generateBackgroundSVG() {
        return `<rect width="100%" height="100%" fill="${CanvasRenderer.THEME.background}"/>`;
    }
    generateGridSVG() {
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
        return svg;
    }
    generateBlockSVG(block) {
        const borderColor = this.adjustColorBrightness(block.color, -20);
        const textColor = this.getContrastColor(block.color);
        const timeInfo = this.getBlockTimeInfo(block);
        let svg = `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="${block.color}" stroke="${borderColor}" stroke-width="${block.selected ? 3 : 2}"/>`;
        // Time information
        svg += `<text x="${block.x + 6}" y="${block.y + 16}" fill="${textColor}" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="500">${timeInfo}</text>`;
        // Block text (simplified for SVG)
        if (block.text.trim()) {
            const textX = block.x + block.width / 2;
            const textY = block.y + block.height / 2;
            svg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500">${this.escapeXml(block.text)}</text>`;
        }
        return svg;
    }
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
// Modern theme colors
CanvasRenderer.THEME = {
    background: '#0f172a', // dark-900
    gridBackground: '#1e293b', // dark-800  
    headerBackground: '#334155', // dark-700
    timeColumnBackground: '#1e293b', // dark-800
    primaryText: '#ffffff',
    secondaryText: '#cbd5e1', // dark-300
    gridLines: '#475569', // dark-600
    hourLines: '#64748b', // dark-500
    separatorLines: '#64748b', // dark-500
    selectionHighlight: '#3b82f6', // primary-500
    lunchTimeBackground: '#334155' // dark-700 - slightly lighter for lunch time
};
// Typography
CanvasRenderer.FONTS = {
    dayHeader: '600 16px Inter, "Segoe UI", system-ui, sans-serif',
    timeHour: '600 14px Inter, "Segoe UI", system-ui, sans-serif',
    timeHalf: '500 12px Inter, "Segoe UI", system-ui, sans-serif',
    blockText: '500 13px Inter, "Segoe UI", system-ui, sans-serif',
    blockTime: '500 10px Inter, "Segoe UI", system-ui, sans-serif'
};
//# sourceMappingURL=canvas-renderer.js.map