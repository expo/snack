// Bundle the official plugin with Babel's browser implementation. Native build
// modes requiring filesystem output or hermesc are deliberately unavailable.
const fs = require('node:fs');
const path = require('node:path');
module.exports = {
  name: 'browser-worklets-plugin',
  setup(build) {
    // Full hook signatures avoid the Node-only SHA-1 branch of React Refresh.
    build.onLoad({filter:/react-refresh-babel\.(?:development|production)\.js$/},args=>({
      contents:fs.readFileSync(args.path,'utf8').replace(/require\(["']crypto["']\)/g,`({createHash(){throw Error('Browser refresh requires emitFullSignatures')}})`),
      loader:'js',resolveDir:path.dirname(args.path)
    }));
    const plugin = require.resolve('../../../runtime/node_modules/react-native-worklets/plugin');
    build.onResolve({filter:/^worklets-transform$/},()=>({path:plugin}));
    build.onLoad({filter:/react-native-worklets\/plugin\/index\.js$/},args=>({
      contents:fs.readFileSync(args.path,'utf8').replace(/require\.resolve\("@babel\/(preset|plugin)-([^" ]+)"\)/g,(_,kind,name)=>JSON.stringify(name)), loader:'js', resolveDir:path.dirname(args.path)
    }));
    build.onResolve({filter:/^@babel\/(core|types|generator|traverse)$/},args=>args.importer===plugin?{path:args.path,namespace:'worklets-babel'}:undefined);
    build.onLoad({filter:/.*/,namespace:'worklets-babel'},args=>({contents:args.path==='@babel/core'?`const B=require('@babel/standalone');exports.traverse=B.packages.traverse.default;exports.transformSync=(code,opts)=>{const {babelrc,configFile,...rest}=opts;return B.transform(code,rest)};`: `module.exports=require('@babel/standalone').packages.${args.path.split('/')[1]}${args.path==='@babel/types'?'':'.default'};`,resolveDir:__dirname,loader:'js'}));
    build.onResolve({filter:/^(fs|child_process)$/},args=>args.importer===plugin?{path:args.path,namespace:'worklets-unavailable'}:undefined);
    build.onLoad({filter:/.*/,namespace:'worklets-unavailable'},()=>({contents:`module.exports=new Proxy({}, {get(){return ()=>{throw Error('Worklet filesystem/bytecode build modes are unavailable in the browser')}}});`,loader:'js'}));
  }
};
