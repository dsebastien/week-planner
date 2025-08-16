import { GridConfig, Point, TimeMinutes, DurationMinutes } from './types.js';
/**
 * Utility functions for grid calculations, time formatting, and coordinate conversions
 */
export declare class GridUtils {
    private static readonly MINUTES_PER_SLOT;
    private static readonly MINUTES_PER_HOUR;
    private static readonly MINUTES_PER_DAY;
    /**
     * Snaps coordinates to the nearest grid position
     */
    static snapToGrid(x: number, y: number, config: GridConfig): Point;
    /**
     * Converts Y coordinate to time in minutes from 00:00
     */
    static getTimeFromY(y: number, config: GridConfig): TimeMinutes;
    /**
     * Converts time in minutes to Y coordinate
     */
    static getYFromTime(timeMinutes: TimeMinutes, config: GridConfig): number;
    /**
     * Converts X coordinate to day index (0 = Monday, 6 = Sunday)
     */
    static getDayFromX(x: number, config: GridConfig): number;
    /**
     * Converts day index to X coordinate
     */
    static getXFromDay(dayIndex: number, config: GridConfig): number;
    /**
     * Formats time in minutes to HH:MM string
     */
    static formatTime(minutes: TimeMinutes): string;
    /**
     * Formats duration in minutes to readable string
     */
    static formatDuration(durationMinutes: DurationMinutes): string;
    /**
     * Converts height in pixels to duration in minutes
     */
    static getDurationInMinutes(height: number, config: GridConfig): DurationMinutes;
    /**
     * Converts duration in minutes to height in pixels
     */
    static getHeightFromDuration(durationMinutes: DurationMinutes, config: GridConfig): number;
    /**
     * Calculates day span from width in pixels
     */
    static getDaySpan(width: number, config: GridConfig): number;
    /**
     * Converts day span to width in pixels
     */
    static getWidthFromDaySpan(daySpan: number, config: GridConfig): number;
    /**
     * Checks if coordinates are within the grid area
     */
    static isInGridArea(x: number, y: number, config: GridConfig): boolean;
    /**
     * Gets the grid boundaries
     */
    static getGridBounds(config: GridConfig): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    /**
     * Validates that time is within valid bounds
     */
    static isValidTime(timeMinutes: TimeMinutes, config: GridConfig): boolean;
    /**
     * Validates that duration is valid (multiple of 30 minutes)
     */
    static isValidDuration(durationMinutes: DurationMinutes): boolean;
    /**
     * Rounds duration to the nearest valid value
     */
    static roundDuration(durationMinutes: number): DurationMinutes;
    /**
     * Rounds time to the nearest valid slot
     */
    static roundTime(timeMinutes: number): TimeMinutes;
    /**
     * Calculates the end time for a block
     */
    static getEndTime(startTime: TimeMinutes, duration: DurationMinutes): TimeMinutes;
    /**
     * Checks if a time range is valid (doesn't cross day boundary inappropriately)
     */
    static isValidTimeRange(startTime: TimeMinutes, duration: DurationMinutes, config: GridConfig): boolean;
    /**
     * Gets the day name from day index
     */
    static getDayName(dayIndex: number, config: GridConfig): string;
    /**
     * Calculates the center point of a time block
     */
    static getBlockCenter(x: number, y: number, width: number, height: number): Point;
    /**
     * Calculates distance between two points
     */
    static getDistance(point1: Point, point2: Point): number;
}
//# sourceMappingURL=grid-utils.d.ts.map