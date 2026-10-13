import {createHash} from 'node:crypto';
export const RESET_PHRASE='DAT LAI 2026';
export function validateReset(scope,phrase,authTime,now=Date.now()){
 if(scope!=='all'&&!/^dv\d{3}$/.test(scope))throw Error('Phạm vi đặt lại không hợp lệ.');
 if(phrase!==RESET_PHRASE)throw Error('Cần nhập chính xác DAT LAI 2026.');
 if(!Number.isFinite(authTime)||now-authTime*1000>300000||authTime*1000>now+60000)throw Error('Cần xác nhận lại mật khẩu quản trị viên.');
}
export function fingerprint(docs){return createHash('sha256').update(docs.map(d=>d.id+':'+d.updateTime.toMillis()).sort().join('|')).digest('hex')}
