"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DEFAULT_MAX_AGE: null,
    cachePrincipal: null,
    cacheTag: null,
    updateTag: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get DEFAULT_MAX_AGE () {
        return _profiles.DEFAULT_MAX_AGE;
    },
    get cachePrincipal () {
        return cachePrincipal;
    },
    get cacheTag () {
        return cacheTag;
    },
    get updateTag () {
        return updateTag;
    }
});
const _profiles = require("./profiles");
function getRecord(name) {
    const context = globalThis.__EXPO_RSC_STORE__?.getStore()?.context;
    if (!context) {
        throw new Error(`${name}() can only be called while a server function renders.`);
    }
    const record = context[_profiles.CACHE_RECORD_KEY] ??= {
        tags: [],
        updatedTags: []
    };
    return record;
}
function cacheTag(...tags) {
    getRecord('cacheTag').tags.push(...tags);
}
function updateTag(tag) {
    getRecord('updateTag').updatedTags.push(tag);
}
function cachePrincipal(principal) {
    getRecord('cachePrincipal');
    globalThis.__EXPO_RSC_STORE__.getStore().context[_profiles.PRINCIPAL_KEY] = principal;
}

//# sourceMappingURL=server.js.map
