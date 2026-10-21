"use client";
import {useMemo} from "react";
import {ActivityDashboard} from "@/components/activity-dashboard";
import type {Activity} from "@/lib/activities";
import type {AunorWorkspace} from "@/lib/aunor";
import {roles} from "@/lib/roles";

/** Receives only the public client projection: no operator identity or audit. */
export function AunorDashboard({w, today}: {w:AunorWorkspace; today:string; initialNow?:number}) {
  const activities = useMemo<Activity[]>(() => {
    const journeys = new Map<string, Activity["spans"]>();
    for (const journey of w.journeys) {
      const spans = journeys.get(journey.activity_id) ?? [];
      spans.push({start: journey.start_date, end: journey.end_date, place: journey.place});
      journeys.set(journey.activity_id, spans);
    }
    return w.activities.map(a => ({
      id:a.id, title:a.title, type:a.type, status:a.status, place:a.place,
      description:a.summary, spans:journeys.get(a.id) ?? [],
      deliveryDueOn:a.delivery_due_on, classification:a.classification,
      recordingModes:a.recording_modes, historicalRegularizedAt:a.historical_regularized_at,
      materialLink:a.status === "Entregada" ? a.material_link ?? "" : "",
      responsible:"", responsibleAccountId:"", operatorOpinion:"", origin:"operario",
    }));
  }, [w.activities, w.journeys]);
  return <div className="space-y-4"><ActivityDashboard role={roles.aunor} clientActivities={activities}
    initialPeriod={{year:Number(today.slice(0,4)), month:Number(today.slice(5,7))-1}}/></div>;
}
