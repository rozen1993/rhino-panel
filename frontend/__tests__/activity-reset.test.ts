import { describe, expect, it } from "vitest";
import { readActivities, resetActivity, type ActivityActor } from "@/lib/activity-simulation";
const admin: ActivityActor = {accountId:"account-admin",name:"Admin",roleId:"admin",roleLabel:"Admin"};
function storage(){let value:string|null=null;return {getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}};}
describe("reinicio con ejecución anterior en papelera",()=>{
  it("crea una ejecución limpia sin perder la anterior",()=>{
    const s=storage(), before=readActivities(s)[0];
    const result=resetActivity(s,before.id,"Corrección de estado",admin,before.version);
    expect(result.ok).toBe(true);
    if(!result.ok)return;
    expect(result.activity.status).toBe("Programada");
    expect(result.activity.deliveredAt).toBeUndefined();
    expect(result.activity.id).not.toBe(before.id);
    expect(result.activity.materialLink).toBe("");
    expect(result.activity.operatorOpinion).toBe("");
    expect(result.activity.thread).toEqual([]);
    expect(result.activity.spans).toEqual(before.spans);
    expect(result.activity.version).toBe(1);
    const archived=readActivities(s).find(item=>item.id===before.id)!;
    expect(archived.deletedAt).toBeTruthy();
    expect(archived.materialLink).toBe(before.materialLink);
    expect(archived.operatorOpinion).toBe(before.operatorOpinion);
    expect(archived.thread).toEqual(before.thread);
    expect(archived.audit.length).toBe(before.audit.length+1);
    expect(resetActivity(s,before.id,"Repetición",admin,before.version).ok).toBe(false);
  });
  it("rechaza operarios, versiones antiguas y motivos vacíos",()=>{
    const s=storage(), item=readActivities(s)[0];
    expect(resetActivity(s,item.id,"Corrección",{...admin,roleId:"operario"},item.version).ok).toBe(false);
    expect(resetActivity(s,item.id,"Corrección",admin,0).ok).toBe(false);
    expect(resetActivity(s,item.id,"",admin,item.version).ok).toBe(false);
  });
});
