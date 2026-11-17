# Treasure

Treasure is a React and TypeScript application with an Express API and a
PostgreSQL database. It includes account registration, authentication, profile
management, and password resets.

## Requirements

- Node.js 26 or newer and npm
- PostgreSQL
- Docker with BuildKit, for the Docker image

## Configuration

Create `backend/.env.dev` with the following settings, replacing the example
values with your own:

```dotenv
API_HOST=localhost
API_PORT=3000
API_STATIC_DIR=public
API_IMG_DIR=images
GMAIL_ADDRESS=your-address@example.com
GMAIL_APP_PASSWORD=your-app-password
JWT_SECRET_KEY=replace-with-a-long-random-secret
SALT_ROUNDS=12
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=treasure
```

The backend needs all of these variables at startup. The database must already
exist. Configure a Gmail address and app password for email features. Keep this
file and its credentials private.

For local frontend development, create `frontend/.env`:

```dotenv
NODE_ENV=dev
DEV_BASE_URL=http://localhost:5173
PROD_BASE_URL=https://example.com
```

These are public frontend values, embedded into the browser bundle. The base
URL is used for password-reset links; set it to the address users will open.
The frontend selects `PROD_BASE_URL` when `NODE_ENV` is `prod`, and
`DEV_BASE_URL` otherwise.

## Local development

From the repository root, install dependencies and apply the database migrations:

```sh
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm run migration_run_dev --prefix backend
```

Start the backend and frontend in separate terminals:

```sh
npm run start:dev --prefix backend
```

```sh
npm run dev --prefix frontend
```

Open the URL printed by Vite, normally <http://localhost:5173>. Vite proxies
`/api` requests to the backend on port 3000.

To type-check and build the frontend into `backend/src/app/public`:

```sh
npm run build --prefix frontend
```

## Build and run the Docker image

The development image builds the frontend and serves it from the backend on
port 3000. Separate build stages keep frontend dependencies, backend TypeScript
source, and backend development dependencies out of the final image. The
backend runs compiled JavaScript. From the repository root:

```sh
docker build -f dev.dockerfile -t treasure-dev \
  --build-arg DEV_BASE_URL=http://localhost:3000 \
  --build-arg PROD_BASE_URL=https://example.com \
  .
```

Both URL build arguments are required, even when only one is used. Change them
to the public addresses appropriate for your environment. The optional
`NODE_ENV` build argument defaults to `dev`; setting it to `prod` selects
`PROD_BASE_URL` in the frontend. Build arguments and frontend values are not
secret. Rebuild the image when they change.

The image does not include `.env` files or PostgreSQL. Before running it,
configure `backend/.env.dev` with a database host reachable from the container.
For PostgreSQL running on the host with Docker Desktop, use
`DB_HOST=host.docker.internal` instead of `localhost`. Set `API_PORT=3000`
and `API_STATIC_DIR=public` to match the image.

Build the backend stage to apply migrations, then start the application:

```sh
docker build -f dev.dockerfile --target backend-build -t treasure-migrations .
docker run --rm --env-file backend/.env.dev treasure-migrations \
  npm run migration_run_dev

docker run --rm --name treasure-dev -p 3000:3000 \
  --env-file backend/.env.dev \
  -v treasure-uploads:/app/backend/src/app/public/images \
  treasure-dev
```

Open <http://localhost:3000>. The named volume persists uploaded images across
container restarts when `API_IMG_DIR=images`. The image serves a frontend
snapshot from build time; rebuild it after frontend changes.

The backend currently serves static files without a single-page-app fallback,
so directly opening or refreshing a frontend route such as `/login` may return
404. Start at the root URL instead.

## Tests and lint

```sh
npm test --prefix backend
npm run lint --prefix frontend
npm run lint
```

Backend tests use `backend/.env.test` and require a separately configured test
database.
