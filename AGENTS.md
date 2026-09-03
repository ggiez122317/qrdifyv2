# Repository Agent Instructions

## Token efficiency

- Keep responses, progress updates, file reads, searches, and tool output concise and scoped to the current task.
- Use the installed `caveman` skill when it is available and materially helps reduce token usage or compress context.
- Avoid rereading unrelated files, repeating completed work, or providing long explanations unless the user requests them.

## UI/UX skill scope

- Use `ui-ux-pro-max` only when the request directly involves changing, designing, reviewing, or fixing a user interface or user experience.
- Do not use `ui-ux-pro-max` for backend logic, database work, API changes, installation tasks, documentation-only changes, or other non-UI/UX work.
- If a task includes both UI/UX and non-UI work, apply the skill only to the UI/UX portion.
