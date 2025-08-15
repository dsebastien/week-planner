import { TimeBlock } from './types.js';
export declare class TimeBlockManager {
    private blocks;
    private selectedBlock;
    addBlock(block: TimeBlock): boolean;
    removeBlock(blockId: string): void;
    getBlocks(): TimeBlock[];
    selectBlock(blockId: string | null): void;
    getSelectedBlock(): TimeBlock | null;
    getBlockAt(x: number, y: number): TimeBlock | null;
    updateBlockText(blockId: string, text: string): void;
    clearAll(): void;
    private hasOverlap;
    private getDefaultConfig;
}
//# sourceMappingURL=time-block-manager.d.ts.map