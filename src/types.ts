/**
 * Domain model for time blocks in the week planner
 */
export interface TimeBlock {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly startTime: number; // minutes from 00:00 (absolute time)
    readonly duration: number; // minutes (minimum 30, multiple of 30)
    readonly daySpan: number; // number of days (1-7)
    text: string;
    readonly color: string;
    selected: boolean;
}

/**
 * Configuration for the week planner grid
 */
export interface GridConfig {
    startHour: number; // 6 for 06:00
    endHour: number; // 24 for 00:00 (next day)
    timeSlotHeight: number; // height in pixels for 30 minutes
    dayWidth: number; // width in pixels for one day
    headerHeight: number; // height for day labels
    timeColumnWidth: number; // width for time labels
    days: readonly string[];
    canvasWidth: number; // actual canvas width
    canvasHeight: number; // actual canvas height
}

/**
 * 2D point with x and y coordinates
 */
export interface Point {
    readonly x: number;
    readonly y: number;
}

/**
 * Day of the week (0 = Monday, 6 = Sunday)
 */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Time in minutes from 00:00
 */
export type TimeMinutes = number;

/**
 * Duration in minutes (must be multiple of 30)
 */
export type DurationMinutes = number;

/**
 * RGB color in hex format (e.g., "#FF5733")
 */
export type HexColor = string;

/**
 * Export format for saving/loading the week planner
 */
export interface WeekPlannerData {
    readonly version: string;
    readonly blocks: readonly TimeBlock[];
    readonly config: GridConfig;
    readonly exportedAt: string; // ISO timestamp
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Validation error for time blocks
 */
export interface ValidationError {
    readonly code: string;
    readonly message: string;
    readonly field?: string;
}

/**
 * Mouse interaction state
 */
export interface MouseState {
    readonly isDown: boolean;
    readonly startPoint: Point | null;
    readonly currentPoint: Point | null;
    readonly isDragging: boolean;
    readonly resizing: boolean;
    readonly resizeHandle: ResizeHandle | null;
    readonly resizeBlockId: string | null;
    readonly originalBlock: TimeBlock | null;
}

/**
 * Resize handle types for time blocks
 */
export type ResizeHandle = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Resize operation information
 */
export interface ResizeOperation {
    readonly blockId: string;
    readonly handle: ResizeHandle;
    readonly originalBlock: TimeBlock;
    readonly startPoint: Point;
}
