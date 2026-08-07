"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { startOfWeek, addDays } from "@/lib/agenda-range";
import { DayColumn } from "./day-column";
import { GRID_HEIGHT, HOURS_RANGE } from "./grid-utils";
import type { AppointmentItem, BlockedTimeItem } from "./types";

export function WeekView({
  date,
  appointments,
  blockedTimes,
  onSlotClick,
  onRangeSelect,
  onAppointmentClick,
}: {
  date: Date;
  appointments: AppointmentItem[];
  blockedTimes: BlockedTimeItem[];
  onSlotClick?: (date: Date) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
  onAppointmentClick: (appointment: AppointmentItem) => void;
}) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="flex min-w-[900px]">
        <div className="w-14 shrink-0">
          <div className="h-10" />
          {HOURS_RANGE.map((h) => (
            <div
              key={h}
              style={{ height: GRID_HEIGHT / HOURS_RANGE.length }}
              className="-translate-y-2 pr-2 text-right text-xs text-muted-foreground"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className="flex-1 border-l">
            <div
              className={cn(
                "flex h-10 flex-col items-center justify-center border-b text-xs capitalize",
                day.toDateString() === today.toDateString() && "bg-primary/5 font-medium text-primary"
              )}
            >
              <span>{format(day, "EEE", { locale: ptBR })}</span>
              <span>{format(day, "dd/MM")}</span>
            </div>
            <DayColumn
              day={day}
              appointments={appointments}
              blockedTimes={blockedTimes}
              onSlotClick={onSlotClick}
              onRangeSelect={onRangeSelect}
              onAppointmentClick={onAppointmentClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
