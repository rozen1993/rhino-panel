import { describe, expect, it } from "vitest";
import { readActivities, resetActivity, type ActivityActor } from "@/lib/activity-simulation";
const admin: ActivityActor = {accountId:"account-admin",name:"Admin",roleId:"admin",roleLabel:"Admin"};
function storage(){let value:string|null=null;return {getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}};}
describe("restablecimiento conservador",()=>{
  it("conserva material, opinión, mensajes y auditoría",()=>{
    const s=storage(), before=readActivities(s)[0];
    const result=resetActivity(s,before.id,"Corrección de estado",admin,before.version);
    expect(result.ok).toBe(true);
    if(!result.ok)return;
    expect(result.activity.status).toBe("Programada");
    expect(result.activity.deliveredAt).toBeUndefined();
    expect(result.activity.materialLink).toBe(before.materialLink);
    expect(result.activity.operatorOpinion).toBe(before.operatorOpinion);
    expect(result.activity.thread).toEqual(before.thread);
    expect(result.activity.audit.length).toBe(before.audit.length+1);
    expect(result.activity.version).toBe(before.version+1);
  });
  it("rechaza operarios, versiones antiguas y motivos vacíos",()=>{
    const s=storage(), item=readActivities(s)[0];
    expect(resetActivity(s,item.id,"Corrección",{...admin,roleId:"operario"},item.version).ok).toBe(false);
    expect(resetActivity(s,item.id,"Corrección",admin,0).ok).toBe(false);
    expect(resetActivity(s,item.id,"",admin,item.version).ok).toBe(false);
  });
});
