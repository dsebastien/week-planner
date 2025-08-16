/**
 * Domain model for time blocks in the week planner
 */
export interface TimeBlock {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly startTime: number;
    readonly duration: number;
    readonly daySpan: number;
    text: string;
    readonly color: string;
    selected: boolean;
}
/**
 * Configuration for the week planner grid
 */
export interface GridConfig {
    startHour: number;
    endHour: number;
    timeSlotHeight: number;
    dayWidth: number;
    headerHeight: number;
    timeColumnWidth: number;
    days: readonly string[];
    canvasWidth: number;
    canvasHeight: number;
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
    readonly exportedAt: string;
}
/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
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
}
//# sourceMappingURL=types.d.ts.map