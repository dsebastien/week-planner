import { TimeBlock, GridConfig, ValidationError, Result, WeekPlannerData } from './types.js';
/**
 * Manages time blocks in the week planner with validation and overlap detection
 */
export declare class TimeBlockManager {
    private readonly blocks;
    private selectedBlockId;
    private config;
    constructor(config: GridConfig);
    /**
     * Adds a new time block with validation
     */
    addBlock(block: TimeBlock): Result<void, ValidationError>;
    /**
     * Removes a block by ID
     */
    removeBlock(blockId: string): boolean;
    /**
     * Updates an existing block with validation
     */
    updateBlock(blockId: string, updates: Partial<TimeBlock>): Result<void, ValidationError>;
    /**
     * Updates block text (special case for editing)
     */
    updateBlockText(blockId: string, text: string): boolean;
    /**
     * Gets all blocks as a readonly array
     */
    getBlocks(): readonly TimeBlock[];
    /**
     * Gets a specific block by ID
     */
    getBlock(blockId: string): TimeBlock | null;
    /**
     * Selects a block by ID
     */
    selectBlock(blockId: string | null): void;
    /**
     * Gets the currently selected block
     */
    getSelectedBlock(): TimeBlock | null;
    /**
     * Finds the topmost block at given coordinates
     */
    getBlockAt(x: number, y: number): TimeBlock | null;
    /**
     * Clears all blocks
     */
    clearAll(): void;
    /**
     * Updates the grid configuration and recalculates block positions
     */
    updateConfig(newConfig: GridConfig): void;
    /**
     * Exports all data for saving
     */
    exportData(): WeekPlannerData;
    /**
     * Imports data from export
     */
    importData(data: WeekPlannerData): Result<void, ValidationError>;
    /**
     * Validates a time block according to business rules
     */
    private validateBlock;
    /**
     * Checks for overlaps with existing blocks
     */
    private checkOverlap;
    /**
     * Finds overlapping blocks in a given set
     */
    private findOverlappingBlocks;
    /**
     * Checks if two blocks overlap
     */
    private blocksOverlap;
    /**
     * Checks if a point is within a block's boundaries
     */
    private isPointInBlock;
}
//# sourceMappingURL=time-block-manager.d.ts.map