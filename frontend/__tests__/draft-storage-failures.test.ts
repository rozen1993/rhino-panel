import {expect,it} from 'vitest';
import {readActivityDraft,writeActivityDraft,removeActivityDraft,type ActivityDraft} from '@/lib/activity-draft';
const unavailable={getItem:()=>{throw Error('Unavailable');},setItem:()=>{throw Error('Quota');},removeItem:()=>{throw Error('Unavailable');}} as unknown as Storage;
it('permite seguir trabajando cuando el almacenamiento local falla',()=>{
 expect(readActivityDraft(unavailable,'draft')).toBeNull();
 expect(writeActivityDraft(unavailable,'draft',{} as ActivityDraft)).toBe(false);
 expect(removeActivityDraft(unavailable,'draft')).toBe(false);
});
it('tolera navegadores que bloquean localStorage por completo',()=>{
 expect(readActivityDraft(null,'draft')).toBeNull();
 expect(writeActivityDraft(null,'draft',{} as ActivityDraft)).toBe(false);
 expect(removeActivityDraft(null,'draft')).toBe(false);
});
