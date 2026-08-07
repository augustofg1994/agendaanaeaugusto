export type AppointmentItem = {
  id: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "PENDING_CONFIRMATION";
  notes: string | null;
  patientName: string;
  procedureName: string;
  procedureColor: string;
};

export type BlockedTimeItem = {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  reason: string | null;
};

export type ProcedureOption = {
  id: string;
  name: string;
  defaultDurationMinutes: number;
  color: string;
};

export type PatientOption = {
  id: string;
  fullName: string;
};

export type DoctorOption = {
  id: string;
  name: string;
  access: "MANAGE" | "VIEW";
};
