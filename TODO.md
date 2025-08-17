BUSY:



The block styling view seems to prevent the resizing of blocks. For example, if a block is selected and the block styling panel is below it, then resizing down can only get next to the block styling panel

When resizing a time block, if the block styling panel is below, the resize operation doesn't work while the mouse is over the block styling panel

When right clicking on a time block, a menu should be shown with the following options: "Copy Style" (copy all the block styling options), "Paste Style" (grayed out if no style was copied previously), "Copy" (create an in memory copy of the block, ready to be pasted elsewhere). When right clicking on an empty cell, the menu should show the following options: "Paste" (grayed out if no block was copied), "Create time block"

- How to monetize this app and quickly generate revenue?
- Cleanup Typescript imports. Import the normal typescript way, not from .js files!
- The code of this app is on GitHub and I want to build it and deploy it from there. I own dsebastien.net and want to deploy this at weekplanner.tools.dsebastien.net. My GitHub account has already two custom domains (dsebastien.net and stats.notes.dsebastien.net), so I suppose I could add one more. Generate the GitHub actions workflow I need to (release/build/deploy...). The release creation should also generate a changelog. Finally, explain how I should setup everything step by step
- Block Resize handles should be bigger/easier to click on
- Add ctrl + z support (mention it in the list of shortcuts in the menu). Maintain an history of the last 100 operations. The history should be cleared after a clear all and also after an import
- Block styling panel display when selected time block is at the bottom is not great (overlaps, goes outside the screen etc)
- Create a README.md file. Update memory to ensure that all future changes are also reflected in the readme
- Implement import from Markdown (assuming the Markdown template is used)
- Add block styling options to show/hide the start time, end time & duration
- When releasing the mouse after click + drag over existing time blocks, it should select those that are completely in the selected area