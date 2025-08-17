import { 
    TimeBlock, 
    RenderedTimeBlock,
    GridConfig, 
    ValidationError, 
    Result, 
    DayIndex, 
    TimeMinutes, 
    DurationMinutes,
    WeekPlannerData
} from './types.js';
import { GridUtils } from './grid-utils.js';

/**
 * Manages time blocks in the week planner with validation and overlap detection
 */
export class TimeBlockManager {
    private readonly blocks: Map<string, TimeBlock> = new Map();
    private selectedBlockIds: Set<string> = new Set();
    private config: GridConfig;

    constructor(config: GridConfig) {
        this.config = config;
    }

    /**
     * Adds a new time block with validation
     */
    addBlock(block: TimeBlock): Result<void, ValidationError> {
        const validation = this.validateBlock(block);
        if (!validation.success) {
            return validation;
        }

        const overlap = this.checkOverlap(block);
        if (overlap.length > 0) {
            return {
                success: false,
                error: {
                    code: 'OVERLAP_ERROR',
                    message: `Block overlaps with existing blocks`,
                    field: 'overlap'
                }
            };
        }

        this.blocks.set(block.id, { ...block });
        return { success: true, data: undefined };
    }

    /**
     * Removes a block by ID
     */
    removeBlock(blockId: string): boolean {
        this.selectedBlockIds.delete(blockId);
        return this.blocks.delete(blockId);
    }

    /**
     * Updates an existing block with validation
     */
    updateBlock(blockId: string, updates: Partial<TimeBlock>): Result<void, ValidationError> {
        const existingBlock = this.blocks.get(blockId);
        if (!existingBlock) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Block with ID ${blockId} not found`
                }
            };
        }

        const updatedBlock: TimeBlock = { ...existingBlock, ...updates };
        const validation = this.validateBlock(updatedBlock);
        if (!validation.success) {
            return validation;
        }

        // Check overlap excluding the current block
        const otherBlocks = Array.from(this.blocks.values()).filter(b => b.id !== blockId);
        const overlapping = this.findOverlappingBlocks(updatedBlock, otherBlocks);
        if (overlapping.length > 0) {
            return {
                success: false,
                error: {
                    code: 'OVERLAP_ERROR',
                    message: `Updated block would overlap with: ${overlapping.map(b => b.id).join(', ')}`,
                    field: 'overlap'
                }
            };
        }

        this.blocks.set(blockId, updatedBlock);
        return { success: true, data: undefined };
    }

    /**
     * Updates block text (special case for editing)
     */
    updateBlockText(blockId: string, text: string): boolean {
        const block = this.blocks.get(blockId);
        if (!block) return false;

        const updatedBlock: TimeBlock = { ...block, text: text.trim() };
        this.blocks.set(blockId, updatedBlock);
        return true;
    }

    /**
     * Updates styling properties for all selected blocks
     */
    updateSelectedBlocksStyle(updates: Partial<TimeBlock>): Result<void, ValidationError> {
        if (this.selectedBlockIds.size === 0) {
            return {
                success: false,
                error: {
                    code: 'NO_SELECTION',
                    message: 'No blocks selected for styling update'
                }
            };
        }

        // Apply updates to all selected blocks
        for (const blockId of this.selectedBlockIds) {
            const result = this.updateBlock(blockId, updates);
            if (!result.success) {
                return result; // Return first error encountered
            }
        }

        return { success: true, data: undefined };
    }

    /**
     * Removes all selected blocks
     */
    removeSelectedBlocks(): number {
        const removedCount = this.selectedBlockIds.size;
        for (const blockId of this.selectedBlockIds) {
            this.blocks.delete(blockId);
        }
        this.selectedBlockIds.clear();
        return removedCount;
    }

    /**
     * Resizes a block with validation using logical coordinates
     */
    resizeBlock(blockId: string, newX: number, newY: number, newWidth: number, newHeight: number): Result<void, ValidationError> {
        const originalBlock = this.blocks.get(blockId);
        if (!originalBlock) {
            return {
                success: false,
                error: {
                    code: 'BLOCK_NOT_FOUND',
                    message: 'Block not found',
                    field: 'blockId'
                }
            };
        }

        // Calculate new logical properties from position and size
        const startDay = GridUtils.getDayFromX(newX, this.config);
        const startTimeMinutes = this.config.startHour * 60 + 
            Math.round((newY - this.config.headerHeight) / this.config.timeSlotHeight) * 30;
        
        const duration = Math.max(30, Math.round(newHeight / this.config.timeSlotHeight) * 30);
        const daySpan = Math.max(1, Math.round(newWidth / this.config.dayWidth));

        // Create the resized block with logical coordinates as source of truth
        const resizedBlock: TimeBlock = {
            ...originalBlock,
            startDay,
            startTime: startTimeMinutes,
            duration,
            daySpan
        };

        // Validate the resized block
        const validation = this.validateBlock(resizedBlock);
        if (!validation.success) {
            return validation;
        }

        // Check for overlaps (excluding the original block)
        const otherBlocks = Array.from(this.blocks.values()).filter(block => block.id !== blockId);
        const hasOverlap = otherBlocks.some(block => this.blocksOverlap(resizedBlock, block));

        if (hasOverlap) {
            return {
                success: false,
                error: {
                    code: 'OVERLAP_ERROR',
                    message: 'Resized block would overlap with existing blocks',
                    field: 'overlap'
                }
            };
        }

        // Update the block
        this.blocks.set(blockId, resizedBlock);
        return { success: true, data: undefined };
    }

    /**
     * Gets all blocks as a readonly array with dynamically calculated pixel positions
     */
    getBlocks(): readonly RenderedTimeBlock[] {
        return Array.from(this.blocks.values()).map(block => this.getBlockWithCalculatedPosition(block));
    }

    /**
     * Returns a block with pixel positions calculated from logical properties
     */
    private getBlockWithCalculatedPosition(block: TimeBlock): RenderedTimeBlock {
        const { x, y, width, height } = GridUtils.calculateBlockPixelProperties(
            block.startDay, 
            block.startTime, 
            block.duration, 
            block.daySpan, 
            this.config
        );
        
        return {
            ...block,
            x,
            y,
            width,
            height
        };
    }

    /**
     * Gets a specific block by ID with calculated pixel positions
     */
    getBlock(blockId: string): RenderedTimeBlock | null {
        const block = this.blocks.get(blockId);
        return block ? this.getBlockWithCalculatedPosition(block) : null;
    }

    /**
     * Selects a single block (clears other selections)
     */
    selectBlock(blockId: string | null): void {
        this.selectedBlockIds.clear();
        if (blockId) {
            this.selectedBlockIds.add(blockId);
        }
        this.updateBlockSelectionStates();
    }

    /**
     * Toggles selection of a block (for multi-selection with Ctrl+click)
     */
    toggleBlockSelection(blockId: string): void {
        if (this.selectedBlockIds.has(blockId)) {
            this.selectedBlockIds.delete(blockId);
        } else {
            this.selectedBlockIds.add(blockId);
        }
        this.updateBlockSelectionStates();
    }

    /**
     * Selects multiple blocks
     */
    selectBlocks(blockIds: string[]): void {
        this.selectedBlockIds.clear();
        blockIds.forEach(id => this.selectedBlockIds.add(id));
        this.updateBlockSelectionStates();
    }

    /**
     * Clears all selections
     */
    clearSelection(): void {
        this.selectedBlockIds.clear();
        this.updateBlockSelectionStates();
    }

    /**
     * Updates the selected property on all blocks based on selectedBlockIds
     */
    private updateBlockSelectionStates(): void {
        for (const [id, block] of this.blocks) {
            const updatedBlock: TimeBlock = { ...block, selected: this.selectedBlockIds.has(id) };
            this.blocks.set(id, updatedBlock);
        }
    }

    /**
     * Gets all currently selected blocks with calculated pixel positions
     */
    getSelectedBlocks(): readonly RenderedTimeBlock[] {
        return Array.from(this.selectedBlockIds)
            .map(id => this.blocks.get(id))
            .filter((block): block is TimeBlock => block !== undefined)
            .map(block => this.getBlockWithCalculatedPosition(block));
    }

    /**
     * Gets the first selected block (for backward compatibility)
     */
    getSelectedBlock(): RenderedTimeBlock | null {
        const selectedBlocks = this.getSelectedBlocks();
        return selectedBlocks.length > 0 ? selectedBlocks[0]! : null;
    }

    /**
     * Gets the number of selected blocks
     */
    getSelectedBlockCount(): number {
        return this.selectedBlockIds.size;
    }

    /**
     * Checks if a specific block is selected
     */
    isBlockSelected(blockId: string): boolean {
        return this.selectedBlockIds.has(blockId);
    }

    /**
     * Finds the topmost block at given coordinates with calculated pixel positions
     */
    getBlockAt(x: number, y: number): RenderedTimeBlock | null {
        const blocksAtPoint = Array.from(this.blocks.values())
            .map(block => this.getBlockWithCalculatedPosition(block))
            .filter(block => this.isPointInBlock(x, y, block))
            .sort((a, b) => b.y - a.y); // Sort by y position (topmost first)

        return blocksAtPoint[0] || null;
    }

    /**
     * Clears all blocks
     */
    clearAll(): void {
        this.blocks.clear();
        this.selectedBlockIds.clear();
    }

    /**
     * Updates the grid configuration
     * No position recalculation needed - positions are calculated dynamically during rendering
     */
    updateConfig(newConfig: GridConfig): void {
        this.config = newConfig;
        // No block position updates needed - the renderer will calculate positions from logical properties
    }

    /**
     * Gets all domain blocks without calculated pixel positions and UI state (for export)
     */
    private getDomainBlocks(): readonly TimeBlock[] {
        return Array.from(this.blocks.values()).map(block => {
            const { selected, ...domainBlock } = block;
            return domainBlock as TimeBlock;
        });
    }

    /**
     * Exports all data for saving
     */
    exportData(): WeekPlannerData {
        return {
            version: '1.0',
            blocks: this.getDomainBlocks(),
            config: this.config,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Imports data from export
     */
    importData(data: WeekPlannerData): Result<void, ValidationError> {
        // Validate version compatibility
        if (data.version !== '1.0') {
            return {
                success: false,
                error: {
                    code: 'VERSION_MISMATCH',
                    message: `Unsupported version: ${data.version}`
                }
            };
        }

        // Validate all blocks before importing
        for (const block of data.blocks) {
            const validation = this.validateBlock(block);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_BLOCK',
                        message: `Invalid block ${block.id}: ${validation.error.message}`
                    }
                };
            }
        }

        // Check for overlaps in imported data
        for (let i = 0; i < data.blocks.length; i++) {
            for (let j = i + 1; j < data.blocks.length; j++) {
                const blockI = data.blocks[i];
                const blockJ = data.blocks[j];
                if (blockI && blockJ && this.blocksOverlap(blockI, blockJ)) {
                    return {
                        success: false,
                        error: {
                            code: 'IMPORT_OVERLAP',
                            message: `Overlapping blocks in import data: ${blockI.id} and ${blockJ.id}`
                        }
                    };
                }
            }
        }

        // Clear existing data and import
        this.clearAll();
        for (const block of data.blocks) {
            // Ensure imported blocks are not selected by default
            this.blocks.set(block.id, { ...block, selected: false });
        }

        return { success: true, data: undefined };
    }

    /**
     * Validates a time block according to business rules
     */
    private validateBlock(block: TimeBlock): Result<void, ValidationError> {
        // Validate ID
        if (!block.id || block.id.trim() === '') {
            return {
                success: false,
                error: { code: 'INVALID_ID', message: 'Block ID cannot be empty', field: 'id' }
            };
        }

        // Validate duration (minimum 30 minutes, multiple of 30)
        if (block.duration < 30) {
            return {
                success: false,
                error: { code: 'INVALID_DURATION', message: 'Duration must be at least 30 minutes', field: 'duration' }
            };
        }

        if (block.duration % 30 !== 0) {
            return {
                success: false,
                error: { code: 'INVALID_DURATION', message: 'Duration must be a multiple of 30 minutes', field: 'duration' }
            };
        }

        // Validate day span
        if (block.daySpan < 1 || block.daySpan > 7) {
            return {
                success: false,
                error: { code: 'INVALID_DAY_SPAN', message: 'Day span must be between 1 and 7', field: 'daySpan' }
            };
        }

        // Validate time boundaries
        const startHourMinutes = this.config.startHour * 60;
        const endHourMinutes = this.config.endHour * 60;
        
        if (block.startTime < startHourMinutes) {
            return {
                success: false,
                error: { code: 'TIME_OUT_OF_BOUNDS', message: `Start time cannot be before ${this.config.startHour}:00`, field: 'startTime' }
            };
        }

        if (block.startTime + block.duration > endHourMinutes) {
            return {
                success: false,
                error: { code: 'TIME_OUT_OF_BOUNDS', message: `End time cannot be after ${this.config.endHour}:00`, field: 'duration' }
            };
        }

        // Validate color format
        if (!/^#[0-9A-Fa-f]{6}$/.test(block.color)) {
            return {
                success: false,
                error: { code: 'INVALID_COLOR', message: 'Color must be in hex format (#RRGGBB)', field: 'color' }
            };
        }

        return { success: true, data: undefined };
    }

    /**
     * Checks for overlaps with existing blocks
     */
    private checkOverlap(newBlock: TimeBlock): TimeBlock[] {
        return this.findOverlappingBlocks(newBlock, Array.from(this.blocks.values()));
    }

    /**
     * Finds overlapping blocks in a given set
     */
    private findOverlappingBlocks(block: TimeBlock, blocks: TimeBlock[]): TimeBlock[] {
        return blocks.filter(existingBlock => this.blocksOverlap(block, existingBlock));
    }

    /**
     * Checks if two blocks overlap using logical coordinates
     */
    private blocksOverlap(block1: TimeBlock, block2: TimeBlock): boolean {
        // Use logical coordinates (startDay) instead of pixel coordinates
        const block1EndDay = block1.startDay + block1.daySpan - 1;
        const block2EndDay = block2.startDay + block2.daySpan - 1;

        // Check for day overlap
        const dayOverlap = !(block1EndDay < block2.startDay || block1.startDay > block2EndDay);
        
        // Check for time overlap
        const block1EndTime = block1.startTime + block1.duration;
        const block2EndTime = block2.startTime + block2.duration;
        const timeOverlap = !(block1EndTime <= block2.startTime || block1.startTime >= block2EndTime);

        return dayOverlap && timeOverlap;
    }

    /**
     * Checks if a point is within a block's boundaries
     */
    private isPointInBlock(x: number, y: number, block: RenderedTimeBlock): boolean {
        return x >= block.x && 
               x <= block.x + block.width &&
               y >= block.y && 
               y <= block.y + block.height;
    }
}
