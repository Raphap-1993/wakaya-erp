"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";

import { ROLE_LABELS, ROLE_VALUES, type Role } from "@/lib/rbac";

import styles from "../reservations/reservations.module.css";

type BackofficeUserFormMode = "create" | "edit";

type BackofficeUserFormProps = {
  mode: BackofficeUserFormMode;
  actionHref: string;
  backHref: string;
  initialValues: {
    email: string;
    name: string;
    roles: Role[];
    active: boolean;
  };
};

const MODE_COPY = {
  create: {
    eyebrow: "Wakaya · acceso interno",
    title: "Nuevo usuario interno",
    submitLabel: "Crear usuario",
    passwordLabel: "Contraseña temporal",
    helper: "Crea un acceso persistido para operaciones, aprobación o administración del back office.",
  },
  edit: {
    eyebrow: "Wakaya · permisos internos",
    title: "Editar usuario interno",
    submitLabel: "Guardar cambios",
    passwordLabel: "Nueva contraseña",
    helper: "Actualiza roles, estado y contraseña sin abrir el detalle dentro de la bandeja principal.",
  },
} as const;

function describeError(message: string) {
  switch (message) {
    case "email_taken":
      return "Ya existe un usuario con ese correo.";
    case "invalid_email":
      return "El correo no es válido.";
    case "invalid_name":
      return "El nombre operativo es obligatorio.";
    case "invalid_password":
      return "La contraseña debe tener al menos 8 caracteres.";
    case "invalid_roles":
      return "Selecciona al menos un rol válido.";
    case "last_admin_required":
      return "Debe quedar al menos un administrador activo en el back office.";
    default:
      return message || "No se pudo guardar el usuario.";
  }
}

export function BackofficeUserForm({
  mode,
  actionHref,
  backHref,
  initialValues,
}: BackofficeUserFormProps) {
  const router = useRouter();
  const copy = MODE_COPY[mode];

  const [email, setEmail] = useState(initialValues.email);
  const [name, setName] = useState(initialValues.name);
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(initialValues.active);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(initialValues.roles);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && name.trim().length > 0 && selectedRoles.length > 0,
    [email, name, selectedRoles],
  );

  const toggleRole = (role: Role) => {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((value) => value !== role) : [...current, role],
    );
  };

  const onActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    setActive(event.target.checked);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !canSubmit) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(actionHref, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password: password.trim() || undefined,
          roles: selectedRoles,
          active,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? "unexpected_error");
      }

      setFeedback({
        kind: "success",
        message: mode === "create" ? "Usuario creado correctamente." : "Usuario actualizado correctamente.",
      });
      window.setTimeout(() => {
        router.replace("/admin/users" as never);
      }, 400);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeError(error instanceof Error ? error.message : "unexpected_error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.lead}>{copy.helper}</p>

          <div className={styles.heroActions}>
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href={backHref as never}>
              Volver a usuarios
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.detailGrid}>
            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Perfil operativo</h2>
              </div>

              {feedback ? (
                <p
                  className={`${styles.feedbackBanner} ${
                    feedback.kind === "success" ? styles.feedbackSuccess : styles.feedbackError
                  }`}
                >
                  {feedback.message}
                </p>
              ) : null}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Correo operativo</span>
                    <input
                      className={styles.input}
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Nombre visible</span>
                    <input
                      className={styles.input}
                      name="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{copy.passwordLabel}</span>
                  <input
                    className={styles.input}
                    name="password"
                    type="password"
                    value={password}
                    placeholder={mode === "create" ? "Mínimo 8 caracteres" : "Solo si deseas cambiarla"}
                    onChange={(event) => setPassword(event.target.value)}
                    required={mode === "create"}
                  />
                </label>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Roles</span>
                  <div className={styles.roleSelectorGrid}>
                    {ROLE_VALUES.map((role) => {
                      const checked = selectedRoles.includes(role);
                      return (
                        <label
                          key={role}
                          className={`${styles.roleOption} ${checked ? styles.roleOptionActive : ""}`}
                        >
                          <input
                            className={styles.roleCheckbox}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRole(role)}
                          />
                          <span>{role}</span>
                          <small>{ROLE_LABELS[role]}</small>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label className={styles.toggleField}>
                  <input type="checkbox" checked={active} onChange={onActiveChange} />
                  <span>Usuario activo</span>
                </label>

                <div className={styles.buttonRow}>
                  <button className={styles.button} type="submit" disabled={isSubmitting || !canSubmit}>
                    {isSubmitting ? `${copy.submitLabel}...` : copy.submitLabel}
                  </button>
                </div>
              </form>
            </article>

            <aside className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Criterio operativo</h2>
              </div>

              <ul className={styles.formNoteList}>
                <li className={styles.formNoteItem}>
                  viewer solo consulta paneles y fichas, sin crear ni editar.
                </li>
                <li className={styles.formNoteItem}>
                  editor puede crear reservas y operar asignaciones, pero no aprobar cobros finales.
                </li>
                <li className={styles.formNoteItem}>
                  approver suma confirmaciones, cobros y cambios de estado sensibles.
                </li>
                <li className={styles.formNoteItem}>
                  admin agrega gobierno completo del back office y gestión de usuarios internos.
                </li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
