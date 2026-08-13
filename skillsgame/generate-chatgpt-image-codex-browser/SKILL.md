---
name: generate-chatgpt-image-codex-browser
description: Generate an image through chatgpt.com using the Codex in-app browser, optionally attach a reference image, download the generated PNG, and save it locally. Use this whenever Codex must create ChatGPT images from the integrated browser instead of the legacy agent-browser CLI, including Star Fusion character portraits and UI/card art.
---

# Generate ChatGPT Image With Codex Browser

Use this skill to drive `chatgpt.com` through the Codex in-app browser, generate an image from a prompt, save the PNG locally, and report the final filename.

## Required Browser Setup

Before the first browser action in a turn, load the Browser Use skill:

`/Users/ruben/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha1/skills/browser/SKILL.md`

Then control the in-app browser only through the Node REPL `mcp__node_repl__js` tool and the Browser `iab` backend.

Use this guarded first cell pattern:

```js
if (!globalThis.agent) {
  const { setupAtlasRuntime } = await import("/Users/ruben/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha1/scripts/browser-client.mjs");
  const backend = "iab";
  await setupAtlasRuntime({ globals: globalThis, backend });
}
await agent.browser.nameSession("🎨 ChatGPT image");
if (typeof tab === "undefined") {
  globalThis.tab = await agent.browser.tabs.new();
}
```

Reuse the existing `tab` binding after setup.

## Expected Input

The caller must provide:

- `prompt`: the image prompt to send to ChatGPT
- `output`: desired local PNG path, or enough context to derive one
- `reference_image`: optional local image path to attach before submitting the prompt

For Star Fusion portraits, canonical outputs are usually:

- `documentacion/imgs/<character-slug>--portrait-card.png`
- `documentacion/imgs/<character-slug>--portrait-ui.png`

## Workflow

1. Open `https://chatgpt.com/` in the in-app browser.
2. Inspect the visible page with a DOM snapshot or screenshot.
3. If ChatGPT is not logged in, stop and ask the user to log in in the same in-app browser.
4. Start a new chat when available.
5. If `reference_image` is provided, attach it before sending the prompt.
6. Fill the composer with `Create an image: <prompt>`.
7. Submit the message.
8. Poll with short waits until the generated image appears.
9. Open the image viewer.
10. Download or save the generated image to the requested local `output`.
11. Verify the local file exists and has a PNG signature.
12. If verification fails, retry the save/download step before reporting failure.

## Browser Interaction Guidance

Prefer Playwright locators from `tab.playwright`:

```js
await tab.goto("https://chatgpt.com/");
await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 20000 });
console.log(await tab.playwright.domSnapshot());
```

Useful selectors usually include:

- buttons named like `New chat`, `Nuevo chat`, or equivalent localized labels
- the message composer textbox or `contenteditable` editor
- attachment buttons with paperclip/add-file semantics
- generated image buttons or image viewer controls
- save/download buttons inside the opened image viewer

After every click, upload, submit, or download attempt, collect a fresh DOM snapshot or screenshot before choosing the next action.

## Wait Strategy

Use short polling waits, not long sleeps:

- wait about `8000` ms after submitting the image prompt
- then retry snapshots every `5000` ms
- avoid fixed waits longer than `15000` ms unless a visible transition is still in progress

If the page is busy or a locator becomes stale, wait briefly, refresh the snapshot, and continue from the current tab.

## Reference Image Rule

When `reference_image` is provided:

- verify the file exists before interacting with the browser
- attach it through the ChatGPT composer
- wait until the attachment is visibly present before submitting
- keep the text prompt focused on the requested output rather than re-describing every facial detail

For Star Fusion UI portraits, attach the already-generated card portrait so the square portrait preserves face, silhouette, materials, and faction readability.

## Download And Verification

Always save the final image to the requested local `output` path.

Verify success with shell commands after the browser save/download:

```bash
ls -l "<output>"
file "<output>"
xxd -p -l 8 "<output>"
```

The first 8 bytes must be:

`89504e470d0a1a0a`

If the file is missing, empty, HTML, JSON, or not a PNG, delete the bad local artifact if one was created and retry the save flow.

## Blockers

Stop and report the concrete blocker when:

- ChatGPT shows the login page and the user is not logged in
- a Cloudflare or browser safety challenge appears
- the image generation UI refuses the prompt
- the browser exposes no usable save/download path after retries

Do not try to bypass login, CAPTCHA, Cloudflare, safety interstitials, or other browser protection.

## Response

On success, report the exact saved path briefly:

`Image saved as documentacion/imgs/<character-slug>--portrait-card.png`

On failure, state the blocker and the last verified browser state.
