"use client";
import { useMemo } from "react";
import { useSimulatedActivities } from "@/lib/activity-simulation";
import type { DataSource } from "@/lib/data-source";
import type { HistoricalActivity, HistoricalCategory } from "@/lib/historical";
import { AnnualCalendarView } from "@/components/annual-calendar-view";
import { DetailPanel } from "@/components/calendar-detail-panel";

export function AnnualCalendar({category,dataSource,initialActivities=[],today,year}: {
  category?:HistoricalCategory;dataSource:DataSource;initialActivities?:HistoricalActivity[];today:string;year:number;
}) {
  const stored=useSimulatedActivities(dataSource==="demo");
  const all=useMemo(()=>dataSource==="demo"?stored.filter(item=>!item.deletedAt):initialActivities,[dataSource,stored,initialActivities]);
  return <AnnualCalendarView category={category} activities={all} today={today} year={year} renderDetail={(props)=>{
    const item=all.find(candidate=>candidate.id===props.item.id);
    if(!item) return null;
    return <DetailPanel key={`${year}-${props.selectionKey}`} {...props} item={item} choices={all.filter(candidate=>props.choices.some(choice=>choice.id===candidate.id))} onChoose={props.onChoose}/>;
  }}/>;
}
