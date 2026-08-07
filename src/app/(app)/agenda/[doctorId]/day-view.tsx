"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayColumn } from "./day-column";
import type { AppointmentItem, BlockedTimeItem } from "./types";

export function DayView({
  date,
  appointments,
  blockedTimes,
  onSlotClick,
  onRangeSelect,
  onAppointmentClick,
  onBlockedTimeClick,
}: {
  date: Date;
  appointments: AppointmentItem[];
  blockedTimes: BlockedTimeItem[];
  onSlotClick?: (date: Date) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
  onAppointmentClick: (appointment: AppointmentItem) => void;
  onBlockedTimeClick?: (blockedTime: BlockedTimeItem) => void;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium capitalize text-muted-foreground">
        {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </h2>
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[400px] p-2">
          <DayColumn
            day={date}
            appointments={appointments}
            blockedTimes={blockedTimes}
            onSlotClick={onSlotClick}
            onRangeSelect={onRangeSelect}
            onAppointmentClick={onAppointmentClick}
            onBlockedTimeClick={onBlockedTimeClick}
            showHourLabels
          />
        </div>
      </div>
    </div>
  );
}
