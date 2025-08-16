import { WeekPlanner } from './week-planner.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const weekPlanner = new WeekPlanner();
    // Expose to window for toolbar integration
    (window as any).weekPlanner = weekPlanner;
});
