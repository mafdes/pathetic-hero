#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  buildGuardrailRetryPrompt,
  buildReferencedImagePrompt,
  buildStrictGuardrailRetryPrompt,
  detectGenerationBlocker,
  findAddFilesRef,
  findComposerRef,
  findLatestGeneratedImageRef,
  findNewChatRef,
  findViewerControls,
  isPngHeader,
} = require('./image_workflow_lib');

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = {
    cdpPort: '9222',
    browserSession: '',
    output: '',
    prompt: '',
    referenceImage: '',
    workdir: process.cwd(),
    maxGenerationChecks: 60,
    generationWaitMs: 5000,
    openViewerWaitMs: 1200,
    downloadAttempts: 3,
    downloadWaitMs: 1500,
    agentBrowserTimeoutMs: 180000,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      fail(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (value == null || value.startsWith('--')) {
      fail(`Missing value for --${key}`);
    }

    index += 1;
    switch (key) {
      case 'cdp-port':
        options.cdpPort = value;
        break;
      case 'browser-session':
        options.browserSession = value;
        break;
      case 'output':
        options.output = value;
        break;
      case 'prompt':
        options.prompt = value;
        break;
      case 'workdir':
        options.workdir = value;
        break;
      case 'reference-image':
        options.referenceImage = value;
        break;
      case 'max-generation-checks':
        options.maxGenerationChecks = Number.parseInt(value, 10);
        break;
      case 'generation-wait-ms':
        options.generationWaitMs = Number.parseInt(value, 10);
        break;
      case 'open-viewer-wait-ms':
        options.openViewerWaitMs = Number.parseInt(value, 10);
        break;
      case 'download-attempts':
        options.downloadAttempts = Number.parseInt(value, 10);
        break;
      case 'download-wait-ms':
        options.downloadWaitMs = Number.parseInt(value, 10);
        break;
      case 'agent-browser-timeout-ms':
        options.agentBrowserTimeoutMs = Number.parseInt(value, 10);
        break;
      default:
        fail(`Unknown option: --${key}`);
    }
  }

  if (!options.prompt) {
    fail('Missing required --prompt');
  }
  if (!options.output) {
    fail('Missing required --output');
  }

  return options;
}

function runAgentBrowser(options, ...args) {
  const browserArgs = options.browserSession
    ? ['--session', options.browserSession]
    : ['--cdp', options.cdpPort];
  const result = spawnSync('agent-browser', [...browserArgs, ...args], {
    cwd: options.workdir,
    encoding: 'utf8',
    timeout: options.agentBrowserTimeoutMs,
  });

  if (result.error) {
    fail(`agent-browser failed: ${result.error.message}: ${args.join(' ')}`);
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    fail(stderr || stdout || `agent-browser failed: ${args.join(' ')}`);
  }

  return result.stdout;
}

function waitMs(options, value) {
  runAgentBrowser(options, 'wait', String(value));
}

function snapshot(options) {
  return runAgentBrowser(options, 'snapshot', '-i', '-c');
}

function openCleanChat(options) {
  const currentSnapshot = snapshot(options);
  if (!/textbox "Chat with ChatGPT"/.test(currentSnapshot)) {
    runAgentBrowser(options, 'open', 'https://chatgpt.com/');
    waitMs(options, 2500);
  }
  clearComposer(options);
}

function click(options, ref) {
  runAgentBrowser(options, 'click', ref);
}

function fill(options, ref, value) {
  runAgentBrowser(options, 'fill', ref, value);
}

function pressEnter(options) {
  runAgentBrowser(options, 'press', 'Enter');
}

function clickSendPrompt(options) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const result = evalInBrowser(options, "(() => { const button = document.querySelector('button[aria-label=\\\"Send prompt\\\"]'); if (!button) return 'missing'; if (button.disabled || button.getAttribute('aria-disabled') === 'true') return 'disabled'; button.click(); return 'clicked'; })()");
    const state = result.startsWith('"') ? JSON.parse(result) : result;
    if (state === 'clicked') {
      return;
    }
    waitMs(options, 500);
  }
  fail('Send prompt button was not clickable');
}

function upload(options, ref, filePath) {
  runAgentBrowser(options, 'upload', ref, filePath);
}

function uploadReferenceImage(options, filePath) {
  const uploadTargets = ['#upload-photos', '#upload-files'];
  const errors = [];

  for (const target of uploadTargets) {
    try {
      upload(options, target, filePath);
      dismissDuplicateUploadDialog(options);
      return target;
    } catch (error) {
      errors.push(`${target}: ${error.message}`);
      dismissDuplicateUploadDialog(options);
    }
  }

  fail(`Could not upload reference image. ${errors.join(' | ')}`);
}

function dismissDuplicateUploadDialog(options) {
  try {
    const result = evalInBrowser(options, `(() => { const headings = Array.from(document.querySelectorAll('h1,h2,h3')).filter((entry) => entry.textContent.includes("You've already uploaded this file.")); if (headings.length === 0) return 'none'; const buttons = Array.from(document.querySelectorAll('button')); const ok = buttons.find((button) => button.textContent.trim() === 'OK'); if (ok) ok.click(); return 'dismissed'; })()`);
    return result.startsWith('"') ? JSON.parse(result) : result;
  } catch (error) {
    return 'unavailable';
  }
}

function submitPrompt(options, prompt) {
  const freshSnapshot = snapshot(options);
  assertComposerClean(options);
  if (options.referenceImage) {
    const addFilesRef = findAddFilesRef(freshSnapshot);
    click(options, addFilesRef);
    waitMs(options, 400);
    uploadReferenceImage(options, options.referenceImage);
    waitMs(options, 1200);
  }

  const composerSnapshot = snapshot(options);
  const composerRef = findComposerRef(composerSnapshot);
  fill(options, composerRef, prompt);
  pressEnter(options);
  waitMs(options, 500);
  try {
    const afterEnterSnapshot = snapshot(options);
    if (/button "Send prompt"/.test(afterEnterSnapshot)) {
      clickSendPrompt(options);
    }
  } catch (error) {
    // ChatGPT can become briefly unresponsive immediately after submit while image generation starts.
  }
  waitMs(options, 1000);
  try {
    const afterClickSnapshot = snapshot(options);
    if (/button "Send prompt"/.test(afterClickSnapshot) && !/button "Stop streaming"/.test(afterClickSnapshot)) {
      clickSendPrompt(options);
    }
  } catch (error) {
    // The later waitForGeneratedImage loop handles generation status and blockers.
  }
}

function waitForGeneratedImage(options, baselineImageCount) {
  let generationSnapshot = '';
  for (let attempt = 1; attempt <= options.maxGenerationChecks; attempt += 1) {
    waitMs(options, options.generationWaitMs);
    generationSnapshot = snapshot(options);
    const blocker = detectGenerationBlocker(generationSnapshot);
    if (blocker) {
      return { blocker, snapshot: generationSnapshot };
    }

    try {
      const currentImageCount = getGeneratedImageCount(options);
      if (currentImageCount <= baselineImageCount) {
        if (attempt === options.maxGenerationChecks) {
          fail(`Timed out waiting for new generated image: count remained ${currentImageCount}`);
        }
        continue;
      }
      options.generatedImageIndex = currentImageCount - 1;
      const imageRef = findLatestGeneratedImageRef(generationSnapshot);
      return { imageRef, snapshot: generationSnapshot };
    } catch (error) {
      if (attempt === options.maxGenerationChecks) {
        fail(`Timed out waiting for generated image: ${error.message}`);
      }
    }
  }

  fail('Unexpected generation state');
}

function download(options, ref, outputPath) {
  const browserArgs = options.browserSession
    ? ['--session', options.browserSession]
    : ['--cdp', options.cdpPort];
  return spawnSync('agent-browser', [...browserArgs, 'download', ref, outputPath], {
    cwd: options.workdir,
    encoding: 'utf8',
    timeout: options.agentBrowserTimeoutMs,
  });
}

function evalInBrowser(options, script) {
  const browserArgs = options.browserSession
    ? ['--session', options.browserSession]
    : ['--cdp', options.cdpPort];
  const result = spawnSync('agent-browser', [...browserArgs, 'eval', script], {
    cwd: options.workdir,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: options.agentBrowserTimeoutMs,
  });
  if (result.error) {
    fail(`browser eval failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(result.stderr?.trim() || result.stdout?.trim() || 'browser eval failed');
  }
  return result.stdout.trim();
}

function getGeneratedImageCount(options) {
  const raw = evalInBrowser(options, "document.querySelectorAll('img[alt^=\\\"Generated image:\\\"]').length");
  const value = raw.startsWith('"') ? JSON.parse(raw) : raw;
  return Number(value);
}

function clearComposer(options) {
  evalInBrowser(options, `(() => { for (const button of Array.from(document.querySelectorAll('button')).filter((entry) => (entry.getAttribute('aria-label') || '').startsWith('Remove file'))) button.click(); const box = document.querySelector('[contenteditable="true"]'); if (box) { box.focus(); document.execCommand('selectAll'); document.execCommand('delete'); box.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' })); } return 'cleared'; })()`);
  waitMs(options, 500);
}

function assertComposerClean(options) {
  const raw = evalInBrowser(options, `(() => JSON.stringify({ text: (document.querySelector('[contenteditable="true"]')?.innerText || '').trim(), files: Array.from(document.querySelectorAll('button')).filter((button) => (button.getAttribute('aria-label') || '').startsWith('Remove file')).length }))()`);
  const payload = raw.startsWith('"') ? JSON.parse(raw) : raw;
  const state = JSON.parse(payload);
  if (state.text || state.files) {
    fail(`Composer is not clean before prompt: text=${state.text.length}, files=${state.files}`);
  }
}

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath);
}

function ensureValidPng(filePath) {
  const file = readIfExists(filePath);
  if (!file || !isPngHeader(file)) {
    return false;
  }
  return true;
}

function tryDownload(options, saveRef, outputPath) {
  for (let attempt = 1; attempt <= options.downloadAttempts; attempt += 1) {
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath);
    }

    const result = download(options, saveRef, outputPath);
    if (ensureValidPng(outputPath)) {
      return { attempt, via: 'download', stdout: result.stdout?.trim() || '' };
    }

    waitMs(options, options.downloadWaitMs);
    if (ensureValidPng(outputPath)) {
      return { attempt, via: 'delayed-validation', stdout: result.stdout?.trim() || '' };
    }
  }

  const imageIndex = Number.isInteger(options.generatedImageIndex) ? options.generatedImageIndex : -1;
  const base64 = evalInBrowser(options, `(async () => { const imgs = Array.from(document.querySelectorAll('img[alt^="Generated image:"]')); const img = ${imageIndex} >= 0 ? imgs[${imageIndex}] : imgs[imgs.length - 1]; if (!img) throw new Error('Generated image element not found'); const res = await fetch(img.src); const blob = await res.blob(); const buf = await blob.arrayBuffer(); const bytes = Array.from(new Uint8Array(buf)); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.slice(i, i + 0x8000)); return btoa(s); })()`);
  const payload = base64.startsWith('"') ? JSON.parse(base64) : base64;
  fs.writeFileSync(outputPath, Buffer.from(payload, 'base64'));
  if (ensureValidPng(outputPath)) {
    return { attempt: 'browser-fetch', via: 'browser-fetch', stdout: '' };
  }

  fail(`Download did not produce a valid PNG at ${outputPath}`);
}

function main() {
  const options = parseArgs(process.argv);
  const outputPath = path.resolve(options.workdir, options.output);
  const referenceImagePath = options.referenceImage ? path.resolve(options.workdir, options.referenceImage) : '';
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (referenceImagePath && !fs.existsSync(referenceImagePath)) {
    fail(`Reference image not found: ${referenceImagePath}`);
  }
  options.referenceImage = referenceImagePath;

  openCleanChat(options);

  const promptBuilder = options.referenceImage
    ? buildReferencedImagePrompt
    : (prompt) => `Create an image: ${prompt}`;
  const promptAttempts = [
    promptBuilder(options.prompt),
    buildGuardrailRetryPrompt(options.prompt),
    buildStrictGuardrailRetryPrompt(options.prompt),
  ];

  let generationResult = null;
  for (let index = 0; index < promptAttempts.length; index += 1) {
    if (index > 0) {
      openCleanChat(options);
    }

    const baselineImageCount = getGeneratedImageCount(options);
    submitPrompt(options, promptAttempts[index]);
    generationResult = waitForGeneratedImage(options, baselineImageCount);
    if (generationResult.imageRef) {
      break;
    }

    if (generationResult.blocker !== 'guardrails') {
      break;
    }
  }

  if (generationResult?.blocker === 'guardrails' && !generationResult.imageRef) {
    openCleanChat(options);
  }

  if (!generationResult.imageRef) {
    fail(`Image generation blocked: ${generationResult.blocker || 'unknown blocker'}`);
  }

  const imageRef = generationResult.imageRef;
  click(options, imageRef);
  waitMs(options, options.openViewerWaitMs);

  let downloadResult = null;
  try {
    const viewerSnapshot = snapshot(options);
    const { closeRef, saveRef } = findViewerControls(viewerSnapshot);
    downloadResult = tryDownload(options, saveRef, outputPath);
    if (closeRef) {
      click(options, closeRef);
    }
  } catch (error) {
    downloadResult = tryDownload(options, null, outputPath);
  }

  if (!ensureValidPng(outputPath)) {
    fail(`Expected a valid PNG at ${outputPath} after download`);
  }

  process.stdout.write(JSON.stringify({
    output: outputPath,
    method: downloadResult.via,
    attempts: downloadResult.attempt,
  }, null, 2));
}

main();
