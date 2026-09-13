import { expect,it } from "vitest";
import { collectCursorPages } from "@/lib/cursor-pages";

it("evita la página vacía cuando el conteo exacto confirma el final",async()=>{
  let calls=0;
  expect(await collectCursorPages(async()=>{calls++;return {data:[1,2],error:null,count:2};},String)).toEqual([1,2]);
  expect(calls).toBe(1);
});

it("no pierde filas cuando el servidor limita la página por debajo de 200",async()=>{
  let calls=0;
  const all=[1,2,3,4,5];
  const result=await collectCursorPages(async(last:number|undefined)=>{
    calls++;const remaining=all.filter(n=>n>(last??0));
    return {data:remaining.slice(0,2),count:remaining.length,error:null};
  },String);
  expect(result).toEqual(all);expect(calls).toBe(3);
});
it("continues after a server cap smaller than the requested page and ignores deleted preceding rows",async()=>{
  let source=[1,2,3,4,5];
  const result=await collectCursorPages<number>(async last=>{
    if(last)source=source.filter(id=>id!==1);
    return {data:source.filter(id=>id>(last??0)).slice(0,2),error:null};
  },String);
  expect(result).toEqual([1,2,3,4,5]);
});
it("fails instead of looping when a backend repeats its cursor",async()=>{
  await expect(collectCursorPages(async()=>({data:[1],error:null}),String)).rejects.toThrow("avanzar");
});
