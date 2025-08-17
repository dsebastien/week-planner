BUSY:

- The block style overlay MUST ALWAYS BE displayed IN the grid, not outside or partly outside like this: /c/Users/trankill/Pictures/Screenshots/Capture d'\''écran 2025-08-17 172150.png

- When right clicking on a time block, a menu should be shown with the following options: copy style, paste style (if one was copied previously), copy. When right clicking on an empty cell, the menu should show the following options: paste (if a time block was copied previously), Add time block here
- The code of this app is on GitHub and I want to build it and deploy it from there. I own dsebastien.net and want to deploy this at weekplanner.tools.dsebastien.net. My GitHub account has already two custom domains (dsebastien.net and stats.notes.dsebastien.net), so I suppose I could add one more. Generate the GitHub actions workflow I need to (release/build/deploy...). The release creation should also generate a changelog. Finally, explain how I should setup everything step by step
- Remove the wasted blank space at the bottom of the page. The grid should probably go all the way down
- Fix block resizing: NOTHING should be calculated through the width/height/x/y positions. Instead, the data model properties should be used to derive all that (ie use start time, duration & day span to know where what belongs, ...)
- At the bottom of the main menu, add a block for Donations pointing to https://www.buymeacoffee.com/dsebastien (use nice icons, a bit of text, etc)
- How to generate money with this app?
- showError(message: string) should display a notification, not an alert
- Generate a readme and update memory to remind you about always keeping it up to date
- Time blocks should support multi-line text
- Add block styling option to show/hide the start time, end time & duration
- The block styling view seems to prevent the resizing of blocks. For example, if a block is selected and the block styling panel is below it, then resizing down can only get next to the block styling panel
- When releasing the mouse after click + drag over existing time blocks, it should select those that are completely in the selected area
- Bug: time block text vertical alignment is buggy. When the text size is not the default, the text doesn't render where it should
- When text is too big, it wraps, but displays incorrectly. Fix that: /c/Users/trankill/Pictures/Screenshots/Capture d'\''écran 2025-08-17 171050.png
- Implement import from Markdown (assuming the Markdown template is used)