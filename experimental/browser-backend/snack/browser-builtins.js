import * as buffer from 'buffer/';
import EventEmitter from 'events/';
import path from 'path-browserify';
import assert from 'assert/';
import util from 'util/';
import decoder from 'string_decoder/';
import stream from 'readable-stream';
import processShim from 'process/browser';
export const Buffer=buffer.Buffer;
// This process facade exposes no host environment, filesystem or native bindings.
export const browserProcess=Object.freeze({browser:true,env:Object.freeze({NODE_ENV:'production'}),argv:Object.freeze([]),version:'',versions:Object.freeze({}),nextTick:processShim.nextTick,cwd:()=>'/project'});
const modules={buffer,events:EventEmitter,path,'path/posix':path,assert,'assert/strict':assert.strict,util,string_decoder:decoder,stream,'stream/promises':stream.promises,process:browserProcess};
export const browserBuiltins=Object.fromEntries(Object.entries(modules).flatMap(([name,value])=>[['@'+name,value],['@node:'+name,value]]));
