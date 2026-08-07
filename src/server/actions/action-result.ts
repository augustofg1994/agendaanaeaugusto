export type ActionResult = { ok: true } | { ok: false; error: string };

export function actionErrorMessage(err: unknown, fallback = "Não foi possível concluir a ação.") {
  if (err instanceof Error) return err.message;
  return fallback;
}
