// Run locally using Application Default Credentials. Never commit service account keys.
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import ExcelJS from 'exceljs';
import {readFile} from 'node:fs/promises';
const [projectId,workbookPath]=process.argv.slice(2);
if(!projectId||!workbookPath)throw Error('Usage: node firebase/functions/bootstrap.mjs PROJECT_ID "PATH_TO_ORIGINAL_XLSX"');
initializeApp({credential:applicationDefault(),projectId});const auth=getAuth(),db=getFirestore();
const units=JSON.parse(await readFile(new URL('../../dist/units.json',import.meta.url),'utf8'));
const sets=JSON.parse(await readFile(new URL('../../dist/criteria.json',import.meta.url),'utf8'));
const wb=new ExcelJS.Workbook();await wb.xlsx.readFile(workbookPath);const sheet=wb.worksheets[0];const passwords=new Map();
sheet.eachRow(row=>{const code=String(row.getCell(1).value??'').trim();if(!/^\d+$/.test(code))return;const value=row.getCell(4).value;const password=typeof value==='object'&&value?.text?value.text:String(value??'');passwords.set(code==='0'?'admin':'dv'+code.padStart(3,'0'),password)});
for(const unit of units)if((passwords.get(unit.id)||'').length<6)throw Error(`Missing/invalid password for ${unit.id}; no accounts have been created.`);
let created=0,existing=0;
for(const unit of units){let user;try{user=await auth.getUserByEmail(unit.id+'@minhchung.invalid');existing++}catch(x){if(x.code!=='auth/user-not-found')throw x;user=await auth.createUser({uid:'dt2026-'+unit.id,email:unit.id+'@minhchung.invalid',password:passwords.get(unit.id),displayName:unit.name});created++}
 await auth.setCustomUserClaims(user.uid,{unitId:unit.id,admin:unit.role==='admin'});
 await db.doc('users/'+user.uid).set({name:unit.name,unitId:unit.id,role:unit.role,active:true});
 await db.doc('units/'+unit.id).set({...unit,uid:user.uid});
}
// Reruns preserve existing passwords and submissions.
for(const set of sets){const batch=db.batch();for(const c of set.items)batch.set(db.doc('criteria/'+c.id),{...c,group:set.id});await batch.commit();}
const campaign=db.doc('settings/campaign');if(!(await campaign.get()).exists)await campaign.set({locked:false,deadline:''});
passwords.clear();console.log(JSON.stringify({created,existing,criteria:sets.reduce((n,s)=>n+s.items.length,0),passwordsPrinted:false}));
