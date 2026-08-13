const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildReferencedImagePrompt,
  buildStrictGuardrailRetryPrompt,
  buildGuardrailRetryPrompt,
  detectGenerationBlocker,
  findAddFilesRef,
  findNewChatRef,
  findComposerRef,
  findLatestGeneratedImageRef,
  findViewerControls,
  isPngHeader,
} = require('./image_workflow_lib');

test('findNewChatRef finds the new chat generic ref', () => {
  const snapshot = `- generic "New chat" [ref=e5] clickable [onclick]\n- textbox "Chat with ChatGPT" [ref=e22]`;
  assert.equal(findNewChatRef(snapshot), '@e5');
});

test('findComposerRef finds the chat composer textbox ref', () => {
  const snapshot = `- heading "What are you working on?" [level=1, ref=e19]\n- textbox "Chat with ChatGPT" [ref=e22]`;
  assert.equal(findComposerRef(snapshot), '@e22');
});

test('findAddFilesRef finds the add files button ref', () => {
  const snapshot = `- button "Add files and more" [expanded=false, ref=e24]\n- textbox "Chat with ChatGPT" [ref=e22]`;
  assert.equal(findAddFilesRef(snapshot), '@e24');
});

test('findLatestGeneratedImageRef returns the last generated image ref', () => {
  const snapshot = [
    '- button "Generated image: Old image" [ref=e21]',
    '- button "Generated image: New image" [ref=e34]',
  ].join('\n');

  assert.equal(findLatestGeneratedImageRef(snapshot), '@e34');
});

test('findViewerControls finds save and close refs in fullscreen viewer', () => {
  const snapshot = [
    '- button "Close fullscreen view" [ref=e10]',
    '- button "Save" [ref=e14]',
  ].join('\n');

  assert.deepEqual(findViewerControls(snapshot), {
    closeRef: '@e10',
    saveRef: '@e14',
  });
});

test('findViewerControls tolerates missing close button', () => {
  const snapshot = '- button "Save" [ref=e14]';

  assert.deepEqual(findViewerControls(snapshot), {
    closeRef: null,
    saveRef: '@e14',
  });
});

test('isPngHeader validates PNG signature bytes', () => {
  assert.equal(isPngHeader(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(isPngHeader(Buffer.from('not-a-png')), false);
});

test('detectGenerationBlocker detects guardrail response', () => {
  const snapshot = [
    '- generic "We’re so sorry, but the prompt may violate our guardrails around nudity, sexuality, or erotic conten" [ref=e18]',
    '- generic "I wasn\'t able to generate the image due to an error on my side." [ref=e19]',
  ].join('\n');

  assert.equal(detectGenerationBlocker(snapshot), 'guardrails');
});

test('detectGenerationBlocker returns null on normal snapshots', () => {
  const snapshot = '- button "Generated image: Arcane knight" [ref=e21]';
  assert.equal(detectGenerationBlocker(snapshot), null);
});

test('buildGuardrailRetryPrompt wraps the original prompt safely', () => {
  const prompt = 'portrait fantasy character art, female orc support shown from chest up';
  assert.equal(
    buildGuardrailRetryPrompt(prompt),
    'Create a safe-for-work fantasy character image, fully clothed, non-sexual, no nudity: portrait fantasy character art, female orc support shown from chest up'
  );
});

test('buildStrictGuardrailRetryPrompt sanitizes chest-up framing', () => {
  const prompt = 'portrait fantasy character art, Vorga, female orc support shown from chest up, readable face and expression, war drum visible near the bust';
  assert.equal(
    buildStrictGuardrailRetryPrompt(prompt),
    'Create a safe-for-work fantasy character illustration, fully clothed, non-sexual, no nudity, no cleavage, no erotic framing, fantasy game art: portrait fantasy character art, Vorga, female orc support shown as a head-and-shoulders portrait, readable face and expression, war drum visible near the shoulder'
  );
});

test('buildReferencedImagePrompt instructs ChatGPT to use attached image as identity reference', () => {
  const prompt = 'splash art fantasy illustration, Vorga the Ashdrum Shaman of the Redfang Clans';
  assert.equal(
    buildReferencedImagePrompt(prompt),
    'Create an image using the attached reference image to preserve the same character identity, face, silhouette, and materials: splash art fantasy illustration, Vorga the Ashdrum Shaman of the Redfang Clans'
  );
});
