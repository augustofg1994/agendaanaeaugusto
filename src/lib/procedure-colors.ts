export const PROCEDURE_COLORS = {
  GREEN: {
    label: "Verde claro",
    swatch: "bg-green-200",
    block:
      "bg-green-50 border-green-300 text-green-950 dark:bg-green-500/15 dark:border-green-500/40 dark:text-green-100",
  },
  BLUE: {
    label: "Azul claro",
    swatch: "bg-blue-200",
    block:
      "bg-blue-50 border-blue-300 text-blue-950 dark:bg-blue-500/15 dark:border-blue-500/40 dark:text-blue-100",
  },
  ORANGE: {
    label: "Laranja claro",
    swatch: "bg-orange-200",
    block:
      "bg-orange-50 border-orange-300 text-orange-950 dark:bg-orange-500/15 dark:border-orange-500/40 dark:text-orange-100",
  },
  PURPLE: {
    label: "Roxo claro",
    swatch: "bg-purple-200",
    block:
      "bg-purple-50 border-purple-300 text-purple-950 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-100",
  },
  PINK: {
    label: "Rosa claro",
    swatch: "bg-pink-200",
    block:
      "bg-pink-50 border-pink-300 text-pink-950 dark:bg-pink-500/15 dark:border-pink-500/40 dark:text-pink-100",
  },
  GRAY: {
    label: "Cinza",
    swatch: "bg-gray-300",
    block:
      "bg-gray-50 border-gray-300 text-gray-950 dark:bg-gray-500/15 dark:border-gray-500/40 dark:text-gray-100",
  },
  RED: {
    label: "Vermelho claro",
    swatch: "bg-red-200",
    block:
      "bg-red-50 border-red-300 text-red-950 dark:bg-red-500/15 dark:border-red-500/40 dark:text-red-100",
  },
  YELLOW: {
    label: "Amarelo claro",
    swatch: "bg-yellow-200",
    block:
      "bg-yellow-50 border-yellow-300 text-yellow-950 dark:bg-yellow-500/15 dark:border-yellow-500/40 dark:text-yellow-100",
  },
  TEAL: {
    label: "Verde-azulado",
    swatch: "bg-teal-200",
    block:
      "bg-teal-50 border-teal-300 text-teal-950 dark:bg-teal-500/15 dark:border-teal-500/40 dark:text-teal-100",
  },
  INDIGO: {
    label: "Índigo claro",
    swatch: "bg-indigo-200",
    block:
      "bg-indigo-50 border-indigo-300 text-indigo-950 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-100",
  },
  LIME: {
    label: "Verde-limão",
    swatch: "bg-lime-200",
    block:
      "bg-lime-50 border-lime-300 text-lime-950 dark:bg-lime-500/15 dark:border-lime-500/40 dark:text-lime-100",
  },
  CYAN: {
    label: "Ciano claro",
    swatch: "bg-cyan-200",
    block:
      "bg-cyan-50 border-cyan-300 text-cyan-950 dark:bg-cyan-500/15 dark:border-cyan-500/40 dark:text-cyan-100",
  },
} as const;

export type ProcedureColorKey = keyof typeof PROCEDURE_COLORS;
