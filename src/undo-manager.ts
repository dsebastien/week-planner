import { Operation, OperationType } from './types.js';

/**
 * Manages undo/redo operations for the week planner
 * Maintains a history of the last 100 operations
 */
export class UndoManager {
    private history: Operation[] = [];
    private currentIndex: number = -1;
    private readonly maxHistorySize: number = 100;

    /**
     * Add a new operation to the history
     */
    addOperation(operation: Operation): void {
        // Remove any operations after current index (redo history)
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Add new operation
        this.history.push(operation);
        this.currentIndex = this.history.length - 1;
        
        // Maintain max history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    /**
     * Undo the last operation
     */
    undo(): boolean {
        if (!this.canUndo()) {
            return false;
        }

        const operation = this.history[this.currentIndex];
        if (operation) {
            operation.undo();
            this.currentIndex--;
            return true;
        }
        return false;
    }

    /**
     * Redo the next operation
     */
    redo(): boolean {
        if (!this.canRedo()) {
            return false;
        }

        this.currentIndex++;
        const operation = this.history[this.currentIndex];
        if (operation) {
            operation.redo();
            return true;
        }
        return false;
    }

    /**
     * Check if undo is possible
     */
    canUndo(): boolean {
        return this.currentIndex >= 0;
    }

    /**
     * Check if redo is possible
     */
    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Clear all history (used for clear all and import operations)
     */
    clearHistory(): void {
        this.history = [];
        this.currentIndex = -1;
    }

    /**
     * Get the description of the next undo operation
     */
    getUndoDescription(): string | null {
        if (!this.canUndo()) {
            return null;
        }
        return this.history[this.currentIndex]?.description || null;
    }

    /**
     * Get the description of the next redo operation
     */
    getRedoDescription(): string | null {
        if (!this.canRedo()) {
            return null;
        }
        return this.history[this.currentIndex + 1]?.description || null;
    }

    /**
     * Get current history size
     */
    getHistorySize(): number {
        return this.history.length;
    }

    /**
     * Create a new operation
     */
    static createOperation(
        type: OperationType,
        description: string,
        undo: () => void,
        redo: () => void
    ): Operation {
        return {
            type,
            timestamp: Date.now(),
            description,
            undo,
            redo
        };
    }
}