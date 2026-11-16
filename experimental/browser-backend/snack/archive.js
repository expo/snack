const decoder=new TextDecoder();
export async function bounded(response,limit,signal){
 if(!response.ok)throw Object.assign(Error('Package fetch failed: '+response.status),{status:response.status});
 const reader=response.body.getReader(),parts=[];let size=0;
 try{while(true){signal?.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Package size limit');parts.push(value);}}
 finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;
}
export async function verify(bytes,integrity){
 const values=(integrity||'').split(/\s+/);const token=values.find(x=>x.startsWith('sha512-'));
 const match=/^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(token||'');if(!match)throw Error('SHA-512 package integrity required');
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-512',bytes));if(btoa(String.fromCharCode(...hash))!==match[1])throw Error('Package integrity mismatch');
}
function pax(bytes){const values={};let offset=0;while(offset<bytes.length){const space=bytes.indexOf(32,offset);if(space<0)throw Error('Invalid PAX record');const length=Number(decoder.decode(bytes.subarray(offset,space)));if(!Number.isInteger(length)||length<=space-offset+2||offset+length>bytes.length)throw Error('Invalid PAX length');const line=decoder.decode(bytes.subarray(space+1,offset+length-1));const split=line.indexOf('=');if(split<1)throw Error('Invalid PAX field');values[line.slice(0,split)]=line.slice(split+1);offset+=length;}return values;}
export function unpack(bytes,{binary=false}={}){
 const files=new Map();let next={},globalFields={},longName;
 const string=(offset,size)=>decoder.decode(bytes.subarray(offset,offset+size)).replace(/\0.*$/s,'');
 for(let offset=0;offset+512<=bytes.length;){
  if(bytes.subarray(offset,offset+512).every(x=>x===0))break;
  const checksum=parseInt(string(offset+148,8).trim(),8);let sum=0;for(let i=0;i<512;i++)sum+=(i>=148&&i<156)?32:bytes[offset+i];if(sum!==checksum)throw Error('Invalid tar checksum');
  const type=string(offset+156,1);const rawSize=parseInt(string(offset+124,12).trim()||'0',8);
  const fields={...globalFields,...next};const size=['x','g','L'].includes(type)?rawSize:fields.size!==undefined?Number(fields.size):rawSize;
  if(!Number.isSafeInteger(size)||size<0||offset+512+size>bytes.length)throw Error('Invalid tar size');
  const body=bytes.subarray(offset+512,offset+512+size);const prefix=string(offset+345,155);
  const name=fields.path||longName||(prefix?prefix+'/':'')+string(offset,100);offset+=512+Math.ceil(size/512)*512;
  if(type==='x'){next=pax(body);continue;}if(type==='g'){globalFields={...globalFields,...pax(body)};continue;}if(type==='L'){longName=decoder.decode(body).replace(/\0.*$/s,'');continue;}
  next={};longName=undefined;
  if(type==='5')continue;if(type!==''&&type!=='0')throw Error('Unsupported tar entry type '+type);
  if(!name.startsWith('package/')||name.includes('\\')||name.split('/').some(p=>p==='..'||p==='.'||!p))throw Error('Unsafe tar path');
  const file=name.slice(8);if(files.has(file))throw Error('Duplicate tar path');if(files.size>=5000)throw Error('Package file limit');files.set(file,binary?body.slice():decoder.decode(body));
 }
 if(!files.has('package.json'))throw Error('Missing package manifest');return files;
}
