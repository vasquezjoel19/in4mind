/**
 * IN4MIND — Asset cache bust version (HTML ?v= query).
 * Keep localStorage keys as in4mind_* for backward compatibility.
 */
'use strict';

const IN4MIND_ASSET_V = '20260821ux1';

if (typeof module !== 'undefined') module.exports = { IN4MIND_ASSET_V };
