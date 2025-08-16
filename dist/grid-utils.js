export class GridUtils {
    static snapToGrid(x, y, config) {
        // Ensure we stay within grid bounds
        const minX = config.timeColumnWidth;
        const maxX = config.timeColumnWidth + (config.days.length * config.dayWidth);
        const boundedX = Math.max(minX, Math.min(x, maxX));
        const snappedX = Math.round((boundedX - config.timeColumnWidth) / config.dayWidth) * config.dayWidth + config.timeColumnWidth;
        const snappedY = Math.round((y - config.headerHeight) / config.timeSlotHeight) * config.timeSlotHeight + config.headerHeight;
        return { x: snappedX, y: snappedY };
    }
    static getTimeFromY(y, config) {
        const relativeY = y - config.headerHeight;
        const timeSlots = Math.floor(relativeY / config.timeSlotHeight);
        return config.startHour * 60 + timeSlots * 30;
    }
    static getYFromTime(timeMinutes, config) {
        const startMinutes = config.startHour * 60;
        const relativeMinutes = timeMinutes - startMinutes;
        const timeSlots = relativeMinutes / 30;
        return config.headerHeight + timeSlots * config.timeSlotHeight;
    }
    static getDayFromX(x, config) {
        const relativeX = x - config.timeColumnWidth;
        return Math.floor(relativeX / config.dayWidth);
    }
    static getXFromDay(day, config) {
        return config.timeColumnWidth + day * config.dayWidth;
    }
    static formatTime(minutes) {
        const totalMinutes = minutes % (24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    static getDurationInMinutes(height, config) {
        return Math.round(height / config.timeSlotHeight) * 30;
    }
    static getHeightFromDuration(durationMinutes, config) {
        return (durationMinutes / 30) * config.timeSlotHeight;
    }
    static getDaySpan(width, config) {
        return Math.max(1, Math.min(7, Math.round(width / config.dayWidth)));
    }
    static getWidthFromDaySpan(daySpan, config) {
        return daySpan * config.dayWidth;
    }
}
//# sourceMappingURL=grid-utils.js.map