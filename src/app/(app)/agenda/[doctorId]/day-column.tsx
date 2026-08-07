"use client";

import { useRef, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROCEDURE_COLORS, type ProcedureColorKey } from "@/lib/procedure-colors";
import {
  GRID_HEIGHT,
  HOURS_RANGE,
  durationPixels,
  isSameDay,
  pixelsFromDayStart,
  timeAtPixelOffset,
} from "./grid-utils";
import type { AppointmentItem, BlockedTimeItem } from "./types";

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-muted border-border text-muted-foreground",
  PENDING_CONFIRMATION:
    "bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-100",
  CANCELLED:
    "bg-transparent border-dashed border-muted-foreground/30 text-muted-foreground line-through",
};

/** SCHEDULED usa a cor do procedimento; os demais status têm sua própria cor fixa (ver statusStyles). */
function appointmentBlockStyle(a: AppointmentItem) {
  if (a.status === "SCHEDULED") {
    const colorKey = a.procedureColor as ProcedureColorKey;
    return PROCEDURE_COLORS[colorKey]?.block ?? PROCEDURE_COLORS.GRAY.block;
  }
  return statusStyles[a.status] ?? "bg-secondary";
}

/** Abaixo desse tamanho de arraste, tratamos como um clique simples (seleção de um único horário). */
const DRAG_THRESHOLD_MINUTES = 15;

function formatHM(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function DayColumn({
  day,
  appointments,
  blockedTimes,
  onSlotClick,
  onRangeSelect,
  onAppointmentClick,
  onBlockedTimeClick,
  showHourLabels = false,
}: {
  day: Date;
  appointments: AppointmentItem[];
  blockedTimes: BlockedTimeItem[];
  onSlotClick?: (date: Date) => void;
  /** Chamado ao soltar o mouse após arrastar por um intervalo maior que um clique simples. */
  onRangeSelect?: (start: Date, end: Date) => void;
  onAppointmentClick: (appointment: AppointmentItem) => void;
  onBlockedTimeClick?: (blockedTime: BlockedTimeItem) => void;
  showHourLabels?: boolean;
}) {
  const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.startTime), day));
  const dayBlocked = blockedTimes.filter((b) => isSameDay(new Date(b.startTime), day));

  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ start: Date; current: Date } | null>(null);
  const canInteract = Boolean(onSlotClick || onRangeSelect);

  function timeFromClientY(clientY: number) {
    const rect = gridRef.current!.getBoundingClientRect();
    return timeAtPixelOffset(day, clientY - rect.top);
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!canInteract || e.button !== 0) return;
    const startTime = timeFromClientY(e.clientY);
    setDrag({ start: startTime, current: startTime });

    // Anexados de forma síncrona (em vez de via useEffect) para nunca perder um
    // mouseup que aconteça antes do próximo commit/efeito do React.
    function handleMouseMove(ev: MouseEvent) {
      setDrag((prev) => (prev ? { ...prev, current: timeFromClientY(ev.clientY) } : prev));
    }

    function handleMouseUp(ev: MouseEvent) {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      const current = timeFromClientY(ev.clientY);
      const start = startTime < current ? startTime : current;
      const end = startTime < current ? current : startTime;
      const minutes = (end.getTime() - start.getTime()) / 60_000;

      setDrag(null);
      if (minutes < DRAG_THRESHOLD_MINUTES) {
        onSlotClick?.(startTime);
      } else if (onRangeSelect) {
        onRangeSelect(start, end);
      } else {
        onSlotClick?.(start);
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  const dragRangeStart = drag && (drag.start < drag.current ? drag.start : drag.current);
  const dragRangeEnd = drag && (drag.start < drag.current ? drag.current : drag.start);

  return (
    <div className="flex">
      {showHourLabels && (
        <div className="w-14 shrink-0 select-none">
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
      )}
      <div
        ref={gridRef}
        className={cn("relative flex-1 border-l", canInteract && "cursor-pointer select-none")}
        style={{ height: GRID_HEIGHT }}
        onMouseDown={handleMouseDown}
      >
        {HOURS_RANGE.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/60"
            style={{ top: (i / HOURS_RANGE.length) * 100 + "%" }}
          />
        ))}

        {dayBlocked.map((b) => (
          <div
            key={b.id}
            role={onBlockedTimeClick ? "button" : undefined}
            tabIndex={onBlockedTimeClick ? 0 : undefined}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              if (!onBlockedTimeClick) return;
              e.stopPropagation();
              onBlockedTimeClick(b);
            }}
            className={cn(
              "absolute left-0.5 right-0.5 flex items-start gap-1 overflow-hidden rounded-lg border border-dashed border-muted-foreground/30 bg-[repeating-linear-gradient(135deg,var(--muted)_0px,var(--muted)_6px,transparent_6px,transparent_12px)] px-1.5 py-1 text-left text-[0.7rem] text-muted-foreground",
              onBlockedTimeClick && "cursor-pointer transition-shadow hover:shadow-md"
            )}
            style={{
              top: Math.max(pixelsFromDayStart(new Date(b.startTime)), 0),
              height: durationPixels(new Date(b.startTime), new Date(b.endTime)),
            }}
          >
            <Lock className="mt-0.5 size-3 shrink-0" />
            <div className="min-w-0">
              <div className="truncate font-medium">Bloqueado</div>
              {b.reason && <div className="truncate opacity-80">{b.reason}</div>}
            </div>
          </div>
        ))}

        {dayAppointments.map((a) => (
          <button
            key={a.id}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAppointmentClick(a);
            }}
            className={cn(
              "absolute left-0.5 right-0.5 overflow-hidden rounded-lg border px-1.5 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md",
              appointmentBlockStyle(a)
            )}
            style={{
              top: Math.max(pixelsFromDayStart(new Date(a.startTime)), 0),
              height: durationPixels(new Date(a.startTime), new Date(a.endTime)),
            }}
          >
            <div className="truncate font-semibold">{a.patientName}</div>
            <div className="truncate text-[0.7rem] opacity-80">{a.procedureName}</div>
          </button>
        ))}

        {dragRangeStart && dragRangeEnd && (
          <div
            className="pointer-events-none absolute left-0.5 right-0.5 z-10 flex items-start justify-center rounded-lg border-2 border-primary bg-primary/15 px-1.5 py-1 text-[0.7rem] font-medium text-primary"
            style={{
              top: Math.max(pixelsFromDayStart(dragRangeStart), 0),
              height: Math.max(durationPixels(dragRangeStart, dragRangeEnd), 18),
            }}
          >
            {formatHM(dragRangeStart)} – {formatHM(dragRangeEnd)}
          </div>
        )}
      </div>
    </div>
  );
}
