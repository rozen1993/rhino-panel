"use client";
import type { ReactNode } from "react";
import type { AunorReplacement, AunorWorkspace } from "@/lib/aunor";
import { ContractCenter } from "./contract-center";

/** Same contract presentation, without importing any management controls. */
export function AunorContract({w, initialMonth, renderReplacement}: {
  w: AunorWorkspace; initialMonth: string;
  renderReplacement: (replacement: AunorReplacement) => ReactNode;
}) {
  return <ContractCenter w={w} initialMonth={initialMonth} renderReplacement={renderReplacement}/>;
}
