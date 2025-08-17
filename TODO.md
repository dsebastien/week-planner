BUSY:


ctrl + a should select all blocks
when releasing the mouse after click + drag over existing time blocks, it should select those that are completely in the selected area

Add support for moving selected time blocks with click and drag. The move operation should only be allowed if the target time slots are all unoccupied

- When right clicking on a time block, a menu should be shown with the following options: copy style, paste style (if one was copied previously), copy. When right clicking on an empty cell, the menu should show the following options: paste (if a time block was copied previously), Add time block here
- the border style and color of selected time blocks should be nicer
- there should be a set of predefined colors one can pick directly instead of systematically having to use the color picker
- The code of this app is on GitHub and I want to build it and deploy it from there. I own dsebastien.net and want to deploy this at weekplanner.tools.dsebastien.net. My GitHub account has already two custom domains (dsebastien.net and stats.notes.dsebastien.net), so I suppose I could add one more. Generate the GitHub actions workflow I need to (release/build/deploy...). The release creation should also generate a changelog. Finally, explain how I should setup everything step by step
- Remove the wasted blank space at the bottom of the page. The grid should probably go all the way down
- Replace "..." with a hamburger icon
- At the bottom of the main menu, add a block for Donations pointing to https://www.buymeacoffee.com/dsebastien (use nice icons, a bit of text, etc)
- How to generate money with this app?
- showError(message: string) should display a notification, not an alert
- Generate a readme and update memory to remind you about always keeping it up to date

Add export to Markdown option using the following template

```
# YYYY-mm-dd - Week Planning

## Monday
- HH:mm - HH:mm: Block text
- <Other time blocks>

## Tuesday
- HH:mm - HH:mm: Block text
- ...

...

```


Default filename for exported planning (for all export formats): YYYY-mm-dd - Week Planning