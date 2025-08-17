import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TimeBlockManager } from '../src/time-block-manager.js';
import { GridConfig, TimeBlock, VerticalAlignment } from '../src/types.js';

describe('TimeBlockManager', () => {
    const testConfig: GridConfig = {
        startHour: 6,
        endHour: 24,
        timeSlotHeight: 24,
        dayWidth: 140,
        headerHeight: 60,
        timeColumnWidth: 120,
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        canvasWidth: 1200,
        canvasHeight: 800
    };

    let manager: TimeBlockManager;

    const createTestBlock = (overrides: Partial<TimeBlock> = {}): TimeBlock => ({
        id: 'test-block',
        x: 120,
        y: 60,
        width: 140,
        height: 48,
        startTime: 6 * 60, // 6:00 AM
        duration: 60, // 1 hour
        daySpan: 1,
        text: 'Test Block',
        color: '#4CAF50',
        textColor: '#ffffff',
        fontSize: 16,
        fontStyle: {
            bold: false,
            italic: false
        },
        textAlignment: 'center',
        verticalAlignment: 'middle',
        borderStyle: {
            width: 2,
            style: 'solid',
            color: '#4CAF50'
        },
        cornerRadius: 5,
        selected: false,
        ...overrides
    });

    describe('block management', () => {
        test('should add valid block successfully', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            const result = manager.addBlock(block);
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(manager.getBlocks().length, 1);
            assert.strictEqual(manager.getBlock('test-block')?.id, 'test-block');
        });

        test('should prevent adding overlapping blocks', () => {
            manager = new TimeBlockManager(testConfig);
            const block1 = createTestBlock({ id: 'block1' });
            const block2 = createTestBlock({ 
                id: 'block2',
                startTime: 6 * 60 + 30, // 6:30 AM - overlaps with block1
                duration: 60
            });
            
            manager.addBlock(block1);
            const result = manager.addBlock(block2);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'OVERLAP_ERROR');
            assert.strictEqual(manager.getBlocks().length, 1);
        });

        test('should allow non-overlapping blocks', () => {
            manager = new TimeBlockManager(testConfig);
            const block1 = createTestBlock({ id: 'block1', startTime: 6 * 60, duration: 60 });
            const block2 = createTestBlock({ 
                id: 'block2', 
                startTime: 7 * 60, // 7:00 AM - no overlap
                duration: 60
            });
            
            manager.addBlock(block1);
            const result = manager.addBlock(block2);
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(manager.getBlocks().length, 2);
        });

        test('should remove block correctly', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            manager.addBlock(block);
            const removed = manager.removeBlock('test-block');
            
            assert.strictEqual(removed, true);
            assert.strictEqual(manager.getBlocks().length, 0);
            assert.strictEqual(manager.getBlock('test-block'), null);
        });

        test('should update block text', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            manager.addBlock(block);
            const updated = manager.updateBlockText('test-block', 'Updated Text');
            
            assert.strictEqual(updated, true);
            assert.strictEqual(manager.getBlock('test-block')?.text, 'Updated Text');
        });
    });

    describe('block selection', () => {
        test('should select and deselect blocks', () => {
            manager = new TimeBlockManager(testConfig);
            const block1 = createTestBlock({ id: 'block1' });
            const block2 = createTestBlock({ id: 'block2', x: 260, startTime: 7 * 60 });
            
            manager.addBlock(block1);
            manager.addBlock(block2);
            
            manager.selectBlock('block1');
            assert.strictEqual(manager.getSelectedBlock()?.id, 'block1');
            assert.strictEqual(manager.getBlock('block1')?.selected, true);
            assert.strictEqual(manager.getBlock('block2')?.selected, false);
            
            manager.selectBlock('block2');
            assert.strictEqual(manager.getSelectedBlock()?.id, 'block2');
            assert.strictEqual(manager.getBlock('block1')?.selected, false);
            assert.strictEqual(manager.getBlock('block2')?.selected, true);
            
            manager.selectBlock(null);
            assert.strictEqual(manager.getSelectedBlock(), null);
            assert.strictEqual(manager.getBlock('block1')?.selected, false);
            assert.strictEqual(manager.getBlock('block2')?.selected, false);
        });
    });

    describe('block positioning', () => {
        test('should find block at coordinates', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            manager.addBlock(block);
            
            const foundBlock = manager.getBlockAt(150, 80);
            assert.strictEqual(foundBlock?.id, 'test-block');
            
            const notFound = manager.getBlockAt(50, 50);
            assert.strictEqual(notFound, null);
        });

        test('should return topmost block when multiple blocks overlap in coordinates', () => {
            manager = new TimeBlockManager(testConfig);
            
            // Add blocks in different days but same time to test coordinate overlap
            const block1 = createTestBlock({ id: 'block1', x: 120, startTime: 6 * 60 });
            const block2 = createTestBlock({ id: 'block2', x: 260, startTime: 6 * 60 });
            
            manager.addBlock(block1);
            manager.addBlock(block2);
            
            // Test finding block1
            const found1 = manager.getBlockAt(150, 80);
            assert.strictEqual(found1?.id, 'block1');
            
            // Test finding block2
            const found2 = manager.getBlockAt(300, 80);
            assert.strictEqual(found2?.id, 'block2');
        });
    });

    describe('validation', () => {
        test('should reject block with invalid duration', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock({ duration: 25 }); // Invalid duration
            
            const result = manager.addBlock(block);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'INVALID_DURATION');
        });

        test('should reject block with invalid time range', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock({ 
                startTime: 5 * 60, // Before start hour
                duration: 60
            });
            
            const result = manager.addBlock(block);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'TIME_OUT_OF_BOUNDS');
        });

        test('should reject block with invalid day span', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock({ daySpan: 8 }); // More than 7 days
            
            const result = manager.addBlock(block);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'INVALID_DAY_SPAN');
        });

        test('should reject block with invalid color', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock({ color: 'invalid-color' });
            
            const result = manager.addBlock(block);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'INVALID_COLOR');
        });

        test('should reject block with empty ID', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock({ id: '' });
            
            const result = manager.addBlock(block);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'INVALID_ID');
        });
    });

    describe('data export/import', () => {
        test('should export data correctly', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            manager.addBlock(block);
            const exportedData = manager.exportData();
            
            assert.strictEqual(exportedData.version, '1.0');
            assert.strictEqual(exportedData.blocks.length, 1);
            assert.strictEqual(exportedData.blocks[0]!.id, 'test-block');
            assert.ok(exportedData.exportedAt);
        });

        test('should import valid data successfully', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            const importData = {
                version: '1.0',
                blocks: [block],
                config: testConfig,
                exportedAt: new Date().toISOString()
            };
            
            const result = manager.importData(importData);
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(manager.getBlocks().length, 1);
            assert.strictEqual(manager.getBlock('test-block')?.id, 'test-block');
        });

        test('should reject import with unsupported version', () => {
            manager = new TimeBlockManager(testConfig);
            
            const importData = {
                version: '2.0', // Unsupported version
                blocks: [],
                config: testConfig,
                exportedAt: new Date().toISOString()
            };
            
            const result = manager.importData(importData);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'VERSION_MISMATCH');
        });

        test('should reject import with overlapping blocks', () => {
            manager = new TimeBlockManager(testConfig);
            
            const block1 = createTestBlock({ id: 'block1' });
            const block2 = createTestBlock({ 
                id: 'block2',
                startTime: 6 * 60 + 30 // Overlaps with block1
            });
            
            const importData = {
                version: '1.0',
                blocks: [block1, block2],
                config: testConfig,
                exportedAt: new Date().toISOString()
            };
            
            const result = manager.importData(importData);
            
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error.code, 'IMPORT_OVERLAP');
        });
    });

    describe('configuration updates', () => {
        test('should update configuration and recalculate block positions', () => {
            manager = new TimeBlockManager(testConfig);
            const block = createTestBlock();
            
            manager.addBlock(block);
            
            const newConfig = { ...testConfig, dayWidth: 200 };
            manager.updateConfig(newConfig);
            
            const updatedBlock = manager.getBlock('test-block');
            assert.ok(updatedBlock);
            assert.strictEqual(updatedBlock!.width, 200);
        });
    });

    describe('clear functionality', () => {
        test('should clear all blocks', () => {
            manager = new TimeBlockManager(testConfig);
            const block1 = createTestBlock({ id: 'block1' });
            const block2 = createTestBlock({ id: 'block2', x: 260, startTime: 7 * 60 });
            
            manager.addBlock(block1);
            manager.addBlock(block2);
            manager.selectBlock('block1');
            
            manager.clearAll();
            
            assert.strictEqual(manager.getBlocks().length, 0);
            assert.strictEqual(manager.getSelectedBlock(), null);
        });
    });
});