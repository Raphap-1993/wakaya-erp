import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authenticate } from "@/middleware/authn";

import styles from "./login.module.css";

export const dynamic = "force-dynamic";

function describeError(code: string | null): string | null {
  switch (code) {
    case "invalid_credentials":
      return "El correo o la contraseña no coinciden.";
    case "missing_credentials":
      return "Completa correo y contraseña para ingresar.";
    default:
      return null;
  }
}

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function readSingleValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sanitizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/login", { headers: requestHeaders }));

  const resolvedSearchParams =
    await (searchParams ?? {});
  const next = sanitizeNextPath(readSingleValue(resolvedSearchParams.next) ?? "/admin");
  if (auth.authenticated) {
    redirect(next as never);
  }

  const errorMessage = describeError(readSingleValue(resolvedSearchParams.error));

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Wakaya · acceso interno</p>
        <h1 className={styles.title}>Backoffice</h1>
        <p className={styles.lead}>
          Ingresa con el correo operativo para gestionar reservas, solicitudes web y ocupación desde un único panel.
        </p>

        <form className={styles.form} method="post" action="/api/auth/login">
          <input type="hidden" name="next" value={next} />

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              Correo
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              name="email"
              autoComplete="email"
              required
              defaultValue="admin@wakaya.local"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>

          <button className={styles.button} type="submit">
            Ingresar
          </button>
        </form>

        <p className={styles.hint}>
          En local, si no configuraste bootstrap específico, el acceso inicial usa el usuario
          `admin@wakaya.local`.
        </p>
      </section>
    </main>
  );
}
