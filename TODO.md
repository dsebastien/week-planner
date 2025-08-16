BUSY:
When a block is selected, an edit toolbar should be displayed, similar to the one of Miro, with the following
  options: Background color, Text color, Font Size, Font Style (bold, italic, underlined, striked), Alignment
  (left, center, right), Border style, opacity, corners, color. Remove the "Block color" selector in the header


- When zooming in/out, the position of the time blocks is lost. Changing the zoom level should have no impact on the position of the time blocks!
- It should be possible to select multiple blocks at once and edit them all with the toolbar
- By default the text in a time block should be aligned center & middle
- alignment (vertical, horizontal), etc should be enums
- When right clicking on a time block, a menu should be shown with the following options: copy style, paste style (if one was copied previously), copy. When right clicking on an empty cell, the menu should show the following options: paste (if a time block was copied previously), Add time block here
- the border style and color of selected time blocks should be nicer
- ctrl + a should select all blocks
- when releasing the mouse after click + drag over existing time blocks, it should select those that are completely in the selected area
- When clicking and dragging outside of the grid, the preview block disappears and the operation is cancelled on mouse relese. Instead, the "preview block" should be limited by the grid (remain visible) and it should be added normally
- The code of this app is on GitHub and I want to build it and deploy it from there. I own dsebastien.net and want to deploy this at weekplanner.tools.dsebastien.net. My GitHub account has already two custom domains (dsebastien.net and stats.notes.dsebastien.net), so I suppose I could add one more. Generate the GitHub actions workflow I need to (release/build/deploy...). The release creation should also generate a changelog. Finally, explain how I should setup everything step by step
- Remove the wasted blank space at the bottom of the page. The grid should probably go all the way down
- Replace "..." with a hamburger icon
- At the bottom of the main menu, add a block for Donations pointing to https://www.buymeacoffee.com/dsebastien (use nice icons, a bit of text, etc)
- How to generate money with this app?
- showError(message: string) should display a notification, not an alert
- Generate a readme and update memory to remind you about always keeping it up to date