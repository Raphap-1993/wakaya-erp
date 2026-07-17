# Wakaya Production Deploy Safe Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar el commit `e16c1a3` en producción protegiendo la base de datos y los medios productivos mediante backups verificables, migraciones controladas, rollback explícito y validación post-deploy.

**Architecture:** El release se construirá en un directorio inmutable y se activará mediante el symlink `/srv/wakaya/current`; PostgreSQL y los medios vivirán fuera del release. Antes de tocar producción se generará un backup lógico custom de PostgreSQL, un backup de medios con el mismo timestamp lógico y una restauración de prueba en una base aislada. La migración `014_services_copy.sql` se aplicará solo después de validar que no contiene operaciones destructivas y de confirmar el backup.

**Tech Stack:** Next.js 16.2.6, Node/pnpm, PostgreSQL, `pg_dump`/`pg_restore`, PM2, filesystem compartido de medios, migraciones SQL versionadas.

---

## Alcance y reglas de seguridad

- El objetivo de deploy es `main` en el commit `e16c1a3` (`Implementar biblioteca multimedia y contenido de servicios`).
- La migración nueva es `db/migrations/014_services_copy.sql`.
- No ejecutar `pnpm seed` contra producción.
- No ejecutar `migrate:down` contra producción; el proyecto no implementa rollback automático de migraciones.
- No ejecutar `DROP DATABASE`, `DROP SCHEMA`, `TRUNCATE`, `docker compose down -v` ni `pg_restore --clean` contra la base productiva.
- No restaurar la base o los medios por separado después de aceptar nuevas escrituras. Si se necesita recuperación, detener escrituras y restaurar ambos recursos desde el mismo backup lógico.
- No activar el release si `/api/health` no reporta `persistence.contentWrites: "durable"`.
- La ventana requiere un responsable con acceso a PostgreSQL, al host de PM2 y a los secretos de producción.

Objetivos operativos propuestos para validar antes de la ventana: RPO máximo de 15 minutos y RTO máximo de 60 minutos. Si el negocio requiere otros valores, deben quedar registrados antes de aprobar el deploy.

## Mapa de archivos y artefactos

- Revisar: `db/migrations/014_services_copy.sql` — actualización editorial de las cinco experiencias y de la cabecera de servicios del Home.
- Revisar: `scripts/migrate.js` — aplica únicamente migraciones aún ausentes en `schema_migrations`; no borra datos.
- Revisar: `docs/fase-7-deploy/07.04-wakaya-public-cms-pm2.md` — runbook PM2, releases, backup de PostgreSQL/medios y rollback.
- Revisar: `docs/fase-7-deploy/07.02-wakaya-reservations-env-checklist.md` — variables y requisitos de producción.
- Generar fuera del repositorio: `/srv/wakaya/backups/<timestamp>/wakaya.dump`, `media.tar.gz`, checksums y manifiesto de ejecución.
- No versionar dumps, credenciales, archivos de medios ni respaldos del servidor.

### Task 1: Congelar el alcance y validar el commit

**Files:** Ninguno.

- [ ] **Step 1: Confirmar que el servidor de deploy apunta al repositorio correcto.**

```bash
cd /srv/wakaya
git remote get-url origin
git fetch origin main
git show --no-patch --format='%H %s' origin/main
```

Expected: el remoto es `git@github.com:Raphap-1993/wakaya-erp.git` y `origin/main` apunta a `e16c1a36410247b91bc45118656dee59e3dd6b0f`.

- [ ] **Step 2: Revisar cambios de base de datos antes de la ventana.**

```bash
git show --stat --oneline e16c1a3
git show --format=fuller --no-ext-diff e16c1a3 -- db/migrations/014_services_copy.sql
```

Expected: solo se actualizan `content_experience.locale_content` y el documento JSON de `home_content_revision`; no aparecen `drop`, `truncate`, `delete`, ni cambios de reservas, usuarios, pagos o inventario.

- [ ] **Step 3: Confirmar que el árbol de producción no tiene cambios locales.**

```bash
git status --short
```

Expected: salida vacía en el checkout de deploy. Nunca desplegar encima de modificaciones locales no auditadas.

### Task 2: Preparar espacio, permisos y almacenamiento persistente

**Files:** Configuración de PM2 y filesystem del servidor; no modificar la base.

- [ ] **Step 1: Validar variables sin imprimir secretos.**

```bash
test -n "$DATABASE_URL"
test "$NODE_ENV" = production
test -n "$WAKAYA_MEDIA_STORAGE_PATH"
case "$WAKAYA_MEDIA_STORAGE_PATH" in
  /srv/wakaya/shared/*) : ;;
  *) echo "WAKAYA_MEDIA_STORAGE_PATH debe estar fuera del release"; exit 1 ;;
esac
```

Expected: las tres variables existen, `NODE_ENV=production` y el storage apunta a `/srv/wakaya/shared/media` o una ruta persistente equivalente.

- [ ] **Step 2: Validar que el usuario de PM2 puede leer y escribir medios sin alterar contenido.**

```bash
stat -c '%U:%G %a %n' "$WAKAYA_MEDIA_STORAGE_PATH"
install -d -m 750 "$WAKAYA_MEDIA_STORAGE_PATH/.deploy-check"
touch "$WAKAYA_MEDIA_STORAGE_PATH/.deploy-check/write-test"
rm -f "$WAKAYA_MEDIA_STORAGE_PATH/.deploy-check/write-test"
rmdir "$WAKAYA_MEDIA_STORAGE_PATH/.deploy-check"
```

Expected: la prueba funciona con el usuario real de PM2 y no cambia ningún asset existente.

- [ ] **Step 3: Confirmar espacio para dos backups, el release actual y el release nuevo.**

```bash
df -h /srv/wakaya /srv/wakaya/shared /srv/wakaya/backups
du -sh "$WAKAYA_MEDIA_STORAGE_PATH"
```

Expected: espacio libre suficiente para conservar el backup completo, el release anterior y el nuevo durante toda la ventana de observación.

### Task 3: Crear y verificar el backup productivo

**Files:** Crear únicamente artefactos fuera del repositorio en `/srv/wakaya/backups/<timestamp>`.

- [ ] **Step 1: Crear un timestamp lógico y registrar el commit servido.**

```bash
export DEPLOY_TS="$(date -u +%Y%m%dT%H%M%SZ)"
export BACKUP_DIR="/srv/wakaya/backups/$DEPLOY_TS"
install -d -m 700 "$BACKUP_DIR"
git -C /srv/wakaya/current rev-parse HEAD | tee "$BACKUP_DIR/release-before.txt"
date -u | tee "$BACKUP_DIR/backup-started-at.txt"
```

Expected: el directorio es privado y el release previo queda registrado.

- [ ] **Step 2: Generar el dump custom sin `--clean` ni opciones destructivas.**

```bash
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_DIR/wakaya.dump" \
  "$DATABASE_URL"
```

Expected: `pg_dump` termina con código 0 y el archivo existe con permisos privados.

- [ ] **Step 3: Respaldar el directorio de medios persistentes.**

```bash
tar \
  --create \
  --gzip \
  --file="$BACKUP_DIR/media.tar.gz" \
  --directory="$(dirname "$WAKAYA_MEDIA_STORAGE_PATH")" \
  "$(basename "$WAKAYA_MEDIA_STORAGE_PATH")"
```

Expected: el archivo contiene el storage completo, incluidos `master.webp` y variantes.

- [ ] **Step 4: Generar checksums y validar que el dump sea legible.**

```bash
sha256sum "$BACKUP_DIR/wakaya.dump" "$BACKUP_DIR/media.tar.gz" | tee "$BACKUP_DIR/SHA256SUMS"
pg_restore --list "$BACKUP_DIR/wakaya.dump" > "$BACKUP_DIR/wakaya.restore-list.txt"
tar -tzf "$BACKUP_DIR/media.tar.gz" > "$BACKUP_DIR/media.file-list.txt"
test -s "$BACKUP_DIR/wakaya.restore-list.txt"
test -s "$BACKUP_DIR/media.file-list.txt"
```

Expected: ambos artefactos tienen checksum y listados no vacíos.

- [ ] **Step 5: Copiar el backup a almacenamiento separado antes de continuar.**

```bash
rsync -a --protect-args "$BACKUP_DIR/" "/srv/wakaya-backups-offsite/$DEPLOY_TS/"
sha256sum -c "/srv/wakaya-backups-offsite/$DEPLOY_TS/SHA256SUMS"
```

Expected: el checksum del destino separado coincide con el origen. Si no existe almacenamiento separado o falla la copia, detener el deploy.

### Task 4: Probar restauración en una base aislada

**Files:** Crear una base temporal de staging/restore; no tocar la base productiva.

- [ ] **Step 1: Crear una base de restauración aislada con nombre de timestamp.**

```bash
export RESTORE_DB="wakaya_restore_${DEPLOY_TS//[^A-Za-z0-9_]/_}"
createdb "$RESTORE_DB"
```

Expected: la base temporal existe y no es la base contenida en `DATABASE_URL`.

- [ ] **Step 2: Restaurar el dump sin conectarse a producción.**

```bash
pg_restore \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  --dbname="$RESTORE_DB" \
  "$BACKUP_DIR/wakaya.dump"
```

Expected: restauración completa sin errores.

- [ ] **Step 3: Verificar tablas y conteos críticos en la copia.**

```bash
psql "$RESTORE_DB" -v ON_ERROR_STOP=1 -c "
  select current_database();
  select count(*) as reservations from reservation;
  select count(*) as bungalow_units from bungalow_unit;
  select count(*) as experiences from content_experience where deleted_at is null;
  select count(*) as media_assets from media_asset where status = 'ready';
"
```

Expected: la consulta devuelve la base temporal y conteos plausibles comparables con producción. Registrar los conteos en el manifiesto del backup.

- [ ] **Step 4: Verificar el backup de medios sin sobrescribir el storage productivo.**

```bash
export RESTORE_MEDIA_DIR="/srv/wakaya/restore/$DEPLOY_TS/media"
install -d -m 750 "$RESTORE_MEDIA_DIR"
tar -xzf "$BACKUP_DIR/media.tar.gz" -C "$RESTORE_MEDIA_DIR"
find "$RESTORE_MEDIA_DIR" -type f -name 'master.webp' | wc -l
```

Expected: la extracción ocurre fuera de `/srv/wakaya/shared/media` y el número de masters es mayor que cero.

- [ ] **Step 5: Eliminar solo los recursos temporales de prueba.**

```bash
dropdb "$RESTORE_DB"
rm -rf "$RESTORE_MEDIA_DIR"
```

Expected: se eliminan únicamente la base y el directorio temporal de restore; el backup original y el storage productivo permanecen intactos.

### Task 5: Construir y validar el release fuera de producción

**Files:** Crear `/srv/wakaya/releases/e16c1a3`; no compilar dentro de `/srv/wakaya/current`.

- [ ] **Step 1: Crear checkout inmutable del commit aprobado.**

```bash
git worktree add --detach "/srv/wakaya/releases/e16c1a3" e16c1a3
cd /srv/wakaya/releases/e16c1a3
```

Expected: el release contiene exactamente el commit aprobado.

- [ ] **Step 2: Instalar dependencias y ejecutar gates.**

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit --pretty false
pnpm run build
git diff --check
```

Expected: tests, TypeScript, build y `diff --check` terminan con código 0. Los avisos OIDC del build local no son una aprobación de producción; en producción las variables OIDC deben existir.

- [ ] **Step 3: Verificar la migración contra una copia restaurada o staging.**

```bash
DATABASE_URL="<restore-or-staging-url>" pnpm migrate
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select version from schema_migrations order by version;"
```

Expected: `014_services_copy.sql` se aplica una sola vez, no hay pérdida de conteos operativos y los textos de servicios quedan en `content_experience`.

### Task 6: Aplicar migración y activar el release en la ventana aprobada

**Files:** Producción PostgreSQL, `/srv/wakaya/current` y proceso PM2; ejecutar solo después de Tasks 1–5.

- [ ] **Step 1: Confirmar aprobación explícita de la ventana y del backup.**

Registrar en el manifiesto: responsable, hora UTC, commit, checksum del dump, checksum de medios, resultado del restore y conteos antes/después. Si falta cualquier registro, no continuar.

- [ ] **Step 2: Confirmar que nadie está ejecutando ediciones durante el cambio.**

```bash
pm2 status
```

Bloquear temporalmente acciones editoriales o anunciar una ventana de solo lectura. No detener PostgreSQL ni eliminar contenedores/volúmenes.

- [ ] **Step 3: Aplicar las migraciones pendientes contra `DATABASE_URL` productivo.**

```bash
cd /srv/wakaya/releases/e16c1a3
pnpm migrate
```

Expected: se aplica solo `014_services_copy.sql` (o ninguna si ya fue aplicada) y el proceso termina con código 0. Si falla, detener el deploy y conservar el backup; no ejecutar rollback improvisado.

- [ ] **Step 4: Activar el release manteniendo el anterior.**

```bash
ln -sfn /srv/wakaya/releases/e16c1a3 /srv/wakaya/current
pm2 reload <wakaya-process-name> --update-env
```

Expected: el symlink apunta al release nuevo y el release anterior permanece disponible para rollback de aplicación.

- [ ] **Step 5: Validar salud y persistencia.**

```bash
curl --fail --silent http://127.0.0.1:<port>/api/health
```

Expected: HTTP 200 y `persistence.contentWrites` igual a `durable`.

### Task 7: Ejecutar smoke tests públicos y administrativos

**Files:** Ninguno; registrar evidencia en el manifiesto de la ventana.

- [ ] **Step 1: Validar páginas ES y EN.**

```bash
for path in /es /en /es/bungalows /en/bungalows /es/services /en/services /es/gallery /en/gallery /es/contact /en/contact; do
  curl --fail --silent --show-error -o /dev/null -w "$path %{http_code}\n" "https://wakayaecolodge.com$path"
done
```

Expected: todos los endpoints responden 200.

- [ ] **Step 2: Validar el contenido nuevo de servicios.**

```bash
curl --fail --silent https://wakayaecolodge.com/es/services | grep -F "Experiencias diseñadas para descansar, celebrar, compartir y conectar con la naturaleza."
curl --fail --silent https://wakayaecolodge.com/es/services | grep -F "El comienzo de una nueva historia merece un escenario inolvidable."
```

Expected: ambas cadenas aparecen desde contenido persistido; no deben provenir de un fallback por base caída.

- [ ] **Step 3: Validar backoffice autenticado.**

Con una sesión administrativa real, comprobar `/admin/content` y: abrir Biblioteca, seleccionar un asset existente, confirmar que el asset sigue disponible en su uso anterior, quitar una imagen de una galería, y verificar que un asset referenciado no se pueda eliminar físicamente.

- [ ] **Step 4: Validar imágenes y medios persistentes.**

Abrir Home, Bungalows, Servicios y Galería; comprobar que las imágenes cargan después de reiniciar PM2. No aceptar el deploy si aparece `media_not_found`, `media_processing_failed` o `persistence.contentWrites` distinto de `durable`.

### Task 8: Rollback y cierre de la ventana

**Files:** Symlink de release y manifiesto de operación; restauración de DB solo con aprobación de incidente.

- [ ] **Step 1: Si falla únicamente la aplicación y no hay escrituras nuevas, hacer rollback de código.**

```bash
ln -sfn /srv/wakaya/releases/<previous-commit> /srv/wakaya/current
pm2 reload <wakaya-process-name> --update-env
curl --fail --silent http://127.0.0.1:<port>/api/health
```

Expected: el release anterior vuelve a servir y la salud queda en 200.

- [ ] **Step 2: Si la migración o los datos presentan corrupción, detener escrituras y escalar.**

No ejecutar `migrate:down` ni restaurar directamente sobre la base productiva sin una decisión de incidente. Aislar una copia, comparar conteos y restaurar PostgreSQL y medios desde el mismo timestamp únicamente con aprobación del responsable de recuperación.

- [ ] **Step 3: Cerrar la ventana solo con evidencia completa.**

Registrar commit servido, versión de migraciones, hora de backup, checksums, resultado de restore, healthcheck, smoke tests, logs relevantes, responsable y decisión final. Mantener el release anterior y el backup fuera de línea hasta cerrar la observación.

## Quality gates de aprobación

- [ ] Backup custom de PostgreSQL creado y validado con `pg_restore --list`.
- [ ] Backup de medios creado con el mismo timestamp lógico y checksum verificado en copia separada.
- [ ] Restauración probada en base y filesystem aislados.
- [ ] `014_services_copy.sql` revisada y aplicada primero en restore/staging.
- [ ] No se ejecutan comandos destructivos ni se borra la base productiva.
- [ ] Tests, TypeScript, build y `git diff --check` pasan en el release.
- [ ] `persistence.contentWrites = durable` después de la activación.
- [ ] Smoke ES/EN, backoffice autenticado y medios completados.
- [ ] Rollback de aplicación probado o confirmado antes de aceptar nuevas escrituras.

## Gaps que deben resolverse antes de ejecutar

- Confirmar nombre real del proceso PM2 y puerto productivo en el inventario del servidor.
- Confirmar ruta real de backup fuera del host o mecanismo equivalente y retención.
- Confirmar RPO/RTO aceptados por el negocio.
- Confirmar quién autoriza una restauración destructiva en caso de incidente.
- Confirmar que OIDC y todas las variables de producción están cargadas en PM2.
