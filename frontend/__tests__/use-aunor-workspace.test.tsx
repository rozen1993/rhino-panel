import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createAunorExamples } from "@/lib/aunor-examples";
import type { AunorWorkspace } from "@/lib/aunor";
const mocks=vi.hoisted(()=>({read:vi.fn()}));
vi.mock("@/app/aunor/actions",()=>({getAunorWorkspaceAction:mocks.read}));
import { useAunorWorkspace } from "@/lib/use-aunor-workspace";

let initial:AunorWorkspace;
beforeEach(()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-09-12T12:00:00Z"));
  initial=createAunorExamples();
  mocks.read.mockResolvedValue({ok:true,data:{...initial,services:[]}});
  vi.spyOn(document,"visibilityState","get").mockReturnValue("visible");
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.clearAllMocks();});

it("reuses the initial catalog and throttles focus refreshes",async()=>{
  const {result}=renderHook(()=>useAunorWorkspace(initial,"panel",""));
  await act(async()=>{window.dispatchEvent(new Event("focus"));});
  expect(mocks.read).not.toHaveBeenCalled();
  await act(async()=>{await vi.advanceTimersByTimeAsync(30_000);});
  expect(mocks.read).toHaveBeenCalledExactlyOnceWith({scene:"panel",includeServices:false});
  expect(result.current.w.services).toEqual(initial.services);
  await act(async()=>{window.dispatchEvent(new Event("focus"));});
  expect(mocks.read).toHaveBeenCalledTimes(1);
});

it("coalesces concurrent reads and discards responses after unmount",async()=>{
  let resolve!:(value:unknown)=>void;
  mocks.read.mockReturnValue(new Promise(r=>{resolve=r;}));
  const {result,unmount}=renderHook(()=>useAunorWorkspace(initial,"detail","activity-1"));
  const first=result.current.refresh();
  expect(result.current.refresh()).toBe(first);
  expect(mocks.read).toHaveBeenCalledExactlyOnceWith({scene:"detail",id:"activity-1",includeServices:false});
  unmount();
  resolve({ok:true,data:initial});
  await expect(first).resolves.toBe(false);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(mocks.read).toHaveBeenCalledTimes(1);
});

it("renews the catalog after five minutes and on manual refresh",async()=>{
  const {result}=renderHook(()=>useAunorWorkspace(initial,"calendar",""));
  vi.setSystemTime(Date.now()+300_000);
  mocks.read.mockResolvedValue({ok:true,data:initial});
  await act(async()=>{await result.current.refresh();});
  expect(mocks.read).toHaveBeenLastCalledWith({scene:"calendar",includeServices:true});
  await act(async()=>{await result.current.refresh(true);});
  expect(mocks.read).toHaveBeenLastCalledWith({scene:"calendar",includeServices:true});
});

it("does not poll hidden tabs",async()=>{
  vi.spyOn(document,"visibilityState","get").mockReturnValue("hidden");
  renderHook(()=>useAunorWorkspace(initial,"panel",""));
  await act(async()=>{await vi.advanceTimersByTimeAsync(60_000);window.dispatchEvent(new Event("focus"));});
  expect(mocks.read).not.toHaveBeenCalled();
});

it("waits for older reads before a mutation and pauses background polling",async()=>{
  let resolve!:(value:unknown)=>void;
  mocks.read.mockReturnValueOnce(new Promise(r=>{resolve=r;}));
  const {result}=renderHook(()=>useAunorWorkspace(initial,"panel",""));
  const read=result.current.refresh();
  let started=false;
  const mutation=result.current.beginMutation().then(ok=>{started=ok;});
  await expect(result.current.beginMutation()).resolves.toBe(false);
  expect(started).toBe(false);
  await act(async()=>{resolve({ok:true,data:initial});await read;await mutation;});
  expect(started).toBe(true);
  await act(async()=>{await vi.advanceTimersByTimeAsync(60_000);window.dispatchEvent(new Event("focus"));});
  expect(mocks.read).toHaveBeenCalledTimes(1);
  const saved={...initial,activities:initial.activities.map(a=>({...a,summary:"Saved confirmation"}))};
  mocks.read.mockResolvedValue({ok:true,data:saved});
  await act(async()=>{await result.current.refresh(true);result.current.endMutation();});
  expect(result.current.w.activities[0].summary).toBe("Saved confirmation");
});

it("keeps existing data when refresh fails and allows retry",async()=>{
  const {result}=renderHook(()=>useAunorWorkspace(initial,"panel",""));
  mocks.read.mockRejectedValueOnce(new Error("private diagnostic"));
  await act(async()=>{expect(await result.current.refresh()).toBe(false);});
  expect(result.current.w).toBe(initial);
  expect(result.current.error).not.toContain("private diagnostic");
  await act(async()=>{expect(await result.current.refresh(true)).toBe(true);});
  expect(result.current.error).toBe("");
});
