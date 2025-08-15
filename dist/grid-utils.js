export class GridUtils {
    static snapToGrid(x, y, config) {
        const gridStartX = 10;
        const gridStartY = 10;
        // Snap to day boundaries
        const snappedX = Math.round((x - gridStartX - config.timeColumnWidth) / config.dayWidth) * config.dayWidth + gridStartX + config.timeColumnWidth;
        // Snap to 30-minute boundaries
        const snappedY = Math.round((y - gridStartY - config.headerHeight) / config.timeSlotHeight) * config.timeSlotHeight + gridStartY + config.headerHeight;
        return { x: snappedX, y: snappedY };
    }
    static getTimeFromY(y, config) {
        const gridStartY = 10;
        const relativeY = y - gridStartY - config.headerHeight;
        const timeSlots = Math.floor(relativeY / config.timeSlotHeight);
        return config.startHour * 60 + timeSlots * 30; // minutes from midnight
    }
    static getYFromTime(timeMinutes, config) {
        const gridStartY = 10;
        const startMinutes = config.startHour * 60;
        const relativeMinutes = timeMinutes - startMinutes;
        const timeSlots = relativeMinutes / 30;
        return gridStartY + config.headerHeight + timeSlots * config.timeSlotHeight;
    }
    static getDayFromX(x, config) {
        const gridStartX = 10;
        const relativeX = x - gridStartX - config.timeColumnWidth;
        return Math.floor(relativeX / config.dayWidth);
    }
    static getXFromDay(day, config) {
        const gridStartX = 10;
        return gridStartX + config.timeColumnWidth + day * config.dayWidth;
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