/* MASHpedition · 11-03 Audio: hard distortion / peak clipping (booked 2026-10-21).
   Independent PCM transformation. Does not play audio, invent a strength setting,
   couple to posterization, alter source recordings, or award anything. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MASHHardDistortionEffect = api;
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  function copy(samples) {
    if (!(samples instanceof Float32Array))
      throw new TypeError('Expected a Float32Array of normalized PCM samples');
    for (let i = 0; i < samples.length; i++)
      if (!Number.isFinite(samples[i]) || Math.abs(samples[i]) > 1)
        throw new RangeError('Samples must be finite and within the normalized -1..1 range');
    return new Float32Array(samples);
  }
  function apply(samples, {enabled = false, threshold} = {}) {
    const out = copy(samples);
    if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
    if (!enabled) return out; // Exact OFF restoration by processing original samples again.
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1)
      throw new RangeError('Caller must specify a clipping threshold in (0, 1]');
    for (let i = 0; i < out.length; i++) {
      if (out[i] > threshold) out[i] = threshold;
      else if (out[i] < -threshold) out[i] = -threshold;
    }
    return out;
  }
  return Object.freeze({apply, copy});
});
