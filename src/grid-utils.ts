import { 
    GridConfig, 
    Point, 
    DayIndex, 
    TimeMinutes, 
    DurationMinutes 
} from './types.js';

/**
 * Utility functions for grid calculations, time formatting, and coordinate conversions
 */
export class GridUtils {
    private static readonly MINUTES_PER_SLOT = 30;
    private static readonly MINUTES_PER_HOUR = 60;
    private static readonly MINUTES_PER_DAY = 24 * 60;

    /**
     * Snaps coordinates to the nearest grid position
     */
    static snapToGrid(x: number, y: number, config: GridConfig): Point {
        const gridBounds = this.getGridBounds(config);
        
        // Clamp x to grid bounds
        const boundedX = Math.max(gridBounds.minX, Math.min(x, gridBounds.maxX));
        
        // Clamp y to valid grid bounds (preventing interaction beyond 23:30)
        const boundedY = Math.max(gridBounds.minY, Math.min(y, gridBounds.maxY));
        
        // Snap to nearest grid intersection
        const relativeX = boundedX - config.timeColumnWidth;
        const snappedX = Math.round(relativeX / config.dayWidth) * config.dayWidth + config.timeColumnWidth;
        
        const relativeY = boundedY - config.headerHeight;
        const snappedY = Math.round(relativeY / config.timeSlotHeight) * config.timeSlotHeight + config.headerHeight;
        
        return { x: snappedX, y: snappedY };
    }

    /**
     * Converts Y coordinate to time in minutes from 00:00
     */
    static getTimeFromY(y: number, config: GridConfig): TimeMinutes {
        const relativeY = Math.max(0, y - config.headerHeight);
        const timeSlots = Math.floor(relativeY / config.timeSlotHeight);
        return config.startHour * this.MINUTES_PER_HOUR + timeSlots * this.MINUTES_PER_SLOT;
    }

    /**
     * Converts time in minutes to Y coordinate
     */
    static getYFromTime(timeMinutes: TimeMinutes, config: GridConfig): number {
        const startMinutes = config.startHour * this.MINUTES_PER_HOUR;
        const relativeMinutes = Math.max(0, timeMinutes - startMinutes);
        const timeSlots = relativeMinutes / this.MINUTES_PER_SLOT;
        return config.headerHeight + timeSlots * config.timeSlotHeight;
    }

    /**
     * Converts X coordinate to day index (0 = Monday, 6 = Sunday)
     */
    static getDayFromX(x: number, config: GridConfig): number {
        const relativeX = Math.max(0, x - config.timeColumnWidth);
        const dayIndex = Math.floor(relativeX / config.dayWidth);
        return Math.max(0, Math.min(config.days.length - 1, dayIndex));
    }

    /**
     * Converts day index to X coordinate
     */
    static getXFromDay(dayIndex: number, config: GridConfig): number {
        return config.timeColumnWidth + dayIndex * config.dayWidth;
    }

    /**
     * Formats time in minutes to HH:MM string
     */
    static formatTime(minutes: TimeMinutes): string {
        const normalizedMinutes = ((minutes % this.MINUTES_PER_DAY) + this.MINUTES_PER_DAY) % this.MINUTES_PER_DAY;
        const hours = Math.floor(normalizedMinutes / this.MINUTES_PER_HOUR);
        const mins = normalizedMinutes % this.MINUTES_PER_HOUR;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Formats duration in minutes to readable string
     */
    static formatDuration(durationMinutes: DurationMinutes): string {
        const hours = Math.floor(durationMinutes / this.MINUTES_PER_HOUR);
        const minutes = durationMinutes % this.MINUTES_PER_HOUR;
        
        if (hours === 0) {
            return `${minutes}min`;
        } else if (minutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${minutes}min`;
        }
    }

    /**
     * Converts height in pixels to duration in minutes
     */
    static getDurationInMinutes(height: number, config: GridConfig): DurationMinutes {
        const slots = Math.round(height / config.timeSlotHeight);
        return Math.max(this.MINUTES_PER_SLOT, slots * this.MINUTES_PER_SLOT);
    }

    /**
     * Converts duration in minutes to height in pixels
     */
    static getHeightFromDuration(durationMinutes: DurationMinutes, config: GridConfig): number {
        const slots = Math.max(1, durationMinutes / this.MINUTES_PER_SLOT);
        return slots * config.timeSlotHeight;
    }

    /**
     * Calculates day span from width in pixels
     */
    static getDaySpan(width: number, config: GridConfig): number {
        const daySpan = Math.round(width / config.dayWidth);
        return Math.max(1, Math.min(7, daySpan));
    }

    /**
     * Converts day span to width in pixels
     */
    static getWidthFromDaySpan(daySpan: number, config: GridConfig): number {
        const clampedSpan = Math.max(1, Math.min(7, daySpan));
        return clampedSpan * config.dayWidth;
    }

    /**
     * Checks if coordinates are within the grid area
     */
    static isInGridArea(x: number, y: number, config: GridConfig): boolean {
        const bounds = this.getGridBounds(config);
        return x >= bounds.minX && 
               x <= bounds.maxX && 
               y >= bounds.minY && 
               y <= bounds.maxY;
    }

    /**
     * Gets the grid boundaries
     */
    static getGridBounds(config: GridConfig): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } {
        const totalHours = config.endHour - config.startHour;
        const totalSlots = totalHours * 2; // 30-minute slots
        const maxValidY = config.headerHeight + totalSlots * config.timeSlotHeight;
        
        return {
            minX: config.timeColumnWidth,
            maxX: config.timeColumnWidth + (config.days.length * config.dayWidth),
            minY: config.headerHeight,
            maxY: maxValidY // Only allow interaction up to the last valid time slot (23:30)
        };
    }

    /**
     * Validates that time is within valid bounds
     */
    static isValidTime(timeMinutes: TimeMinutes, config: GridConfig): boolean {
        const startTime = config.startHour * this.MINUTES_PER_HOUR;
        const endTime = config.endHour * this.MINUTES_PER_HOUR;
        return timeMinutes >= startTime && timeMinutes < endTime;
    }

    /**
     * Validates that duration is valid (multiple of 30 minutes)
     */
    static isValidDuration(durationMinutes: DurationMinutes): boolean {
        return durationMinutes >= this.MINUTES_PER_SLOT && 
               durationMinutes % this.MINUTES_PER_SLOT === 0;
    }

    /**
     * Rounds duration to the nearest valid value
     */
    static roundDuration(durationMinutes: number): DurationMinutes {
        const rounded = Math.round(durationMinutes / this.MINUTES_PER_SLOT) * this.MINUTES_PER_SLOT;
        return Math.max(this.MINUTES_PER_SLOT, rounded);
    }

    /**
     * Rounds time to the nearest valid slot
     */
    static roundTime(timeMinutes: number): TimeMinutes {
        return Math.round(timeMinutes / this.MINUTES_PER_SLOT) * this.MINUTES_PER_SLOT;
    }

    /**
     * Calculates the end time for a block
     */
    static getEndTime(startTime: TimeMinutes, duration: DurationMinutes): TimeMinutes {
        return startTime + duration;
    }

    /**
     * Checks if a time range is valid (doesn't cross day boundary inappropriately)
     */
    static isValidTimeRange(startTime: TimeMinutes, duration: DurationMinutes, config: GridConfig): boolean {
        const endTime = this.getEndTime(startTime, duration);
        const maxTime = config.endHour * this.MINUTES_PER_HOUR;
        return this.isValidTime(startTime, config) && endTime <= maxTime;
    }

    /**
     * Gets the day name from day index
     */
    static getDayName(dayIndex: number, config: GridConfig): string {
        return config.days[dayIndex] || 'Unknown';
    }

    /**
     * Calculates the center point of a time block
     */
    static getBlockCenter(x: number, y: number, width: number, height: number): Point {
        return {
            x: x + width / 2,
            y: y + height / 2
        };
    }

    /**
     * Calculates distance between two points
     */
    static getDistance(point1: Point, point2: Point): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculates pixel position and dimensions from logical properties
     * This is the source of truth for block positioning
     */
    static calculateBlockPixelProperties(
        startDay: number, 
        startTime: number, 
        duration: number, 
        daySpan: number, 
        config: GridConfig
    ): { x: number; y: number; width: number; height: number } {
        const x = this.getXFromDay(startDay, config);
        const y = this.getYFromTime(startTime, config);
        const width = this.getWidthFromDaySpan(daySpan, config);
        const height = this.getHeightFromDuration(duration, config);
        
        return { x, y, width, height };
    }
}
