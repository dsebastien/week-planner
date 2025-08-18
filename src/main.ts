import { WeekPlanner } from './week-planner.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const weekPlanner = new WeekPlanner();
    // Expose to window for integration
    (window as any).weekPlanner = weekPlanner;
    (window as any).uiManager = weekPlanner.uiManager;
    
    // Create context menu system using UIManager
    (window as any).contextMenuSystem = {
        showContextMenu: (x: number, y: number, items: any[]) => weekPlanner.uiManager.showContextMenu(x, y, items),
        hideContextMenu: () => weekPlanner.uiManager.hideContextMenu(),
        copyBlockStyle: (block: any) => weekPlanner.uiManager.copyBlockStyle(block),
        pasteBlockStyle: (block: any) => weekPlanner.uiManager.pasteBlockStyle(block),
        copyBlock: (block: any) => weekPlanner.uiManager.copyBlock(block),
        pasteBlock: (day: number, time: number) => weekPlanner.uiManager.pasteBlock(day, time),
        hasCopiedStyle: () => weekPlanner.uiManager.hasCopiedStyle(),
        hasCopiedBlock: () => weekPlanner.uiManager.hasCopiedBlock(),
        getCopiedBlockCount: () => weekPlanner.uiManager.getCopiedBlockCount()
    };
});
