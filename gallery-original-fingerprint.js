/* MASHpedition · 18-07 / 18-09 / 05-09 · original image pixel integrity.
   Cryptographic comparison ONLY, independent of any cloud, account, gallery UI,
   Mutosis pipeline, uploaded images, rewards, or encryption/storage format.
   IMPORTANT: An attacker can hash changed pixels too. A caller MUST obtain
   the expected fingerprint from an independently AUTHENTICATED, authoritative
   server record. A hash supplied alongside an imported image proves nothing.
   Canonical bytes: ASCII "MASHPEDITION/RGBA/V1\\0", 32-bit little-endian
   width and height, then width*height*4 RGBA bytes in row-major order.
   Does not fingerprint image file metadata, encoded PNG/JPEG bytes, color
   profiles or linked Creations. Input must already be decoded unaltered
   into an RGBA pixel buffer by the future authenticated gallery pipeline. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHOriginalFingerprint=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(root){
  'use strict';
  const FORMAT='mashpedition.rgba-sha256.v1';
  const PREFIX='MASHPEDITION/RGBA/V1\0';
  const MAX_RGBA_BYTES=256*1024*1024; // Defensive memory bound, not a game image-size rule.
  const validDimension=n=>Number.isSafeInteger(n)&&n>=1&&n<=0xffffffff;
  function canonicalBytes(image){
    if(!image||!validDimension(image.width)||!validDimension(image.height)||
      !(image.data instanceof Uint8ClampedArray))
      throw new TypeError('Expected width, height and Uint8ClampedArray RGBA data');
    const expected=image.width*image.height*4;
    if(!Number.isSafeInteger(expected)||expected>MAX_RGBA_BYTES||
      image.data.byteLength!==expected)
      throw new RangeError('RGBA length, dimensions or memory bound invalid');
    const bytes=new Uint8Array(PREFIX.length+8+expected);
    for(let i=0;i<PREFIX.length;i++)bytes[i]=PREFIX.charCodeAt(i);
    const view=new DataView(bytes.buffer);
    view.setUint32(PREFIX.length,image.width,true);
    view.setUint32(PREFIX.length+4,image.height,true);
    bytes.set(image.data,PREFIX.length+8); // Take a snapshot BEFORE any await.
    return bytes;
  }
  function digestProvider(subtle){
    const cryptoProvider=subtle??root?.crypto?.subtle;
    if(!cryptoProvider||typeof cryptoProvider.digest!=='function')
      throw new Error('SHA-256 Web Crypto unavailable; use a secure context');
    return cryptoProvider;
  }
  async function fingerprint(image,{subtle}={}){
    const bytes=canonicalBytes(image);
    // Dimensions describe the same synchronous snapshot as the hashed bytes.
    // Never read mutable image properties again after the asynchronous digest.
    const width=image.width, height=image.height;
    const provider=digestProvider(subtle);
    const digest=await provider.digest('SHA-256',bytes);
    const hex=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
    if(!/^[0-9a-f]{64}$/.test(hex))throw new Error('Invalid SHA-256 digest response');
    return Object.freeze({format:FORMAT,width,height,sha256:hex});
  }
  function validateExpected(record){
    if(!record||record.format!==FORMAT||!validDimension(record.width)||
      !validDimension(record.height)||typeof record.sha256!=='string'||
      !/^[0-9a-f]{64}$/.test(record.sha256))
      throw new TypeError('Expected a valid original RGBA fingerprint record');
  }
  async function matchesExpected(image,expected,{subtle}={}){
    // This compares bytes to a digest. It cannot authenticate the expected
    // record, establish image ownership, or authorize importing an image.
    validateExpected(expected);
    const result=await fingerprint(image,{subtle});
    if(result.width!==expected.width||result.height!==expected.height)return false;
    // Fixed-length comparison; this is not a constant-time authentication API.
    let different=0;
    for(let i=0;i<result.sha256.length;i++)
      different|=result.sha256.charCodeAt(i)^expected.sha256.charCodeAt(i);
    return different===0;
  }
  return Object.freeze({FORMAT,fingerprint,matchesExpected});
});
