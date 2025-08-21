import { 
    TimeBlock, 
    RenderedTimeBlock,
    GridConfig, 
    ValidationError, 
    Result, 
    DayIndex, 
    TimeMinutes, 
    DurationMinutes,
    WeekPlannerData,
    Operation
} from './types.js';
import { GridUtils } from './grid-utils.js';
import { UndoManager } from './undo-manager.js';

/**
 * Manages time blocks in the week planner with validation and overlap detection
 */
export class TimeBlockManager {
    private readonly blocks: Map<string, TimeBlock> = new Map();
    private selectedBlockIds: Set<string> = new Set();
    private config: GridConfig;
    public readonly undoManager: UndoManager;

    constructor(config: GridConfig) {
        this.config = config;
        this.undoManager = new UndoManager();
    }

    /**
     * Adds a new time block with validation
     */
    addBlock(block: TimeBlock): Result<void, ValidationError> {
        const validation = this.validateBlock(block);
        if (!validation.success) {
            return validation;
        }

        const overlapResult = this.checkOverlap(block);
        if (!overlapResult.success) {
            return overlapResult;
        }

        this.blocks.set(block.id, { ...block });
        return { success: true, data: undefined };
    }

    /**
     * Adds a new time block with undo support
     */
    addBlockWithUndo(block: TimeBlock): Result<void, ValidationError> {
        const result = this.addBlock(block);
        if (result.success) {
            const operation = UndoManager.createOperation(
                'create',
                `Create block: ${block.text || 'Untitled'}`,
                () => this.removeBlock(block.id),
                () => this.addBlock(block)
            );
            this.undoManager.addOperation(operation);
        }
        return result;
    }

    /**
     * Removes a block by ID
     */
    removeBlock(blockId: string): boolean {
        this.selectedBlockIds.delete(blockId);
        return this.blocks.delete(blockId);
    }

    /**
     * Removes a block by ID with undo support
     */
    removeBlockWithUndo(blockId: string): boolean {
        const block = this.blocks.get(blockId);
        if (!block) {
            return false;
        }

        const blockCopy = { ...block };
        const wasSelected = this.selectedBlockIds.has(blockId);
        
        const success = this.removeBlock(blockId);
        if (success) {
            const operation = UndoManager.createOperation(
                'delete',
                `Delete block: ${block.text || 'Untitled'}`,
                () => {
                    this.addBlock(blockCopy);
                    if (wasSelected) {
                        this.selectedBlockIds.add(blockId);
                    }
                },
                () => this.removeBlock(blockId)
            );
            this.undoManager.addOperation(operation);
        }
        return success;
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
     * Updates an existing block with undo support
     */
    updateBlockWithUndo(blockId: string, updates: Partial<TimeBlock>): Result<void, ValidationError> {
        const originalBlock = this.blocks.get(blockId);
        if (!originalBlock) {
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Block with ID ${blockId} not found`
                }
            };
        }

        const originalCopy = { ...originalBlock };
        const result = this.updateBlock(blockId, updates);
        
        if (result.success) {
            const operation = UndoManager.createOperation(
                'style',
                `Update block: ${originalBlock.text || 'Untitled'}`,
                () => this.updateBlock(blockId, originalCopy),
                () => this.updateBlock(blockId, { ...originalCopy, ...updates })
            );
            this.undoManager.addOperation(operation);
        }
        
        return result;
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
     * Updates block text with undo support
     */
    updateBlockTextWithUndo(blockId: string, text: string): boolean {
        const block = this.blocks.get(blockId);
        if (!block) return false;

        const originalText = block.text;
        const newText = text.trim();
        
        // Don't create undo operation if text hasn't changed
        if (originalText === newText) {
            return true;
        }

        const success = this.updateBlockText(blockId, newText);
        if (success) {
            const operation = UndoManager.createOperation(
                'text',
                `Edit text: "${newText || 'Empty'}"`,
                () => this.updateBlockText(blockId, originalText),
                () => this.updateBlockText(blockId, newText)
            );
            this.undoManager.addOperation(operation);
        }
        return success;
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
     * Updates styling properties for all selected blocks with undo support
     */
    updateSelectedBlocksStyleWithUndo(updates: Partial<TimeBlock>): Result<void, ValidationError> {
        if (this.selectedBlockIds.size === 0) {
            return {
                success: false,
                error: {
                    code: 'NO_SELECTION',
                    message: 'No blocks selected for styling update'
                }
            };
        }

        const selectedIds = Array.from(this.selectedBlockIds);
        
        // Store original values for undo
        const originalValues = new Map<string, Partial<TimeBlock>>();
        for (const blockId of selectedIds) {
            const block = this.blocks.get(blockId);
            if (block) {
                const original: Partial<TimeBlock> = {};
                for (const key in updates) {
                    (original as any)[key] = (block as any)[key];
                }
                originalValues.set(blockId, original);
            }
        }

        // Apply updates to all selected blocks
        for (const blockId of selectedIds) {
            const result = this.updateBlock(blockId, updates);
            if (!result.success) {
                return result; // Return first error encountered
            }
        }

        // Create undo operation for the style change
        const styleProperties = Object.keys(updates).join(', ');
        const operation = UndoManager.createOperation(
            'style',
            `Update ${styleProperties} for ${selectedIds.length} block(s)`,
            () => {
                // Undo: restore original values
                for (const blockId of selectedIds) {
                    const originalValue = originalValues.get(blockId);
                    if (originalValue) {
                        this.updateBlock(blockId, originalValue);
                    }
                }
            },
            () => {
                // Redo: apply the style changes again
                for (const blockId of selectedIds) {
                    this.updateBlock(blockId, updates);
                }
            }
        );
        this.undoManager.addOperation(operation);

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
     * Resizes a block using logical coordinates directly (preferred method)
     */
    resizeBlockLogical(blockId: string, newStartDay: number, newStartTime: number, newDuration: number, newDaySpan: number): Result<void, ValidationError> {
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

        // Create the resized block with logical coordinates as source of truth
        const resizedBlock: TimeBlock = {
            ...originalBlock,
            startDay: newStartDay,
            startTime: newStartTime,
            duration: newDuration,
            daySpan: newDaySpan,
            selected: originalBlock.selected
        };

        // Validate the resized block
        const validation = this.validateBlock(resizedBlock);
        if (!validation.success) {
            return validation;
        }

        // Check for overlaps with other blocks (excluding the current block)
        const otherBlocks = Array.from(this.blocks.values()).filter(block => block.id !== blockId);
        const hasOverlap = otherBlocks.some(block => this.blocksOverlap(resizedBlock, block));
        
        if (hasOverlap) {
            return {
                success: false,
                error: {
                    code: 'OVERLAP',
                    message: 'Block would overlap with another block',
                    field: 'position'
                }
            };
        }

        // Update the block
        this.blocks.set(blockId, resizedBlock);
        return { success: true, data: undefined };
    }

    /**
     * Resizes a block using logical coordinates with undo support
     */
    resizeBlockLogicalWithUndo(blockId: string, newStartDay: number, newStartTime: number, newDuration: number, newDaySpan: number): Result<void, ValidationError> {
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

        // Store original properties for undo
        const originalProps = {
            startDay: originalBlock.startDay,
            startTime: originalBlock.startTime,
            duration: originalBlock.duration,
            daySpan: originalBlock.daySpan
        };

        // Perform the resize
        const result = this.resizeBlockLogical(blockId, newStartDay, newStartTime, newDuration, newDaySpan);
        
        if (result.success) {
            // Create undo operation
            const operation = UndoManager.createOperation(
                'resize',
                `Resize block: ${originalBlock.text || 'Untitled'}`,
                () => {
                    // Undo: restore original properties
                    this.resizeBlockLogical(blockId, originalProps.startDay, originalProps.startTime, originalProps.duration, originalProps.daySpan);
                },
                () => {
                    // Redo: apply the resize again
                    this.resizeBlockLogical(blockId, newStartDay, newStartTime, newDuration, newDaySpan);
                }
            );
            this.undoManager.addOperation(operation);
        }

        return result;
    }

    /**
     * Resizes a block with validation using logical coordinates (legacy pixel-based method)
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
     * Moves a block to a new position (startDay and startTime)
     */
    moveBlock(blockId: string, newStartDay: number, newStartTime: number): Result<void, ValidationError> {
        const block = this.blocks.get(blockId);
        if (!block) {
            return {
                success: false,
                error: { code: 'BLOCK_NOT_FOUND', message: 'Block not found', field: 'id' }
            };
        }

        // Create moved block with new position
        const movedBlock: TimeBlock = {
            ...block,
            startDay: newStartDay,
            startTime: newStartTime
        };

        // Validate the moved block
        const validationResult = this.validateBlock(movedBlock);
        if (!validationResult.success) {
            return validationResult;
        }

        // Check for overlaps with other blocks (exclude the block being moved)
        const overlapResult = this.checkOverlap(movedBlock, blockId);
        if (!overlapResult.success) {
            return overlapResult;
        }

        // Update the block
        this.blocks.set(blockId, movedBlock);
        return { success: true, data: undefined };
    }

    /**
     * Checks if a position is valid for moving blocks (no overlaps with existing blocks)
     */
    canMoveToPosition(blockIds: string[], newStartDay: number, newStartTime: number): boolean {
        if (blockIds.length === 0) return false;

        // Get the first block to determine the relative positions of other blocks
        const firstBlockId = blockIds[0];
        const firstBlock = this.blocks.get(firstBlockId!);
        if (!firstBlock) return false;

        // Calculate offset from original position
        const dayOffset = newStartDay - firstBlock.startDay;
        const timeOffset = newStartTime - firstBlock.startTime;

        // Check if all blocks can be moved to their new positions
        for (const blockId of blockIds) {
            const block = this.blocks.get(blockId);
            if (!block) return false;

            const newBlockStartDay = block.startDay + dayOffset;
            const newBlockStartTime = block.startTime + timeOffset;

            // Create temporary moved block
            const movedBlock: TimeBlock = {
                ...block,
                startDay: newBlockStartDay,
                startTime: newBlockStartTime
            };

            // Validate the moved block
            const validationResult = this.validateBlock(movedBlock);
            if (!validationResult.success) return false;

            // Check for overlaps with other blocks (exclude blocks being moved)
            const overlapResult = this.checkOverlap(movedBlock, blockId, new Set(blockIds));
            if (!overlapResult.success) return false;
        }

        return true;
    }

    /**
     * Moves multiple blocks maintaining their relative positions
     */
    moveBlocks(blockIds: string[], newStartDay: number, newStartTime: number): Result<void, ValidationError> {
        if (blockIds.length === 0) {
            return {
                success: false,
                error: { code: 'INVALID_SELECTION', message: 'No blocks selected', field: 'blockIds' }
            };
        }

        // Check if the move is valid
        if (!this.canMoveToPosition(blockIds, newStartDay, newStartTime)) {
            return {
                success: false,
                error: { code: 'INVALID_POSITION', message: 'Cannot move blocks to this position', field: 'position' }
            };
        }

        // Get the first block to determine the offset
        const firstBlockId = blockIds[0];
        const firstBlock = this.blocks.get(firstBlockId!);
        if (!firstBlock) {
            return {
                success: false,
                error: { code: 'BLOCK_NOT_FOUND', message: 'Block not found', field: 'id' }
            };
        }

        // Calculate offset
        const dayOffset = newStartDay - firstBlock.startDay;
        const timeOffset = newStartTime - firstBlock.startTime;

        // Move all blocks
        for (const blockId of blockIds) {
            const block = this.blocks.get(blockId);
            if (block) {
                const movedBlock: TimeBlock = {
                    ...block,
                    startDay: block.startDay + dayOffset,
                    startTime: block.startTime + timeOffset
                };
                this.blocks.set(blockId, movedBlock);
            }
        }

        return { success: true, data: undefined };
    }

    /**
     * Moves multiple blocks maintaining their relative positions with undo support
     */
    moveBlocksWithUndo(blockIds: string[], newStartDay: number, newStartTime: number): Result<void, ValidationError> {
        if (blockIds.length === 0) {
            return {
                success: false,
                error: { code: 'INVALID_SELECTION', message: 'No blocks selected', field: 'blockIds' }
            };
        }

        // Store original positions for undo
        const originalPositions = new Map<string, { startDay: number; startTime: number }>();
        for (const blockId of blockIds) {
            const block = this.blocks.get(blockId);
            if (block) {
                originalPositions.set(blockId, {
                    startDay: block.startDay,
                    startTime: block.startTime
                });
            }
        }

        // Perform the move
        const result = this.moveBlocks(blockIds, newStartDay, newStartTime);
        
        if (result.success) {
            // Create undo operation
            const operation = UndoManager.createOperation(
                'move',
                `Move ${blockIds.length} block(s)`,
                () => {
                    // Undo: restore original positions
                    for (const [blockId, originalPos] of originalPositions) {
                        const block = this.blocks.get(blockId);
                        if (block) {
                            const restoredBlock: TimeBlock = {
                                ...block,
                                startDay: originalPos.startDay,
                                startTime: originalPos.startTime
                            };
                            this.blocks.set(blockId, restoredBlock);
                        }
                    }
                },
                () => {
                    // Redo: apply the move again
                    this.moveBlocks(blockIds, newStartDay, newStartTime);
                }
            );
            this.undoManager.addOperation(operation);
        }

        return result;
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
     * Clears all blocks with undo support
     */
    clearAllWithUndo(): void {
        const allBlocks = Array.from(this.blocks.values());
        const selectedIds = new Set(this.selectedBlockIds);
        
        if (allBlocks.length === 0) {
            return; // Nothing to clear
        }

        // Clear all blocks
        this.clearAll();

        // Create undo operation to restore all blocks
        const operation = UndoManager.createOperation(
            'clear_all',
            `Clear all blocks (${allBlocks.length} blocks)`,
            () => {
                // Undo: restore all blocks
                for (const block of allBlocks) {
                    this.blocks.set(block.id, { ...block });
                    if (selectedIds.has(block.id)) {
                        this.selectedBlockIds.add(block.id);
                    }
                }
            },
            () => {
                // Redo: clear all blocks again
                this.clearAll();
            }
        );
        this.undoManager.addOperation(operation);
    }

    /**
     * Removes selected blocks with undo support
     */
    removeSelectedBlocksWithUndo(): number {
        const selectedIds = Array.from(this.selectedBlockIds);
        if (selectedIds.length === 0) {
            return 0;
        }

        const blocksToRemove = selectedIds.map(id => ({
            id,
            block: { ...this.blocks.get(id)! },
            wasSelected: true
        }));

        // Remove all blocks
        selectedIds.forEach(id => this.removeBlock(id));

        // Create undo operation
        const operation = UndoManager.createOperation(
            'bulk_delete',
            `Delete ${selectedIds.length} blocks`,
            () => {
                // Restore all blocks
                blocksToRemove.forEach(({ id, block, wasSelected }) => {
                    this.addBlock(block);
                    if (wasSelected) {
                        this.selectedBlockIds.add(id);
                    }
                });
            },
            () => {
                // Re-delete all blocks
                selectedIds.forEach(id => this.removeBlock(id));
            }
        );
        this.undoManager.addOperation(operation);

        return selectedIds.length;
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
     * Imports data from export with undo support
     */
    importDataWithUndo(data: WeekPlannerData): Result<void, ValidationError> {
        // Store current state for undo
        const currentData = this.exportData();
        
        // Validate before making any changes
        const validationResult = this.validateImportData(data);
        if (!validationResult.success) {
            return validationResult;
        }
        
        // Perform the import
        const result = this.importDataSilent(data);
        if (result.success) {
            // Add import operation to undo history (like any other operation)
            const operation = UndoManager.createOperation(
                'import',
                `Import ${data.blocks.length} blocks`,
                () => {
                    this.importDataSilent(currentData);
                },
                () => {
                    this.importDataSilent(data);
                }
            );
            this.undoManager.addOperation(operation);
        }
        return result;
    }

    /**
     * Validate import data without making changes
     */
    private validateImportData(data: WeekPlannerData): Result<void, ValidationError> {
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

        return { success: true, data: undefined };
    }

    /**
     * Private method to import data without clearing history (used by undo/redo)
     */
    private importDataSilent(data: WeekPlannerData): Result<void, ValidationError> {
        // Clear existing data and import (without affecting undo history)
        this.blocks.clear();
        this.selectedBlockIds.clear();
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
        
        // Validate day boundaries (startDay must be 0-6, and startDay + daySpan must not exceed grid)
        if (block.startDay < 0 || block.startDay > 6) {
            return {
                success: false,
                error: { code: 'DAY_OUT_OF_BOUNDS', message: 'Start day must be between 0 (Monday) and 6 (Sunday)', field: 'startDay' }
            };
        }
        
        if (block.startDay + block.daySpan > 7) {
            return {
                success: false,
                error: { code: 'DAY_OUT_OF_BOUNDS', message: 'Block extends beyond Sunday', field: 'daySpan' }
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
    private checkOverlap(newBlock: TimeBlock, excludeId?: string, excludeIds?: Set<string>): Result<void, ValidationError> {
        const allBlocks = Array.from(this.blocks.values());
        
        // Filter out excluded blocks
        const blocksToCheck = allBlocks.filter(block => {
            if (excludeId && block.id === excludeId) return false;
            if (excludeIds && excludeIds.has(block.id)) return false;
            return true;
        });
        
        const overlappingBlocks = this.findOverlappingBlocks(newBlock, blocksToCheck);
        
        if (overlappingBlocks.length > 0) {
            return {
                success: false,
                error: {
                    code: 'OVERLAP_ERROR',
                    message: `Block overlaps with existing blocks`,
                    field: 'overlap'
                }
            };
        }
        
        return { success: true, data: undefined };
    }

    /**
     * Legacy method for checking overlaps (returns array)
     */
    private checkOverlapLegacy(newBlock: TimeBlock): TimeBlock[] {
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
