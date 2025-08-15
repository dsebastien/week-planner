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
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawGrid() {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px "Segoe UI", sans-serif';
        // Draw header background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.config.headerHeight);
        // Draw time column background
        this.ctx.fillRect(0, 0, this.config.timeColumnWidth, this.canvas.height);
        // Draw day headers
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i < this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + i * this.config.dayWidth + this.config.dayWidth / 2;
            const y = this.config.headerHeight / 2;
            this.ctx.fillText(this.config.days[i], x, y);
        }
        // Draw time labels
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const totalHours = this.config.endHour - this.config.startHour;
        for (let i = 0; i <= totalHours * 2; i++) {
            const minutes = this.config.startHour * 60 + i * 30;
            const timeStr = GridUtils.formatTime(minutes);
            const y = this.config.headerHeight + i * this.config.timeSlotHeight;
            if (i % 2 === 0) { // Full hour
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
            }
            else { // Half hour
                this.ctx.fillStyle = '#aaa';
                this.ctx.font = '10px "Segoe UI", sans-serif';
            }
            this.ctx.fillText(timeStr, this.config.timeColumnWidth - 10, y + this.config.timeSlotHeight / 2);
        }
        // Draw grid lines
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        // Vertical lines (days)
        for (let i = 0; i <= this.config.days.length; i++) {
            const x = this.config.timeColumnWidth + i * this.config.dayWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.config.headerHeight);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        // Horizontal lines (time slots)
        for (let i = 0; i <= totalHours * 2; i++) {
            const y = this.config.headerHeight + i * this.config.timeSlotHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(this.config.timeColumnWidth, y);
            this.ctx.lineTo(this.canvas.width, y);
            if (i % 2 === 0) { // Full hour lines
                this.ctx.strokeStyle = '#555';
                this.ctx.lineWidth = 2;
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
        this.ctx.moveTo(0, this.config.headerHeight);
        this.ctx.lineTo(this.canvas.width, this.config.headerHeight);
        this.ctx.stroke();
        // Draw time column separator
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.timeColumnWidth, 0);
        this.ctx.lineTo(this.config.timeColumnWidth, this.canvas.height);
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
            this.ctx.font = '12px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const textX = block.x + block.width / 2;
            const textY = block.y + block.height / 2;
            // Simple text wrapping
            const maxWidth = block.width - 10;
            const words = block.text.split(' ');
            let line = '';
            let y = textY - 6;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = this.ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    this.ctx.fillText(line, textX, y);
                    line = words[n] + ' ';
                    y += 16;
                }
                else {
                    line = testLine;
                }
            }
            this.ctx.fillText(line, textX, y);
        }
        // Draw time info
        const startTime = GridUtils.formatTime(block.startTime);
        const endTime = GridUtils.formatTime(block.startTime + block.duration);
        const timeText = `${startTime} - ${endTime}`;
        this.ctx.fillStyle = this.getContrastColor(block.color);
        this.ctx.font = '10px "Segoe UI", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(timeText, block.x + 4, block.y + 4);
    }
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const newR = Math.round(r * (1 - factor));
        const newG = Math.round(g * (1 - factor));
        const newB = Math.round(b * (1 - factor));
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    getContrastColor(hexColor) {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
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