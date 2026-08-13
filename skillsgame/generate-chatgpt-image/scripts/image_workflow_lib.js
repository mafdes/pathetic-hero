const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function findMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not find ${label} in snapshot`);
  }
  return `@${match[1]}`;
}

function findNewChatRef(snapshot) {
  return findMatch(snapshot, /(?:generic|link) "New chat" \[ref=(e\d+)\]/, 'New chat control');
}

function findComposerRef(snapshot) {
  return findMatch(snapshot, /textbox "Chat with ChatGPT" \[ref=(e\d+)\]/, 'composer');
}

function findAddFilesRef(snapshot) {
  return findMatch(snapshot, /button "Add files and more"[^\n]*ref=(e\d+)/, 'add files button');
}

function findLatestGeneratedImageRef(snapshot) {
  const matches = [...snapshot.matchAll(/button "Generated image:[^"]*" \[ref=(e\d+)\]/g)];
  if (!matches.length) {
    throw new Error('Could not find generated image button in snapshot');
  }
  return `@${matches[matches.length - 1][1]}`;
}

function findViewerControls(snapshot) {
  const closeMatch = snapshot.match(/button "Close fullscreen view" \[ref=(e\d+)\]/);
  return {
    closeRef: closeMatch ? `@${closeMatch[1]}` : null,
    saveRef: findMatch(snapshot, /button "Save" \[ref=(e\d+)\]/, 'viewer save button'),
  };
}

function detectGenerationBlocker(snapshot) {
  if (/guardrails around nudity|guardrails around sexuality|error on my side/i.test(snapshot)) {
    return 'guardrails';
  }
  return null;
}

function buildGuardrailRetryPrompt(prompt) {
  return `Create a safe-for-work fantasy character image, fully clothed, non-sexual, no nudity: ${prompt}`;
}

function buildStrictGuardrailRetryPrompt(prompt) {
  const sanitizedPrompt = prompt
    .replace(/shown from chest up/gi, 'shown as a head-and-shoulders portrait')
    .replace(/chest up/gi, 'head-and-shoulders portrait')
    .replace(/near the bust/gi, 'near the shoulder')
    .replace(/framing the bust/gi, 'framing the face')
    .replace(/\bbust\b/gi, 'shoulder line');

  return `Create a safe-for-work fantasy character illustration, fully clothed, non-sexual, no nudity, no cleavage, no erotic framing, fantasy game art: ${sanitizedPrompt}`;
}

function buildReferencedImagePrompt(prompt) {
  return `Create an image using the attached reference image to preserve the same character identity, face, silhouette, and materials: ${prompt}`;
}

function isPngHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PNG_SIGNATURE.length) {
    return false;
  }
  return buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

module.exports = {
  findComposerRef,
  findAddFilesRef,
  buildGuardrailRetryPrompt,
  buildReferencedImagePrompt,
  buildStrictGuardrailRetryPrompt,
  detectGenerationBlocker,
  findLatestGeneratedImageRef,
  findNewChatRef,
  findViewerControls,
  isPngHeader,
  PNG_SIGNATURE,
};
