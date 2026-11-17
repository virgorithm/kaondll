# Kaon — DLL Canteen

Mobile-first DLL canteen pre-order and digital menu prototype.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The initial migration creates sample menu items. The Django API exposes:

- `GET /api/menu/` — available menu items
- `POST /api/auth/register/` and `POST /api/auth/login/` — create an account or receive an auth token
- `GET /api/orders/` — the signed-in user's order history
- `POST /api/orders/` — place an order; send `Authorization: Token <token>`
- `GET/POST /api/admin/menu/` and `PATCH /api/admin/menu/<id>/` — staff-only menu management
- `GET /api/admin/orders/` and `PATCH /api/admin/orders/<id>/` — staff-only order queue and status updates

Create a staff account with `python manage.py createsuperuser`; log into the React app with that account to open the admin portal.

## Production deployment (Render)

Create a PostgreSQL database and a Python web service with `backend` as its root directory. Use:

- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start command: `python manage.py migrate && gunicorn canteen.wsgi:application --bind 0.0.0.0:$PORT`
- Health check path: `/healthz/`

Set these web-service environment variables:

- `DJANGO_SECRET_KEY`: a long, random secret
- `DJANGO_DEBUG`: `false`
- `DJANGO_ALLOWED_HOSTS`: the backend hostname, without `https://`
- `DATABASE_URL`: the PostgreSQL internal connection URL
- `DJANGO_CORS_ORIGINS`: the frontend origin, including `https://`
- `DJANGO_CSRF_TRUSTED_ORIGINS`: the frontend origin, including `https://`

Set `VITE_API_URL` to the backend origin (for example, `https://your-api.onrender.com`) on the frontend build service. The frontend appends `/api` automatically. Rebuild the frontend after changing this variable.

Uploaded menu photos use local filesystem storage by default. On a host with an ephemeral filesystem, configure a persistent disk and set `MEDIA_ROOT` to its mount path, or use object storage, so uploads survive redeploys. Existing files in `backend/media` must also be copied to that storage if you want them online.

For local development, the API runs at `http://localhost:8000` with SQLite unless `DATABASE_URL` is set.
