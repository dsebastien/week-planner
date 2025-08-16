import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GridUtils } from '../src/grid-utils.js';
import { GridConfig } from '../src/types.js';

describe('GridUtils', () => {
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

    describe('snapToGrid', () => {
        test('should snap coordinates to grid intersections', () => {
            const result = GridUtils.snapToGrid(150, 100, testConfig);
            
            // Should snap to the nearest grid intersection
            assert.strictEqual(result.x, 120); // timeColumnWidth + 0 * dayWidth
            // y = 100, headerHeight = 60, relativeY = 40, slots = round(40/24) = 2, snapY = 60 + 2*24 = 108
            assert.strictEqual(result.y, 108); // headerHeight + 2 * timeSlotHeight
        });

        test('should respect grid bounds', () => {
            const result = GridUtils.snapToGrid(2000, 100, testConfig);
            
            // Should be clamped to within grid bounds
            assert.ok(result.x >= testConfig.timeColumnWidth);
            assert.ok(result.x <= testConfig.timeColumnWidth + testConfig.days.length * testConfig.dayWidth);
        });
    });

    describe('time conversion', () => {
        test('should convert Y coordinate to time correctly', () => {
            const y = testConfig.headerHeight + testConfig.timeSlotHeight * 2; // 2 slots = 1 hour
            const time = GridUtils.getTimeFromY(y, testConfig);
            
            assert.strictEqual(time, 7 * 60); // 7:00 AM (6:00 start + 1 hour)
        });

        test('should convert time to Y coordinate correctly', () => {
            const time = 7 * 60; // 7:00 AM
            const y = GridUtils.getYFromTime(time, testConfig);
            
            assert.strictEqual(y, testConfig.headerHeight + testConfig.timeSlotHeight * 2);
        });

        test('should format time correctly', () => {
            assert.strictEqual(GridUtils.formatTime(0), '00:00');
            assert.strictEqual(GridUtils.formatTime(90), '01:30');
            assert.strictEqual(GridUtils.formatTime(1440), '00:00'); // 24 hours = 0:00 next day
            assert.strictEqual(GridUtils.formatTime(750), '12:30');
        });

        test('should format duration correctly', () => {
            assert.strictEqual(GridUtils.formatDuration(30), '30min');
            assert.strictEqual(GridUtils.formatDuration(60), '1h');
            assert.strictEqual(GridUtils.formatDuration(90), '1h 30min');
            assert.strictEqual(GridUtils.formatDuration(120), '2h');
        });
    });

    describe('day conversion', () => {
        test('should convert X coordinate to day index correctly', () => {
            const x = testConfig.timeColumnWidth + testConfig.dayWidth * 1.5;
            const day = GridUtils.getDayFromX(x, testConfig);
            
            assert.strictEqual(day, 1); // Tuesday (0-indexed)
        });

        test('should convert day index to X coordinate correctly', () => {
            const x = GridUtils.getXFromDay(2, testConfig);
            
            assert.strictEqual(x, testConfig.timeColumnWidth + testConfig.dayWidth * 2);
        });

        test('should get day name correctly', () => {
            assert.strictEqual(GridUtils.getDayName(0, testConfig), 'Monday');
            assert.strictEqual(GridUtils.getDayName(6, testConfig), 'Sunday');
        });
    });

    describe('validation', () => {
        test('should validate time correctly', () => {
            assert.strictEqual(GridUtils.isValidTime(6 * 60, testConfig), true); // 6:00 AM
            assert.strictEqual(GridUtils.isValidTime(23 * 60, testConfig), true); // 11:00 PM
            assert.strictEqual(GridUtils.isValidTime(5 * 60, testConfig), false); // 5:00 AM
            assert.strictEqual(GridUtils.isValidTime(24 * 60, testConfig), false); // 12:00 AM next day
        });

        test('should validate duration correctly', () => {
            assert.strictEqual(GridUtils.isValidDuration(30), true);
            assert.strictEqual(GridUtils.isValidDuration(60), true);
            assert.strictEqual(GridUtils.isValidDuration(25), false);
            assert.strictEqual(GridUtils.isValidDuration(35), false);
        });

        test('should round duration correctly', () => {
            assert.strictEqual(GridUtils.roundDuration(25), 30);
            assert.strictEqual(GridUtils.roundDuration(35), 30);
            assert.strictEqual(GridUtils.roundDuration(45), 60);
            assert.strictEqual(GridUtils.roundDuration(75), 90);
        });
    });

    describe('grid bounds', () => {
        test('should check if point is in grid area correctly', () => {
            assert.strictEqual(GridUtils.isInGridArea(50, 50, testConfig), false); // In time column
            assert.strictEqual(GridUtils.isInGridArea(150, 30, testConfig), false); // In header
            assert.strictEqual(GridUtils.isInGridArea(150, 100, testConfig), true); // In grid
            assert.strictEqual(GridUtils.isInGridArea(2000, 100, testConfig), false); // Beyond right edge
        });

        test('should return correct grid bounds', () => {
            const bounds = GridUtils.getGridBounds(testConfig);
            
            assert.strictEqual(bounds.minX, testConfig.timeColumnWidth);
            assert.strictEqual(bounds.maxX, testConfig.timeColumnWidth + testConfig.days.length * testConfig.dayWidth);
            assert.strictEqual(bounds.minY, testConfig.headerHeight);
            assert.strictEqual(bounds.maxY, testConfig.canvasHeight);
        });
    });

    describe('utility functions', () => {
        test('should calculate block center correctly', () => {
            const center = GridUtils.getBlockCenter(100, 200, 140, 48);
            
            assert.strictEqual(center.x, 170);
            assert.strictEqual(center.y, 224);
        });

        test('should calculate distance correctly', () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 3, y: 4 };
            const distance = GridUtils.getDistance(point1, point2);
            
            assert.strictEqual(distance, 5); // 3-4-5 triangle
        });
    });
});