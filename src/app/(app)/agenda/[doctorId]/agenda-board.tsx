"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewBlockedTimeDialog } from "@/components/blocked-time/new-blocked-time-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, formatDateParam, shiftDate, startOfWeek, type AgendaView } from "@/lib/agenda-range";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { AppointmentFormDialog } from "./appointment-form-dialog";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import type {
  AppointmentItem,
  BlockedTimeItem,
  DoctorOption,
  PatientOption,
  ProcedureOption,
} from "./types";

const viewLabel: Record<AgendaView, string> = { day: "Dia", week: "Semana", month: "Mês" };

export function AgendaBoard({
  doctors,
  selectedDoctorId,
  canManage,
  view,
  date: dateIso,
  appointments,
  blockedTimes,
  procedureTypes,
  patients,
}: {
  doctors: DoctorOption[];
  selectedDoctorId: string;
  canManage: boolean;
  view: AgendaView;
  date: string;
  appointments: AppointmentItem[];
  blockedTimes: BlockedTimeItem[];
  procedureTypes: ProcedureOption[];
  patients: PatientOption[];
}) {
  const router = useRouter();
  const date = new Date(dateIso);

  const [detailAppointment, setDetailAppointment] = useState<AppointmentItem | null>(null);
  const [newAppointmentTime, setNewAppointmentTime] = useState<Date | null>(null);
  const [rangeSelection, setRangeSelection] = useState<{ start: Date; end: Date } | null>(null);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTimeItem | null>(null);

  function navigate(nextView: AgendaView, nextDate: Date, doctorId = selectedDoctorId) {
    router.push(`/agenda/${doctorId}?view=${nextView}&date=${formatDateParam(nextDate)}`);
  }

  const headerLabel =
    view === "month"
      ? format(date, "MMMM 'de' yyyy", { locale: ptBR })
      : view === "day"
        ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : `${format(startOfWeek(date), "dd/MM")} – ${format(addDays(startOfWeek(date), 6), "dd/MM/yyyy")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Clique num horário para agendar, ou arraste para bloquear um intervalo."
              : "Consultas, retornos e bloqueios de horário."}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <NewBlockedTimeDialog
              doctorId={selectedDoctorId}
              defaultDate={date}
              trigger={
                <Button variant="outline" className="shadow-sm">
                  <Lock className="size-4" />
                  Bloquear horário
                </Button>
              }
            />
            <AppointmentFormDialog
              doctorId={selectedDoctorId}
              patients={patients}
              procedureTypes={procedureTypes}
              trigger={<Button className="shadow-sm">Nova consulta</Button>}
            />
          </div>
        )}
      </div>

      {doctors.length > 1 && (
        <Select
          items={Object.fromEntries(doctors.map((d) => [d.id, d.name]))}
          value={selectedDoctorId}
          onValueChange={(v) => v && navigate(view, date, v)}
        >
          <SelectTrigger className="w-64 rounded-lg bg-card shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} {d.access === "VIEW" ? "(somente leitura)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-2 shadow-sm">
        <Tabs value={view} onValueChange={(v) => v && navigate(v as AgendaView, date)}>
          <TabsList>
            {(Object.keys(viewLabel) as AgendaView[]).map((v) => (
              <TabsTrigger key={v} value={v}>
                {viewLabel[v]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(view, shiftDate(view, date, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-center text-sm font-semibold capitalize tabular-nums">
            {headerLabel}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(view, shiftDate(view, date, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(view, new Date())}>
            Hoje
          </Button>
        </div>
      </div>

      {view === "day" && (
        <DayView
          date={date}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onSlotClick={canManage ? (d) => setNewAppointmentTime(d) : undefined}
          onRangeSelect={canManage ? (start, end) => setRangeSelection({ start, end }) : undefined}
          onAppointmentClick={setDetailAppointment}
          onBlockedTimeClick={canManage ? setEditingBlockedTime : undefined}
        />
      )}
      {view === "week" && (
        <WeekView
          date={date}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onSlotClick={canManage ? (d) => setNewAppointmentTime(d) : undefined}
          onRangeSelect={canManage ? (start, end) => setRangeSelection({ start, end }) : undefined}
          onAppointmentClick={setDetailAppointment}
          onBlockedTimeClick={canManage ? setEditingBlockedTime : undefined}
        />
      )}
      {view === "month" && (
        <MonthView
          date={date}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onDayClick={(d) => navigate("day", d)}
          onAppointmentClick={setDetailAppointment}
        />
      )}

      {detailAppointment && (
        <AppointmentDetailDialog
          appointment={detailAppointment}
          canManage={canManage}
          open={!!detailAppointment}
          onOpenChange={(open) => !open && setDetailAppointment(null)}
        />
      )}

      {newAppointmentTime && (
        <AppointmentFormDialog
          doctorId={selectedDoctorId}
          patients={patients}
          procedureTypes={procedureTypes}
          defaultStartTime={newAppointmentTime}
          open={!!newAppointmentTime}
          onOpenChange={(open) => !open && setNewAppointmentTime(null)}
        />
      )}

      {rangeSelection && (
        <NewBlockedTimeDialog
          doctorId={selectedDoctorId}
          defaultRange={rangeSelection}
          open={!!rangeSelection}
          onOpenChange={(open) => !open && setRangeSelection(null)}
        />
      )}

      {editingBlockedTime && (
        <NewBlockedTimeDialog
          doctorId={selectedDoctorId}
          blockedTime={editingBlockedTime}
          open={!!editingBlockedTime}
          onOpenChange={(open) => !open && setEditingBlockedTime(null)}
        />
      )}
    </div>
  );
}
