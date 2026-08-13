---
name: generate-chatgpt-image
description: Generate an image through ChatGPT in the browser, download it, and save it into the current working directory. Use this whenever the user asks to create an image with ChatGPT, generate art on chatgpt.com, download a generated ChatGPT image, save a ChatGPT image locally, or uses commands like `/generate-chatgpt-image <prompt>`. Treat the full trailing text after `/generate-chatgpt-image` as the image prompt unless the user asks to revise it.
---

# Generate ChatGPT Image

Use this skill to drive `chatgpt.com` through `agent-browser`, generate an image from a user prompt, download it, save it into the current working directory, and report the final filename.

## What this skill does

- Reuses a real Chrome session instead of trying to fight Cloudflare headlessly
- Sends the user's prompt to ChatGPT as an image-generation request
- Waits for the generated image to appear
- Opens the image viewer and saves the file into the current working directory
- Reports the exact output filename back to the user

## Required setup

Before using this workflow, load the up-to-date `agent-browser` instructions from the installed CLI:

```bash
agent-browser skills get core
```

This skill assumes all browser interaction is done with `agent-browser`.

## Expected input

If the user invokes this as:

```text
/generate-chatgpt-image a cinematic fantasy observatory floating above a glowing forest at dusk
```

Use everything after `/generate-chatgpt-image` as the prompt.

If the user asks conversationally, use their requested image prompt directly.

## Preferred connection strategy

### First choice: connect to a user-opened Chrome via CDP

This is the most reliable path because ChatGPT often places Cloudflare or auth barriers in front of fresh automation sessions.

Ask the user to launch Chrome with remote debugging if it is not already available:

```bash
google-chrome --remote-debugging-port=9222
```

If they do not want to reuse their main browser session, a separate profile is acceptable:

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-chatgpt-image
```

Then connect with:

```bash
agent-browser --cdp 9222 snapshot -i -c
```

### Second choice: `--auto-connect`

If the user already has a Chrome instance exposed for debugging, `--auto-connect` is acceptable.

### Avoid as default: brand-new headless browser sessions

Fresh sessions are more likely to hit Cloudflare or lack the required ChatGPT login state.

## Core workflow

Follow this sequence exactly.

1. Confirm you can control the browser session.
2. Open `https://chatgpt.com/` in that session.
3. Snapshot the page.
4. If ChatGPT is not logged in, stop and ask the user to log in in that same browser instance.
5. Start a new chat.
6. Send an explicit image-generation prompt.
7. Wait and re-snapshot until the generated image appears.
8. Open the image viewer.
9. Download or save the image into the current working directory.
10. Verify the file exists on disk.
11. Report the final filename to the user.

## Prompting rules

Use the user's prompt as-is unless it is clearly incomplete.

When you need to turn a generic request into a ChatGPT image request, keep it short and direct, for example:

```text
Create an image: <user prompt>
```

Do not add extra style modifiers unless the user asked for them.

If you are generating a follow-up variant from an already-approved portrait, prefer attaching that portrait as a reference instead of over-describing facial continuity in text alone.

## Filename policy

Always save into the current working directory.

Use the bundled script to generate a safe, unique filename from the prompt:

```bash
.opencode/skills/generate-chatgpt-image/scripts/make_output_name.sh "<full prompt>"
```

The script prints a filename like:

```text
chatgpt-generated-fantasy-observatory.png
```

If that filename already exists, it appends `-2`, `-3`, and so on.

## Preferred local runner

Use the bundled workflow runner instead of hand-rolling the browser loop when possible:

```bash
node .opencode/skills/generate-chatgpt-image/scripts/run_chatgpt_image_workflow.js \
  --cdp-port 9222 \
  --workdir "$PWD" \
  --output "$(.opencode/skills/generate-chatgpt-image/scripts/make_output_name.sh "<full prompt>")" \
  --prompt "<full prompt>"
```

When you already have a canonical portrait or reference image and want later variants to stay on-model:

```bash
node .opencode/skills/generate-chatgpt-image/scripts/run_chatgpt_image_workflow.js \
  --cdp-port 9222 \
  --workdir "$PWD" \
  --reference-image "documentacion/imgs/<character-slug>--portrait-art.png" \
  --output "documentacion/imgs/<character-slug>--card-art.png" \
  --prompt "<variant prompt>"
```

This runner already handles:

- opening a new chat from the current ChatGPT page
- finding the composer from fresh snapshots
- polling until the newest `Generated image:` button appears
- opening fullscreen viewer and targeting the `Save` control there
- uploading a reference image when `--reference-image` is provided
- validating the downloaded file by PNG header instead of trusting the browser command alone

Prefer the runner for automation scripts, batch jobs, or any workflow where a false negative would cause expensive retries.

## Browser interaction pattern

Use the standard `agent-browser` loop:

```bash
agent-browser --cdp 9222 open https://chatgpt.com/
agent-browser --cdp 9222 snapshot -i -c
```

After any action that changes the page, re-snapshot before using fresh refs.

## Wait strategy

Prefer short polling waits over long fixed sleeps.

- Default to `agent-browser wait 8000` after submitting an image prompt.
- If the image is not ready yet, re-snapshot and continue with `agent-browser wait 5000` retries.
- Avoid single waits longer than `15000` unless a download or fullscreen transition is visibly still in progress.
- If the browser daemon returns a transient busy error, do not restart the whole flow first; wait briefly, then re-snapshot the same session.

Typical flow:

```bash
agent-browser --cdp 9222 open https://chatgpt.com/
agent-browser --cdp 9222 snapshot -i -c
# locate New chat and the composer
agent-browser --cdp 9222 click @eN
agent-browser --cdp 9222 fill @eM "Create an image: <prompt>"
agent-browser --cdp 9222 press Enter
agent-browser --cdp 9222 wait 8000
agent-browser --cdp 9222 snapshot -i -c
# if the image is still rendering, continue with short retries
agent-browser --cdp 9222 wait 5000
agent-browser --cdp 9222 snapshot -i -c
# locate generated image, open viewer, then save it
```

## How to detect blockers

### Cloudflare challenge

If the snapshot shows a Cloudflare verification iframe or similar anti-bot challenge, stop trying to brute-force it.

Instead:

1. Ask the user to open Chrome manually with remote debugging.
2. Ask them to solve the challenge in that same browser instance.
3. Reconnect through `--cdp 9222`.

### Not logged in

If the snapshot shows `Log in`, stop and ask the user to log in inside the same CDP-connected browser window.

## Download step

Once the generated image is visible, prefer the fullscreen image viewer because it usually exposes a direct `Save` or download control.

Use `agent-browser download` when possible:

```bash
filename="$(.opencode/skills/generate-chatgpt-image/scripts/make_output_name.sh "<full prompt>")"
agent-browser --cdp 9222 download @eN "$filename"
```

When you need reliability rather than ad hoc control, prefer the runner above because `download` can report an ambiguous failure even when the file lands on disk correctly.

If the UI requires first opening the image and then clicking `Save`, do that. The important outcome is that the final file lands in the current working directory.

If a direct `download @eN` attempt times out even though the generated image is already visible in the conversation, use this recovery path before declaring failure:

1. Refresh the ChatGPT tab.
2. Take a fresh `agent-browser --cdp 9222 snapshot -i -c`.
3. Click the generated image again to reopen the fullscreen viewer.
4. Re-snapshot inside the fullscreen viewer.
5. Look for a dedicated `Save` button there and run `agent-browser --cdp 9222 download @eN "$filename"` against that control.

This matters because the inline image can be visible while the actual downloadable control only appears reliably after a refresh and reopening the fullscreen viewer.

## Verification step

Always verify the file after downloading:

```bash
ls -l "<filename>"
file "<filename>"
```

The workflow is only successful if both are true:

- the file exists on disk
- the first 8 bytes match the PNG signature `89504e470d0a1a0a`

If the file is missing or the header is not PNG binary, delete it and retry the save flow. Do not keep JSON, HTML, or text placeholders with a `.png` extension.

## Response format

When successful, respond with the exact filename only if the user wants brevity, or with a short confirmation such as:

```text
Image saved as `chatgpt-generated-fantasy-observatory.png`
```

If blocked, state the concrete blocker:

- Cloudflare challenge still present
- ChatGPT session not logged in
- No CDP-enabled Chrome available
- Save/download control not found yet

## Recovery notes

- If the image is visible but download keeps timing out, refresh the tab and retry from a fresh snapshot instead of assuming the generation failed.
- Prefer the fullscreen viewer's `Save` button over the inline conversation image when both are available.
- If generation is still pending after the first snapshot, keep the session alive with repeated short waits and snapshots instead of jumping straight to 30-45 second sleeps.
- If a batch script reports failure but the file appeared on disk, inspect the file header before retrying; the real failure may be in control-flow bookkeeping rather than image generation itself.
- If a prompt keeps hitting false guardrails, avoid wording like `chest up` or `bust` and prefer `head-and-shoulders portrait` plus `near the shoulder`.

## Notes

- Prefer `--cdp 9222` over ad hoc fresh sessions
- Re-snapshot after each meaningful page change
- Do not report success until the file exists in the current working directory
