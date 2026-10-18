import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

export function selectRelease(pkg, previous, fingerprint, now = new Date().toISOString()) {
  if (previous?.fingerprint === fingerprint && previous.version === pkg.version) return previous;
  const parse=v=>String(v||'').split('.').map(Number);
  const parts=parse(pkg.version);
  if(parts.length!==3 || parts.some(n=>!Number.isInteger(n)||n<0)) throw Error('Phiên bản phải có dạng x.y.z');
  let version=pkg.version;
  if(previous){
    const old=parse(previous.version);
    const comparison=parts.reduce((r,n,i)=>r || Math.sign(n-old[i]),0);
    if(comparison<=0)version=`${old[0]}.${old[1]}.${old[2]+1}`;
  }
  const sourceNote=pkg.releaseNote||'';
  const note=sourceNote && sourceNote!==previous?.sourceNote ? sourceNote : 'Cập nhật hệ thống và cải thiện trải nghiệm sử dụng.';
  return {version,note,updatedAt:now,fingerprint,sourceNote};
}

export async function prepareRelease(root=process.cwd()) {
  const pkgPath=path.join(root,'package.json');
  const pkg=JSON.parse(await readFile(pkgPath,'utf8'));
  let previous;try{previous=JSON.parse(await readFile(path.join(root,'dist/release.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
  const files=[];
  async function walk(dir,staticOnly=false){
    for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){
      if(entry.name==='node_modules'||entry.name.startsWith('.'))continue;
      const name=path.posix.join(dir,entry.name);
      if(entry.isDirectory()){if(!staticOnly)await walk(name);}
      else if(entry.isFile()&&(!staticOnly||(/\.(css|html|json)$/.test(entry.name)&&entry.name!=='release.json')))files.push(name);
    }
  }
  for(const dir of ['src','scripts','firebase'])await walk(dir);
  await walk('dist',true);
  files.push('firebase.json','vercel.json','pnpm-lock.yaml');
  const hash=createHash('sha256');
  const {version:ignored,...inputs}=pkg;hash.update(JSON.stringify(inputs));
  for(const name of files.sort())hash.update(name+'\0').update((await readFile(path.join(root,name),'utf8')).replace(/\r\n/g,'\n')).update('\0');
  const release=selectRelease(pkg,previous,hash.digest('hex'));
  if(pkg.version!==release.version){pkg.version=release.version;await writeFile(pkgPath,JSON.stringify(pkg,null,2)+'\n');}
  return release;
}
