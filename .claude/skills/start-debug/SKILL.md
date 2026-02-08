---
name: start-debug
description: Start the development server and launch Chrome debug instance with DevTools MCP. Use when starting a debugging session.
---

# Start Debug Session

This Skill automates the development workflow by starting the dev server, launching Chrome with debugging enabled, and verifying the Chrome DevTools MCP connection is active.

## Instructions

When this Skill is invoked, follow these steps in order:

1. **Start the development server**: Run `npm run dev` in the background using the Bash tool with `run_in_background: true`. This starts the Next.js development server.

2. **Wait for server to be ready**: Wait approximately 3-5 seconds for the dev server to initialize before proceeding.

3. **Launch Chrome debug instance**: Use the `mcp__chrome-devtools__new_page` tool to open a new Chrome page pointed at `http://localhost:3000` (or the appropriate local dev URL).

4. **Verify MCP connection**: Use the `mcp__chrome-devtools__list_pages` tool to confirm the Chrome DevTools MCP server is connected and responding properly.

5. **Report status**: Inform the user that:
   - The dev server is running in the background
   - Chrome debug instance is launched
   - DevTools MCP connection is active
   - They can now use Chrome DevTools MCP tools for debugging

## Notes

- The dev server runs in the background, so it will continue running after this Skill completes
- The user can interact with the Chrome instance using other `mcp__chrome-devtools__*` tools
- If any step fails, report the error clearly and suggest remediation steps
