- It should be possible to resize existing blocks (without overlapping other blocks)
- Text of the block should not overlap time of the block
- A normal cursor should be used in general. A hand cursor (pointer) should be displayed when hovering an existing block
- A better font should be used
- It should be possible to select multiple blocks at once and edit them all with the toolbar
- By default the text in a time block should be aligned center & middle
- alignment (vertical, horizontal), etc should be enums
- When right clicking on a time block, a menu should be shown with the following options: copy style, paste style (if one was copied previously), copy. When right clicking on an empty cell, the menu should show the following options: paste (if a time block was copied previously), Add time block here
- When clicking and dragging outside of the grid, the preview block disappears and the operation is cancelled on mouse relese. Instead, the "preview block" should be limited by the grid (remain visible) and it should be added normally
- Switch to Tailwind
- showError(message: string) should display a notification, not an alert

Remove the "Block color" option in the menu. When a block is selected, an edit toolbar should be displayed, similar to the one of Miro, with the following options: Background color, Text color, Font Size, Font Style (bold, italic, underlined, striked), Alignment (left, center, right), Border style, opacity, corners, color. 