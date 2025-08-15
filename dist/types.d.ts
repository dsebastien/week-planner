export interface TimeBlock {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    startTime: number;
    duration: number;
    daySpan: number;
    text: string;
    color: string;
    selected: boolean;
}
export interface GridConfig {
    startHour: number;
    endHour: number;
    timeSlotHeight: number;
    dayWidth: number;
    headerHeight: number;
    timeColumnWidth: number;
    days: string[];
    canvasWidth?: number;
    canvasHeight?: number;
}
export interface Point {
    x: number;
    y: number;
}
//# sourceMappingURL=types.d.ts.map