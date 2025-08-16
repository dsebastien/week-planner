import { GridUtils } from './grid-utils.js';
export class CanvasRenderer {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
    }
    render(blocks) {
        this.clear();
        this.drawGrid();
        this.drawBlocks(blocks);
    }
    clear() {
        this.ctx.fillStyle = '#2a2a2a';
        const width = this.config.canvasWidth || this.canvas.width;
        const height = this.config.canvasHeight || this.canvas.height;
        this.ctx.fillRect(0, 0, width, height);
    }
    drawGrid() {
        // Configure high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        const canvasWidth = this.config.canvasWidth || this.canvas.width;
        const canvasHeight = this.config.canvasHeight || this.canvas.height;
        // Use the FULL canvas - no offsets, no margins
        const gridStartX = 0;
        const gridStartY = 0;
        const gridWidth = canvasWidth;
        const totalHours = this.config.endHour - this.config.startHour;
        const gridHeight = canvasHeight;
        // Draw time column background - ensure it's always visible
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(gridStartX, gridStartY, this.config.timeColumnWidth, gridHeight);
        // Draw main grid background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(gridStartX + this.config.timeColumnWidth, gridStartY, gridWidth - this.config.timeColumnWidth, this.config.headerHeight);
        // Draw day headers with improved styling
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '600 16px Inter, "Segoe UI", system-ui, sans-serif';
        for (let i = 0; i < this.config.days.length; i++) {
            const x = gridStartX + this.config.timeColumnWidth + i * this.config.dayWidth + this.config.dayWidth / 2;
            const y = gridStartY + this.config.headerHeight / 2;
            this.ctx.fillText(this.config.days[i], x, y);
        }
        // Draw time labels with improved styling
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i <= totalHours * 2; i++) {
            const minutes = this.config.startHour * 60 + i * 30;
            const timeStr = GridUtils.formatTime(minutes);
            const y = gridStartY + this.config.headerHeight + i * this.config.timeSlotHeight;
            if (i % 2 === 0) { // Full hour
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '600 14px Inter, "Segoe UI", system-ui, sans-serif';
            }
            else { // Half hour
                this.ctx.fillStyle = '#cccccc';
                this.ctx.font = '500 12px Inter, "Segoe UI", system-ui, sans-serif';
            }
            this.ctx.fillText(timeStr, gridStartX + this.config.timeColumnWidth - 8, y);
        }
        // Draw grid lines with improved styling
        this.ctx.lineWidth = 1;
        // Vertical lines (days) - draw all lines including the final right border
        for (let i = 0; i <= this.config.days.length; i++) {
            const x = gridStartX + this.config.timeColumnWidth + i * this.config.dayWidth;
            this.ctx.strokeStyle = '#555';
            this.ctx.beginPath();
            this.ctx.moveTo(x, gridStartY + this.config.headerHeight);
            this.ctx.lineTo(x, gridStartY + gridHeight);
            this.ctx.stroke();
        }
        // Horizontal lines (time slots) - extend to full grid width
        const totalGridWidth = this.config.timeColumnWidth + (this.config.days.length * this.config.dayWidth);
        for (let i = 0; i <= totalHours * 2; i++) {
            const y = gridStartY + this.config.headerHeight + i * this.config.timeSlotHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(gridStartX + this.config.timeColumnWidth, y);
            this.ctx.lineTo(gridStartX + totalGridWidth, y);
            if (i % 2 === 0) { // Full hour lines
                this.ctx.strokeStyle = '#666';
                this.ctx.lineWidth = 1.5;
            }
            else { // Half hour lines
                this.ctx.strokeStyle = '#444';
                this.ctx.lineWidth = 1;
            }
            this.ctx.stroke();
        }
        // Draw header separator
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(gridStartX, gridStartY + this.config.headerHeight);
        this.ctx.lineTo(gridStartX + totalGridWidth, gridStartY + this.config.headerHeight);
        this.ctx.stroke();
        // Draw time column separator
        this.ctx.beginPath();
        this.ctx.moveTo(gridStartX + this.config.timeColumnWidth, gridStartY);
        this.ctx.lineTo(gridStartX + this.config.timeColumnWidth, gridStartY + gridHeight);
        this.ctx.stroke();
    }
    drawBlocks(blocks) {
        blocks.forEach(block => {
            this.drawBlock(block);
        });
    }
    drawBlock(block) {
        // Calculate border color (slightly darker)
        const borderColor = this.darkenColor(block.color, 0.2);
        // Draw block background
        this.ctx.fillStyle = block.color;
        this.ctx.fillRect(block.x, block.y, block.width, block.height);
        // Draw block border
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = block.selected ? 3 : 2;
        this.ctx.strokeRect(block.x, block.y, block.width, block.height);
        // Draw selection highlight
        if (block.selected) {
            this.ctx.strokeStyle = '#0066cc';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(block.x - 2, block.y - 2, block.width + 4, block.height + 4);
            this.ctx.setLineDash([]);
        }
        // Draw text
        if (block.text) {
            this.ctx.fillStyle = this.getContrastColor(block.color);
            this.ctx.font = '500 13px Inter, "Segoe UI", system-ui, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            const textX = block.x + block.width / 2;
            const textStartY = block.y + 26; // Start below time info
            // Simple text wrapping
            const maxWidth = block.width - 16;
            const words = block.text.split(' ');
            let line = '';
            let y = textStartY;
            const lineHeight = 16;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = this.ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    this.ctx.fillText(line.trim(), textX, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                    // Stop if we're running out of space
                    if (y + lineHeight > block.y + block.height - 4) {
                        line = line.trim() + '...';
                        break;
                    }
                }
                else {
                    line = testLine;
                }
            }
            // Draw the last line if we have space
            if (y + lineHeight <= block.y + block.height - 4) {
                this.ctx.fillText(line.trim(), textX, y);
            }
        }
        // Draw time info
        const startTime = GridUtils.formatTime(block.startTime);
        const endTime = GridUtils.formatTime(block.startTime + block.duration);
        const timeText = `${startTime} - ${endTime}`;
        this.ctx.fillStyle = this.getContrastColor(block.color);
        this.ctx.font = '500 10px Inter, "Segoe UI", system-ui, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(timeText, block.x + 6, block.y + 6);
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
    exportSVG(blocks) {
        const svg = `<svg width="${this.canvas.width}" height="${this.canvas.height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#2a2a2a"/>
            ${this.generateGridSVG()}
            ${blocks.map(block => this.generateBlockSVG(block)).join('')}
        </svg>`;
        return svg;
    }
    generateGridSVG() {
        let svg = '';
        // Header background
        svg += `<rect x="0" y="0" width="${this.canvas.width}" height="${this.config.headerHeight}" fill="#333"/>`;
        // Time column background
        svg += `<rect x="0" y="0" width="${this.config.timeColumnWidth}" height="${this.canvas.height}" fill="#333"/>`;
        // Day headers
        for (let i = 0; i < this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + i * this.config.dayWidth + this.config.dayWidth / 2;
            const y = this.config.headerHeight / 2;
            svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Segoe UI, sans-serif" font-size="12">${this.config.days[i]}</text>`;
        }
        return svg;
    }
    generateBlockSVG(block) {
        const borderColor = this.darkenColor(block.color, 0.2);
        const textColor = this.getContrastColor(block.color);
        let svg = `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="${block.color}" stroke="${borderColor}" stroke-width="2"/>`;
        if (block.text) {
            const textX = block.x + block.width / 2;
            const textY = block.y + block.height / 2;
            svg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-family="Segoe UI, sans-serif" font-size="12">${block.text}</text>`;
        }
        return svg;
    }
}
//# sourceMappingURL=canvas-renderer.js.map