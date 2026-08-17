"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateParam, shiftDate } from "@/lib/agenda-range";
import { ReminderItem, type ReminderRow } from "./reminder-item";
import { RemindersMonthView } from "./reminders-month-view";

type View = "day" | "month";
type DoctorOption = { id: string; name: string; access: "MANAGE" | "VIEW" };

export function RemindersBoard({
  doctors,
  selectedDoctorId,
  canManage,
  view,
  date: dateIso,
  dayOverdue = [],
  dayDueToday = [],
  monthReminders = [],
}: {
  doctors: DoctorOption[];
  selectedDoctorId: string;
  canManage: boolean;
  view: View;
  date: string;
  dayOverdue?: ReminderRow[];
  dayDueToday?: ReminderRow[];
  monthReminders?: ReminderRow[];
}) {
  const router = useRouter();
  const date = new Date(dateIso);

  function navigate(nextView: View, nextDate: Date, doctorId = selectedDoctorId) {
    router.push(`/reminders?doctorId=${doctorId}&view=${nextView}&date=${formatDateParam(nextDate)}`);
  }

  const headerLabel =
    view === "month"
      ? format(date, "MMMM 'de' yyyy", { locale: ptBR })
      : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ListChecks className="size-6 text-primary" />
          Pendências
        </h1>
        <p className="text-sm text-muted-foreground">
          Lembretes de confirmação e tarefas do dia a dia com os pacientes.
        </p>
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
        <Tabs value={view} onValueChange={(v) => v && navigate(v as View, date)}>
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
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
          <span className="min-w-48 text-center text-sm font-semibold capitalize tabular-nums">
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

      {view === "month" ? (
        <RemindersMonthView
          date={date}
          reminders={monthReminders}
          onDayClick={(d) => navigate("day", d)}
        />
      ) : (
        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-destructive">
              Atrasadas {dayOverdue.length > 0 && `(${dayOverdue.length})`}
            </h2>
            {dayOverdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência atrasada.</p>
            ) : (
              <div className="space-y-2">
                {dayOverdue.map((r) => (
                  <ReminderItem key={r.id} reminder={r} canManage={canManage} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">
              Do dia {dayDueToday.length > 0 && `(${dayDueToday.length})`}
            </h2>
            {dayDueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência para este dia.</p>
            ) : (
              <div className="space-y-2">
                {dayDueToday.map((r) => (
                  <ReminderItem key={r.id} reminder={r} canManage={canManage} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

