"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { startOfMonth, startOfWeek, addDays } from "@/lib/agenda-range";
import type { ReminderRow } from "./reminder-item";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function RemindersMonthView({
  date,
  reminders,
  onDayClick,
}: {
  date: Date;
  reminders: ReminderRow[];
  onDayClick: (date: Date) => void;
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
          const dayReminders = reminders.filter((r) => isSameDay(new Date(r.dueDate), day));
          const pendingCount = dayReminders.filter((r) => r.status === "PENDING").length;
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
                  "font-mono text-xs tabular-nums",
                  isSameDay(day, today) &&
                    "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              {pendingCount > 0 && (
                <span className="inline-flex w-fit items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-destructive">
                  {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                </span>
              )}
              {dayReminders.length > pendingCount && (
                <span className="text-[0.65rem] text-muted-foreground">
                  {dayReminders.length - pendingCount} resolvida{dayReminders.length - pendingCount > 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
