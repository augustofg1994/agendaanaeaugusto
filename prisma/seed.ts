import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não definida (necessária para o seed).`);
  return value;
}

async function main() {
  const doctor1 = await upsertDoctor({
    name: requireEnv("SEED_DOCTOR1_NAME"),
    email: requireEnv("SEED_DOCTOR1_EMAIL"),
    password: requireEnv("SEED_DOCTOR1_PASSWORD"),
  });

  const doctor2 = await upsertDoctor({
    name: requireEnv("SEED_DOCTOR2_NAME"),
    email: requireEnv("SEED_DOCTOR2_EMAIL"),
    password: requireEnv("SEED_DOCTOR2_PASSWORD"),
  });

  const consulta = await prisma.procedureType.upsert({
    where: { id: "seed-consulta" },
    update: {},
    create: {
      id: "seed-consulta",
      name: "Consulta",
      defaultDurationMinutes: 30,
      followUpDays: null,
    },
  });

  const retorno = await prisma.procedureType.upsert({
    where: { id: "seed-retorno" },
    update: {},
    create: {
      id: "seed-retorno",
      name: "Procedimento com retorno em 7 dias",
      defaultDurationMinutes: 45,
      followUpDays: 7,
    },
  });

  for (const doctor of [doctor1, doctor2]) {
    for (const procedure of [consulta, retorno]) {
      await prisma.procedureDoctor.upsert({
        where: { procedureTypeId_doctorId: { procedureTypeId: procedure.id, doctorId: doctor.id } },
        update: {},
        create: { procedureTypeId: procedure.id, doctorId: doctor.id },
      });
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const patient = await prisma.patient.upsert({
      where: { cpf: "00000000000" },
      update: {},
      create: {
        fullName: "Paciente de Exemplo",
        cpf: "00000000000",
        email: "paciente.exemplo@example.com",
        phone: "(11) 90000-0000",
        dateOfBirth: new Date("1990-01-01"),
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setMinutes(end.getMinutes() + consulta.defaultDurationMinutes);

    await prisma.appointment.upsert({
      where: { id: "seed-appointment-example" },
      update: {},
      create: {
        id: "seed-appointment-example",
        doctorId: doctor1.id,
        patientId: patient.id,
        procedureTypeId: consulta.id,
        startTime: tomorrow,
        endTime: end,
        createdById: doctor1.id,
      },
    });
  }

  console.log("Seed concluído.");
  console.log(`  Médico 1 (admin): ${doctor1.email}`);
  console.log(`  Médico 2 (admin): ${doctor2.email}`);
  console.log("  Troque as senhas iniciais após o primeiro login (Usuários > editar).");
}

async function upsertDoctor(params: { name: string; email: string; password: string }) {
  const passwordHash = await hashPassword(params.password);
  return prisma.user.upsert({
    where: { email: params.email.toLowerCase().trim() },
    update: {},
    create: {
      name: params.name,
      email: params.email.toLowerCase().trim(),
      passwordHash,
      role: "DOCTOR",
      isAdmin: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
