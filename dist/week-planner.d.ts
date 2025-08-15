export declare class WeekPlanner {
    private canvas;
    private renderer;
    private blockManager;
    private config;
    private textInput;
    private colorPicker;
    private isDragging;
    private dragStartPoint;
    private currentDragBlock;
    private editingBlock;
    constructor();
    private setupEventListeners;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onDoubleClick;
    private onKeyDown;
    private startEditingBlock;
    private stopEditingBlock;
    private onTextInputBlur;
    private onTextInputKeyDown;
    private drawPreviewBlock;
    private generateBlockId;
    private render;
    private exportSVG;
    private exportPNG;
    private clearAll;
}
//# sourceMappingURL=week-planner.d.ts.map