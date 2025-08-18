import { RenderedTimeBlock } from './types.js';

/**
 * Manages all UI interactions including modals, toolbars, color pickers, and context menus
 * Extracted from index.html to improve maintainability and type safety
 */
export class UIManager {
    // Modal elements
    private readonly toolbarToggle: HTMLElement | null;
    private readonly toolbarMenu: HTMLElement | null;
    private readonly closeSidebar: HTMLElement | null;
    private readonly modalBackdrop: HTMLElement | null;
    private readonly modalContent: HTMLElement | null;

    // Edit toolbar elements
    private readonly editToolbar: HTMLElement | null;
    private readonly closeToolbar: HTMLElement | null;
    private currentSelectedBlock: RenderedTimeBlock | null = null;

    // Style controls
    private readonly backgroundColor: HTMLInputElement | null;
    private readonly textColor: HTMLInputElement | null;
    private readonly borderColor: HTMLInputElement | null;
    private readonly fontSize: HTMLInputElement | null;
    private readonly fontSizeValue: HTMLElement | null;
    private readonly boldBtn: HTMLButtonElement | null;
    private readonly italicBtn: HTMLButtonElement | null;
    private readonly alignLeft: HTMLButtonElement | null;
    private readonly alignCenter: HTMLButtonElement | null;
    private readonly alignRight: HTMLButtonElement | null;
    private readonly alignTop: HTMLButtonElement | null;
    private readonly alignMiddle: HTMLButtonElement | null;
    private readonly alignBottom: HTMLButtonElement | null;
    private readonly borderStyle: HTMLSelectElement | null;
    private readonly borderWidth: HTMLInputElement | null;
    private readonly cornerRadius: HTMLInputElement | null;
    private readonly cornerValue: HTMLElement | null;

    // Context menu elements and state
    private readonly contextMenu: HTMLElement | null;
    private readonly contextMenuItems: HTMLElement | null;
    private copiedStyle: any = null;
    private copiedBlocks: any[] = [];

    constructor() {
        // Initialize modal elements
        this.toolbarToggle = document.getElementById('toolbarToggle');
        this.toolbarMenu = document.getElementById('toolbarMenu');
        this.closeSidebar = document.getElementById('closeSidebar');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalContent = document.getElementById('modalContent');

        // Initialize toolbar elements
        this.editToolbar = document.getElementById('editToolbar');
        this.closeToolbar = document.getElementById('closeToolbar');

        // Initialize style control elements
        this.backgroundColor = document.getElementById('backgroundColor') as HTMLInputElement;
        this.textColor = document.getElementById('textColor') as HTMLInputElement;
        this.borderColor = document.getElementById('borderColor') as HTMLInputElement;
        this.fontSize = document.getElementById('fontSize') as HTMLInputElement;
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.boldBtn = document.getElementById('boldBtn') as HTMLButtonElement;
        this.italicBtn = document.getElementById('italicBtn') as HTMLButtonElement;
        this.alignLeft = document.getElementById('alignLeft') as HTMLButtonElement;
        this.alignCenter = document.getElementById('alignCenter') as HTMLButtonElement;
        this.alignRight = document.getElementById('alignRight') as HTMLButtonElement;
        this.alignTop = document.getElementById('alignTop') as HTMLButtonElement;
        this.alignMiddle = document.getElementById('alignMiddle') as HTMLButtonElement;
        this.alignBottom = document.getElementById('alignBottom') as HTMLButtonElement;
        this.borderStyle = document.getElementById('borderStyle') as HTMLSelectElement;
        this.borderWidth = document.getElementById('borderWidth') as HTMLInputElement;
        this.cornerRadius = document.getElementById('cornerRadius') as HTMLInputElement;
        this.cornerValue = document.getElementById('cornerValue');

        // Initialize context menu elements
        this.contextMenu = document.getElementById('contextMenu');
        this.contextMenuItems = document.getElementById('contextMenuItems');

        this.setupEventListeners();
        this.setupLoadingScreen();
        this.initColorPickers();
        this.setupContextMenu();
    }

    /**
     * Setup loading screen functionality
     */
    private setupLoadingScreen(): void {
        window.addEventListener('load', () => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        });
    }

    /**
     * Setup all event listeners
     */
    private setupEventListeners(): void {
        // Modal functionality
        this.toolbarToggle?.addEventListener('click', () => this.openModal());
        this.closeSidebar?.addEventListener('click', () => this.closeModal());
        this.modalBackdrop?.addEventListener('click', () => this.closeModal());
        
        // Close modal when Clear All is clicked
        document.getElementById('clearAll')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Close toolbar button
        this.closeToolbar?.addEventListener('click', () => {
            this.hideToolbar();
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    private handleKeyboardShortcuts(e: KeyboardEvent): void {
        // Escape key closes modal
        if (e.key === 'Escape' && !this.toolbarMenu?.classList.contains('hidden')) {
            this.closeModal();
        }
        
        // Ctrl+M opens/closes modal
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault(); // Prevent browser default behavior
            if (this.toolbarMenu?.classList.contains('hidden')) {
                this.openModal();
            } else {
                this.closeModal();
            }
        }
    }

    /**
     * Open the main modal/sidebar
     */
    public openModal(): void {
        // Deselect any current block selection and hide toolbar
        if ((window as any).weekPlanner) {
            (window as any).weekPlanner.blockManager?.selectBlock(null);
            if ((window as any).editToolbar) {
                (window as any).editToolbar.hide();
            }
            // Re-render to update the selection state
            (window as any).weekPlanner.render?.();
        }
        
        this.toolbarMenu?.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        
        // Trigger animation
        setTimeout(() => {
            this.modalContent?.classList.remove('modal-exit');
            this.modalContent?.classList.add('modal-enter');
        }, 10);
    }

    /**
     * Close the main modal/sidebar
     */
    public closeModal(): void {
        this.modalContent?.classList.remove('modal-enter');
        this.modalContent?.classList.add('modal-exit');
        
        setTimeout(() => {
            this.toolbarMenu?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);
    }

    /**
     * Initialize color picker functionality
     */
    private initColorPickers(): void {
        // Color picker setup will be implemented here
        // This is a placeholder for the complex color picker logic
    }

    /**
     * Show toolbar for a single selected block
     */
    public showToolbar(block: RenderedTimeBlock): void {
        // Implementation will be added
    }

    /**
     * Show toolbar for multiple selected blocks
     */
    public showMultipleToolbar(blocks: RenderedTimeBlock[]): void {
        // Implementation will be added
    }

    /**
     * Hide the edit toolbar
     */
    public hideToolbar(): void {
        this.editToolbar?.classList.add('hidden');
        this.currentSelectedBlock = null;
        this.hideAllColorPickers();
    }

    /**
     * Hide all color picker dropdowns
     */
    private hideAllColorPickers(): void {
        // Implementation will be added
    }

    /**
     * Context menu functions
     */
    public copyBlockStyle(block: RenderedTimeBlock): void {
        if (!block) return;
        
        this.copiedStyle = {
            color: block.color,
            textColor: block.textColor,
            fontSize: block.fontSize,
            fontStyle: { ...block.fontStyle },
            textAlignment: block.textAlignment,
            verticalAlignment: block.verticalAlignment,
            borderStyle: { ...block.borderStyle },
            cornerRadius: block.cornerRadius
        };
    }

    /**
     * Paste copied style to target block with intelligent font size adjustment
     */
    public pasteBlockStyle(targetBlock: RenderedTimeBlock): void {
        if (!this.copiedStyle || !targetBlock || !(window as any).weekPlanner) return;
        
        // Create a copy of the style to modify
        const styleToApply = { ...this.copiedStyle };
        
        // Adjust font size for small target blocks (height < 40px)
        // This prevents text overflow when pasting from large blocks to small blocks
        if (targetBlock.height < 40 && styleToApply.fontSize > 14) {
            styleToApply.fontSize = Math.min(styleToApply.fontSize, 14);
        }
        
        // Apply all copied style properties
        Object.keys(styleToApply).forEach(property => {
            (window as any).weekPlanner.updateSelectedBlockStyle(property, styleToApply[property]);
        });
    }

    public hasCopiedStyle(): boolean {
        return this.copiedStyle !== null;
    }

    public hasCopiedBlock(): boolean {
        return this.copiedBlocks.length > 0;
    }

    public getCopiedBlockCount(): number {
        return this.copiedBlocks.length;
    }

    /**
     * Setup context menu event listeners
     */
    private setupContextMenu(): void {
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
                this.hideContextMenu();
            }
        });

        // Hide context menu on scroll
        document.addEventListener('scroll', () => this.hideContextMenu());
    }

    /**
     * Show context menu at specified position with given items
     */
    public showContextMenu(x: number, y: number, items: Array<{label: string, disabled: boolean, action: () => void}>): void {
        if (!this.contextMenu || !this.contextMenuItems) return;

        // Clear existing items
        this.contextMenuItems.innerHTML = '';
        
        // Add items
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = `px-4 py-2 text-sm cursor-pointer transition-colors ${
                item.disabled 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-gray-200 hover:bg-gray-700 hover:text-white'
            }`;
            menuItem.textContent = item.label;
            
            if (!item.disabled) {
                menuItem.addEventListener('click', () => {
                    this.hideContextMenu();
                    item.action();
                });
            }
            
            this.contextMenuItems!.appendChild(menuItem);
        });
        
        // Position and show menu
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.remove('hidden');
        
        // Adjust position if menu goes off screen
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    /**
     * Hide the context menu
     */
    public hideContextMenu(): void {
        if (this.contextMenu) {
            this.contextMenu.classList.add('hidden');
            // Clear cell highlight when context menu is hidden
            if ((window as any).weekPlanner) {
                (window as any).weekPlanner.clearCellHighlight();
            }
        }
    }

    /**
     * Copy selected blocks (or single clicked block if none selected)
     */
    public copyBlock(clickedBlock: RenderedTimeBlock): void {
        if (!clickedBlock) return;
        
        const weekPlanner = (window as any).weekPlanner;
        if (!weekPlanner) return;

        // Get all selected blocks, or use the clicked block if none are selected
        const selectedBlocks = weekPlanner.blockManager.getSelectedBlocks();
        const blocksToCopy = selectedBlocks.length > 0 ? selectedBlocks : [clickedBlock];
        
        // Copy all blocks
        this.copiedBlocks = blocksToCopy.map((block: RenderedTimeBlock) => ({
            startTime: block.startTime,
            duration: block.duration,
            startDay: block.startDay,
            daySpan: block.daySpan,
            text: block.text,
            color: block.color,
            textColor: block.textColor,
            fontSize: block.fontSize,
            fontStyle: { ...block.fontStyle },
            textAlignment: block.textAlignment,
            verticalAlignment: block.verticalAlignment,
            borderStyle: { ...block.borderStyle },
            cornerRadius: block.cornerRadius
        }));
        
        console.log(`Copied ${this.copiedBlocks.length} block(s)`);
    }

    /**
     * Paste copied blocks at target position
     */
    public pasteBlock(targetDay: number, targetTime: number): void {
        if (this.copiedBlocks.length === 0) return;
        
        const weekPlanner = (window as any).weekPlanner;
        if (!weekPlanner) return;
        
        // Calculate the offset from the first copied block to maintain relative positions
        const firstBlock = this.copiedBlocks[0];
        const dayOffset = targetDay - firstBlock.startDay;
        const timeOffset = targetTime - firstBlock.startTime;
        
        let successfulPastes = 0;
        
        // Paste all copied blocks with relative positioning
        this.copiedBlocks.forEach((copiedBlock, index) => {
            const newBlock = {
                ...copiedBlock,
                id: `block-${Date.now()}-${Math.random()}-${index}`,
                startDay: copiedBlock.startDay + dayOffset,
                startTime: copiedBlock.startTime + timeOffset,
                selected: false
            };
            
            // Validate the new position is within bounds
            if (newBlock.startDay >= 0 && newBlock.startDay <= 6 && 
                newBlock.startTime >= 5 * 60 && newBlock.startTime + newBlock.duration <= 24 * 60) {
                
                const result = weekPlanner.blockManager.addBlock(newBlock);
                if (result.success) {
                    successfulPastes++;
                }
            }
        });
        
        // Trigger full re-render to update UI immediately
        if (successfulPastes > 0) {
            weekPlanner.render();
            console.log(`Pasted ${successfulPastes} block(s)`);
        }
    }
}