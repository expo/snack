// Check untrusted structured-cloned values before a second cross-realm copy.
// This bounds forwarding work; it cannot prevent the initial clone allocation.
export function boundedExecution(value){
 let budget=3500000,nodes=0;const seen=new WeakSet();
 function check(item,depth=0){if(++nodes>50000||depth>64)throw Error('Executor output complexity limit');if(item===null||item===undefined||typeof item==='boolean')return;if(typeof item==='number'){if(!Number.isFinite(item))throw Error('Invalid executor number');return}if(typeof item==='string'){budget-=item.length;if(budget<0)throw Error('Executor output size limit');return}if(typeof item!=='object'||seen.has(item))throw Error('Invalid executor value');seen.add(item);if(!Array.isArray(item)&&Object.getPrototypeOf(item)!==Object.prototype&&Object.getPrototypeOf(item)!==null)throw Error('Invalid executor object');for(const key of Object.keys(item)){check(key,depth+1);check(item[key],depth+1)}seen.delete(item);}
 if(!value||typeof value!=='object')throw Error('Invalid executor output');
 const result=value.error!==undefined?{error:value.error,diagnostic:value.diagnostic}:{flight:value.flight,context:value.context,metadata:value.metadata,state:value.state};
 check(result);if(result.error!==undefined&&typeof result.error!=='string')throw Error('Invalid executor error');return result;
}
