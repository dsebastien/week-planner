import { GridUtils } from './grid-utils.js';
export class TimeBlockManager {
    constructor() {
        this.blocks = [];
        this.selectedBlock = null;
    }
    addBlock(block) {
        if (this.hasOverlap(block)) {
            return false;
        }
        this.blocks.push(block);
        return true;
    }
    removeBlock(blockId) {
        this.blocks = this.blocks.filter(block => block.id !== blockId);
        if (this.selectedBlock?.id === blockId) {
            this.selectedBlock = null;
        }
    }
    getBlocks() {
        return this.blocks;
    }
    selectBlock(blockId) {
        this.blocks.forEach(block => {
            block.selected = block.id === blockId;
        });
        this.selectedBlock = blockId ? this.blocks.find(b => b.id === blockId) || null : null;
    }
    getSelectedBlock() {
        return this.selectedBlock;
    }
    getBlockAt(x, y) {
        // Check blocks in reverse order (top to bottom in rendering)
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            if (x >= block.x && x <= block.x + block.width &&
                y >= block.y && y <= block.y + block.height) {
                return block;
            }
        }
        return null;
    }
    updateBlockText(blockId, text) {
        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
            block.text = text;
        }
    }
    clearAll() {
        this.blocks = [];
        this.selectedBlock = null;
    }
    hasOverlap(newBlock) {
        const newStartDay = GridUtils.getDayFromX(newBlock.x, this.getDefaultConfig());
        const newEndDay = newStartDay + newBlock.daySpan - 1;
        const newStartTime = newBlock.startTime;
        const newEndTime = newBlock.startTime + newBlock.duration;
        return this.blocks.some(block => {
            const blockStartDay = GridUtils.getDayFromX(block.x, this.getDefaultConfig());
            const blockEndDay = blockStartDay + block.daySpan - 1;
            const blockStartTime = block.startTime;
            const blockEndTime = block.startTime + block.duration;
            // Check for day overlap
            const dayOverlap = !(newEndDay < blockStartDay || newStartDay > blockEndDay);
            // Check for time overlap
            const timeOverlap = !(newEndTime <= blockStartTime || newStartTime >= blockEndTime);
            return dayOverlap && timeOverlap;
        });
    }
    getDefaultConfig() {
        return {
            startHour: 6,
            endHour: 24,
            timeSlotHeight: 20,
            dayWidth: 140,
            headerHeight: 40,
            timeColumnWidth: 80,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        };
    }
}
//# sourceMappingURL=time-block-manager.js.map