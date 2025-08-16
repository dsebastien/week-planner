export interface TimeBlock {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    startTime: number; // minutes from 06:00
    duration: number; // minutes
    daySpan: number; // number of days (1-7)
    text: string;
    color: string;
    selected: boolean;
}

export interface GridConfig {
    startHour: number; // 6 for 06:00
    endHour: number; // 24 for 00:00 (next day)
    timeSlotHeight: number; // height in pixels for 30 minutes
    dayWidth: number; // width in pixels for one day
    headerHeight: number; // height for day labels
    timeColumnWidth: number; // width for time labels
    days: string[];
    canvasWidth?: number; // actual canvas width
    canvasHeight?: number; // actual canvas height
}

export interface Point {
    x: number;
    y: number;
}
