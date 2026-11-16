export const builtinNames=['buffer','events','path','path/posix','assert','assert/strict','util','string_decoder','stream','stream/promises','process'];
export const builtinSpecifiers=new Set(builtinNames.flatMap(name=>[name,'node:'+name]));
const unavailable=new Set(['fs','fs/promises','net','tls','dns','dns/promises','http','https','http2','dgram','child_process','cluster','worker_threads','module','vm','v8','os','async_hooks','crypto','zlib','sqlite','wasi']);
export function rejectHostBuiltin(spec){const name=spec.replace(/^node:/,'');if(spec.startsWith('node:')||unavailable.has(name))throw Error('Unsupported Node capability '+spec+': use a browser/WebAssembly implementation or run this dependency in a separate server runtime');}
