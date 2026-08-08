# Magic Trade

Backend en Django (`backend/`) + frontend en Next.js (`frontend/`). En producción, Next.js actúa como proxy de `/api`, `/admin` y `/static` hacia Django (ver `frontend/next.config.ts`), así que ambos se sirven bajo el mismo dominio.

## Levantar el proyecto en local

Requisitos: Docker, Node 20+, npm.

1. **Base de datos + backend** (Postgres y Django corren en Docker):

   ```bash
   docker compose up -d db web
   ```

   Esto levanta Django en `http://localhost:9000` (mapeado desde el puerto 8000 del contenedor).

2. **Migraciones** (solo la primera vez o cuando haya migraciones nuevas):

   ```bash
   docker compose exec web python manage.py migrate
   docker compose exec web python manage.py createsuperuser  # opcional, para entrar a /admin
   ```

3. **Variables de entorno del backend** (opcional, solo si vas a probar login con Google/Facebook):

   ```bash
   cp .env.example .env
   ```

   y completá `GOOGLE_CLIENT_ID`/`GOOGLE_SECRET`/`FACEBOOK_CLIENT_ID`/`FACEBOOK_SECRET`. `docker-compose.yml` carga este archivo automáticamente (`env_file:`) en los servicios `web` y `jupyter`.

4. **Frontend**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Por defecto corre en `http://localhost:3000` (si ese puerto está ocupado por otro proyecto, Next.js pasa automáticamente al `3001`). Los redirect URIs de OAuth en el backend están configurados por defecto para `http://localhost:3001/auth/callback/...`, así que si vas a probar login social en local, o liberás el puerto 3000 o actualizás `GOOGLE_REDIRECT_URI`/`FACEBOOK_REDIRECT_URI` en `.env` para que coincidan con el puerto real del frontend.

   El frontend sin configuración adicional ya apunta al backend en `http://localhost:9000` (fallback de `BACKEND_INTERNAL_URL` en `next.config.ts`), así que con los pasos 1-2 hechos, `/api` y `/admin` funcionan directo desde `http://localhost:3000`.

## Deploy

Todo corre con Docker Compose detrás de Caddy (TLS automático). Archivos relevantes:

- `docker-compose.prod.yml` — servicios: `db`, `web` (Django/gunicorn), `frontend` (Next.js standalone), `caddy` (reverse proxy + TLS), `db_backup` (dump diario a `./backups`, retiene 7 días).
- `Caddyfile` — proxysea `{$DOMAIN}` hacia `frontend:3000`.
- `.env.prod` — variables de entorno de todos los servicios (no se versiona; hay un template en `.env.prod.example`).
- `backend/Dockerfile.prod` — build de Django, corre `entrypoint.sh` (migrate + collectstatic + gunicorn).
- `frontend/Dockerfile` — build multi-stage de Next.js (`output: standalone`).

**Primer deploy en un servidor nuevo:**

```bash
cp .env.prod.example .env.prod
# completar DOMAIN, ACME_EMAIL, SECRET_KEY, credenciales de Postgres, OAuth, etc.

docker compose -f docker-compose.prod.yml up -d --build
```

Esto construye las imágenes y levanta los 5 servicios. Caddy se encarga de emitir el certificado TLS para `DOMAIN` automáticamente.

## Redeployar (proyecto ya corriendo)

Usar el script `./deploy.sh`, que hace pull + build + rollout con **downtime prácticamente cero** (usa el plugin [`docker-rollout`](https://github.com/Wowu/docker-rollout), instalándolo solo si falta):

```bash
./deploy.sh
```

Qué hace, en orden: `git pull` → build de las imágenes `web` y `frontend` (los contenedores viejos siguen sirviendo tráfico durante el build) → rollout de `web` (levanta el nuevo contenedor, espera su healthcheck, baja el viejo) → mismo rollout para `frontend` → limpia imágenes viejas con `docker image prune`.

Notas:
- Las migraciones corren automáticamente en cada arranque de contenedor (`entrypoint.sh`). Si una migración es incompatible hacia atrás con el código viejo, puede haber errores breves en el réplica vieja mientras ambas conviven — mantené las migraciones aditivas/retrocompatibles.
- Si cambiaste `Caddyfile`, `.env.prod` o el propio `docker-compose.prod.yml` (no solo código de la app), el rollout no lo reconcilia. Hace falta además:

  ```bash
  docker compose -f docker-compose.prod.yml up -d --remove-orphans
  ```

- Para ver logs si algo falla: `docker compose -f docker-compose.prod.yml logs -f [servicio]`.
