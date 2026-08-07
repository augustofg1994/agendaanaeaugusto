"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { startOfMonth, startOfWeek, addDays } from "@/lib/agenda-range";
import { isSameDay } from "./grid-utils";
import type { AppointmentItem } from "./types";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthView({
  date,
  appointments,
  onDayClick,
  onAppointmentClick,
}: {
  date: Date;
  appointments: AppointmentItem[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentItem) => void;
}) {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="px-2 py-2 text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.startTime), day));
          const inMonth = day.getMonth() === date.getMonth();
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r p-1.5 text-left align-top last:border-r-0",
                !inMonth && "bg-muted/20 text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  isSameDay(day, today) && "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="space-y-0.5">
                {dayAppointments.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(a);
                    }}
                    className="truncate rounded bg-primary/10 px-1 text-[0.65rem] text-primary hover:bg-primary/20"
                  >
                    {format(new Date(a.startTime), "HH:mm")} {a.patientName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-[0.65rem] text-muted-foreground">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
