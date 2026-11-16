/**
 * Seconds that a stored runtime render paints with no request, when its directive has no `max-age:`.
 * Must match `DEFAULT_MAX_AGE` in `@expo/router-server/src/rsc/cache.ts`.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    CACHE_RECORD_KEY: null,
    DEFAULT_MAX_AGE: null,
    PRINCIPAL_KEY: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CACHE_RECORD_KEY () {
        return CACHE_RECORD_KEY;
    },
    get DEFAULT_MAX_AGE () {
        return DEFAULT_MAX_AGE;
    },
    get PRINCIPAL_KEY () {
        return PRINCIPAL_KEY;
    }
});
const DEFAULT_MAX_AGE = 300;
const CACHE_RECORD_KEY = '__expo_cache';
const PRINCIPAL_KEY = '__expo_principal';

//# sourceMappingURL=profiles.js.map
