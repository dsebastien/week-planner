import { GridConfig, Point } from './types.js';
export declare class GridUtils {
    static snapToGrid(x: number, y: number, config: GridConfig): Point;
    static getTimeFromY(y: number, config: GridConfig): number;
    static getYFromTime(timeMinutes: number, config: GridConfig): number;
    static getDayFromX(x: number, config: GridConfig): number;
    static getXFromDay(day: number, config: GridConfig): number;
    static formatTime(minutes: number): string;
    static getDurationInMinutes(height: number, config: GridConfig): number;
    static getHeightFromDuration(durationMinutes: number, config: GridConfig): number;
    static getDaySpan(width: number, config: GridConfig): number;
    static getWidthFromDaySpan(daySpan: number, config: GridConfig): number;
}
//# sourceMappingURL=grid-utils.d.ts.map