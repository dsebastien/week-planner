import { GridConfig, TimeBlock } from './types.js';
export declare class CanvasRenderer {
    private canvas;
    private ctx;
    private config;
    constructor(canvas: HTMLCanvasElement, config: GridConfig);
    render(blocks: TimeBlock[]): void;
    private clear;
    private drawGrid;
    private drawBlocks;
    private drawBlock;
    private darkenColor;
    private getContrastColor;
    exportSVG(blocks: TimeBlock[]): string;
    private generateGridSVG;
    private generateBlockSVG;
}
//# sourceMappingURL=canvas-renderer.d.ts.map