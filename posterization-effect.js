/* MASHpedition · 11-03 Visual: posterization/high threshold (booked 2026-10-21).
   Independent, source-preserving RGBA image-data treatment. No assigned Setting,
   Token, effect intensity, asset substitution, UI controls, or storage writes. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MASHPosterizationEffect = api;
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  function checkImage(image) {
    if (!image || !Number.isSafeInteger(image.width) || image.width <= 0 ||
        !Number.isSafeInteger(image.height) || image.height <= 0 ||
        !(image.data instanceof Uint8ClampedArray || image.data instanceof Uint8Array) ||
        image.data.length !== image.width * image.height * 4)
      throw new TypeError('Expected positive width/height and 4-channel byte RGBA data');
  }
  function copyImage(image) {
    checkImage(image);
    return { width: image.width, height: image.height, data: new image.data.constructor(image.data) };
  }
  function apply(image, {enabled = false, levels} = {}) {
    const result = copyImage(image);
    if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
    if (!enabled) return result; // OFF is an exact, detached copy of original pixels.
    if (!Number.isInteger(levels) || levels < 2 || levels > 256)
      throw new RangeError('Caller must specify an integer levels value from 2 through 256');
    const max = levels - 1;
    for (let i = 0; i < result.data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        // Quantize RGB independently to an inclusive, evenly spaced palette.
        const step = Math.round(result.data[i + c] / 255 * max);
        result.data[i + c] = Math.round(step / max * 255);
      }
      // Alpha is untouched. Image structure and original bytes remain intact.
    }
    return result;
  }
  return Object.freeze({apply, copyImage});
});
