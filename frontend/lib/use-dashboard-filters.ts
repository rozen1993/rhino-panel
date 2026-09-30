"use client";
import { useSyncExternalStore } from "react";
import { dashboardHref, parseDashboardFilters, type DashboardFilters } from "./dashboard-navigation";

const eventName = "davinci:dashboard-filters";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener("popstate", listener); window.removeEventListener(eventName, listener); };
}
const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

export function useDashboardFilters(period: Pick<DashboardFilters, "month" | "year">) {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const filters = parseDashboardFilters(search, period);
  function change(patch: Partial<DashboardFilters>) {
    const next = { ...parseDashboardFilters(window.location.search, period), ...patch };
    // Next integrates native History: no server request for each search keystroke.
    window.history.replaceState(null, "", dashboardHref(next));
    window.dispatchEvent(new Event(eventName));
  }
  return { filters, change, returnTo: dashboardHref(filters) };
}
