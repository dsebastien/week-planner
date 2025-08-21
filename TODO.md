Busy:

When exporting to Markdown, include time blocks that span multiple days. Add those to each relevant day (eg a block that spans monday and tuesday should appear both under monday AND tuesday). Add "(Day x/y)" after the text of each of those entries. Take those into account during Markdown imports to reconstruct the grid correctly, grouping entries that should be grouped



claude mcp add playwright -s user -- npx -y @playwright/mcp
claude mcp add puppeteer -s user -- npx -y @modelcontextprotocol/server-puppeteer
claude mcp add fetch -s user -- npx -y @kazuph/mcp-fetch

- UI quality should remain perfect even when zooming in/out
- When exporting to PNG/SVG, the image should have the perfect size for being printed on an horizontal A4 page
- Cleanup Typescript imports. Import the normal typescript way, not from .js files!
- Move as much logic from the index.html to TypeScript
- The code of this app is on GitHub and I want to build it and deploy it from there. I own dsebastien.net and want to deploy this at weekplanner.tools.dsebastien.net. My GitHub account has already two custom domains (dsebastien.net and stats.notes.dsebastien.net), so I suppose I could add one more. Generate the GitHub actions workflow I need to (release/build/deploy...). The release creation should also generate a changelog. Finally, explain how I should setup everything step by step
- Turn this into an Obsidian plugin
- Create CONTRIBUTING.md file
- Add beautiful gradients to time blocks based on their background color
- Don't show resize handles when multiple blocks are selected
- Import markdown (when successful) should be supported by undo and redo. Same for import json
- Editing text on a block that spans 1 and last columns breaks the UI


Implement carousel mode
- Moving time blocks (1) to the left from the first column to the last or (2) to the right from the last to the first should also when if the user drags the mouse out of the browser window and releases the button afterwards
- If an export containing time blocks that span at least saturday and sunday (created with sunday-first is disabled) is imported with sunday-first enabled, the time blocks don't end up where they should
- Blocks that are split (ie span at least first AND last columns) BUT do not span the whole week should display the block information (start time, end time, duration + text) on the different parts
- When blocks are moved around the carousel, they should never be partially out of the grid, but they should be allowed to be partially on the left and right of the day. For example, if a block that spans two days (first and second column) is moved left one column, then it should be on both the first and the last column. Same when going from left to right. This should enable more seamless behavior and should fix bugs with imports of files created with a different sunday-first setting