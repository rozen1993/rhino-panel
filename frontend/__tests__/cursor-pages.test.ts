import { expect,it } from "vitest";
import { collectCursorPages } from "@/lib/cursor-pages";
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
