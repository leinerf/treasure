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
APP_BASE_URL=http://localhost:5173
API_HOST=localhost
API_PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
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
exist. `APP_BASE_URL` is the address users open the app at; password-reset emails
link to it. Configure a Gmail address and app password for email features. Keep this
file and its credentials private.

Authentication uses 15-minute bearer access tokens and seven-day refresh tokens.
The browser keeps the access token in memory and the refresh token in an
HttpOnly, SameSite=Strict cookie scoped to `/api/auth`; the cookie is Secure
when `NODE_ENV` is `prod` or `production`. Existing sessions must sign in again
after this change.

Each refresh token is recorded in the `refresh_token` table and is rotated
(replaced by a new refresh token) on every refresh. Only refresh tokens are
rotated: each refresh also issues a brand-new access token, and the previous
access token is not tracked and simply expires. Logout revokes the current session; changing or resetting a
password, or an admin deleting the account, revokes all of the user's sessions
(a password change keeps the browser that made it signed in). Changing the email
revokes nothing: sessions signed in before the change stay valid until they
expire or sign out, although the change itself requires the current password. If a rotated
refresh token is presented more than 30 seconds after rotation, it is treated
as stolen and all of that user's sessions are revoked; within those 30 seconds
it still yields an access token, so tabs refreshing at the same moment do not
sign each other out. Access tokens are not tracked, so an access token issued
before a revocation stays valid until it expires. Newly issued tokens last 15
minutes; tokens issued before the lifetime change retain their original expiry.

`GET /api/test` is the health check: it reports whether the API and database are up
and ignores sign-in. To check a session, call `GET /api/auth/status`. It
reports whether each token is present and usable, never the tokens themselves:

```json
{ "accessToken": { "present": true, "valid": true },
  "refreshToken": { "present": true, "valid": true } }
```

To check both tokens, use Postman with the backend running:

1. Send `POST http://localhost:3000/api/auth/login` with a raw JSON body:
   `{ "username": "<your username>", "password": "<your password>" }`.
   Copy `accessToken` from the response. Postman stores the `refreshToken`
   cookie from the response automatically.
2. Send `GET http://localhost:3000/api/auth/status`. On the **Authorization**
   tab, choose **Bearer Token** and paste the access token. Postman sends the
   stored refresh cookie with it.

Both tokens should show `"present": true, "valid": true`. Without the Bearer
token, `accessToken` shows `"present": false`: the access token is only sent in
the `Authorization` header, so opening the URL in a browser tab can't report it.
The check is read-only: it never rotates the refresh token or triggers reuse
detection.

The admin user-list endpoint accepts a page `limit` from 1 to 100; larger
limits are rejected with a 400 response.

Emails are stored and compared in lowercase with surrounding spaces removed, so
`Alice@Example.com` and `alice@example.com` are the same account. A database
check constraint rejects any email that is not lowercase; the migration that adds
it lowercases existing emails and stops if two accounts differ only by case.

Registration and email changes confirm the address with a 6-digit code that
expires after 10 minutes. Each code allows 5 submissions, right or wrong; the
5th wrong one deletes it and the user requests a new code. Submissions are
counted before the code is compared, so simultaneous guesses can't get extra
tries, and codes are compared in constant time. That leaves a guesser about 5 in
900,000 per code, and each new code sends the owner another email.

Password resets use emailed links. Requesting a reset always returns the same
response, whether or not an account uses the email, so the endpoint does not
reveal which emails are registered. The response is sent before the account is
looked up, so existing and unknown emails also answer equally fast. Each IP
address may request 5 resets per hour. For an existing account the backend emails
a link to `APP_BASE_URL/password-reset#token=...`, built from its own
configuration rather than the request. The token is 256 bits of randomness and
only its SHA-256 hash is stored in the `password_reset` table. It sits in the
URL fragment, so browsers do not send it to servers or in `Referer` headers, and
the page removes it from the address bar once read.

A link expires after 30 minutes and works once. Using one link invalidates the
account's other outstanding links, and a link stops working if the account's
email changes after it was sent. Requesting a new link does not cancel earlier
ones, so a third party requesting resets cannot invalidate the link the owner is
about to use. Each account receives at most 3 reset emails per hour; further
requests get the same response and send nothing. Because tokens cannot be
guessed, wrong submissions are not counted per account and cannot lock the owner
out; the API-wide per-IP limit below still applies. Reset codes issued before
the link-token migration no longer work and must be requested again.

After a password is reset or changed, the account's email receives a notice that
links to the reset page, so a change the owner didn't make doesn't go unnoticed.
Notices and reset emails are sent without making the request wait; a failed send
is logged with the user's id, never their email address.

Once an hour, and when the server starts, expired rows are deleted from
`refresh_token`, `password_reset` and `email_verification`. Only rows past their
`expires_at` are removed: rotated refresh tokens are kept until they expire,
because refresh token reuse detection needs them.

API routes allow 100 requests per IP address per 15 minutes; exceeding the
limit returns HTTP 429 with a `Retry-After` header. The limit is stored in
memory, so it resets on restart and is not shared across instances. This
configuration assumes the backend is not behind a reverse proxy; if deployed
behind one, configure Express to trust only the actual proxy before relying on
client IP addresses.

A failed login returns `Invalid username or password` whether the username is
unknown or the password is wrong, and both take the same time: an unknown
username is still checked against a dummy bcrypt hash, so response time doesn't
reveal which usernames exist. Each username and IP address together may fail to
log in 5 times per 15 minutes; after that, login from that IP for that username
returns HTTP 429 until the window passes. Successful logins don't count. Because
the limit is per IP as well as per username, someone guessing a password can't
lock the owner out of signing in from their own network. An attacker spreading
guesses across many IP addresses is only slowed per IP; a per-account cap across
all IPs, or a second factor, would be the next step.

Every backend response carries security headers set by `helmet`
(`backend/src/app/api/middleware/securityHeaders.ts`). The Content-Security-Policy
lets the built frontend load scripts, styles, fonts and API requests only from its
own origin, with no inline scripts, `eval` or inline event handlers, and images only
from itself, `data:` and `blob:` URLs, and the S3 bucket. If injected code reaches
the page, the browser refuses to run it or send data elsewhere. When the frontend
starts loading something from another origin (a font, analytics, an API), add that
origin to the matching directive. The policy applies when Express serves the built
frontend; the Vite dev server on port 5173 does not send it.

Profile photo uploads accept one image of at most 5 MB; larger files get HTTP 413.
The disk upload route takes only JPEG, PNG, WebP or GIF images and stores each under
a server-generated name, never the name the client sent.

For local frontend development, create `frontend/.env`:

```dotenv
VITE_APP_ENV=dev
VITE_DEV_BASE_URL=http://localhost:5173
VITE_PROD_BASE_URL=https://example.com
```

These are public frontend values, embedded into the browser bundle; Vite only
exposes variables prefixed with `VITE_`, so never put secrets here. Password-reset
links use the backend's `APP_BASE_URL`, not these values. The frontend selects `VITE_PROD_BASE_URL` when `VITE_APP_ENV` is `prod`, and
`VITE_DEV_BASE_URL` otherwise.

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

The backend falls back to `index.html` for paths that are not API routes or
static files, so frontend routes such as `/login` can be opened or refreshed
directly.

## Tests and lint

```sh
npm test --prefix backend
npm run lint --prefix frontend
npm run lint
```

Backend tests use `backend/.env.test` and require a separately configured test
database.

To run the frontend authentication tests using the backend's Vitest installation:

```sh
cd backend
npx vitest --root ../frontend --config ../backend/vitest.config.js --run test/internalAPI.test.ts
```
