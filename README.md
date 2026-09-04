# Snip

Snip is a tiny URL shortener that demonstrates one backend serving two very
different clients: a browser UI and a terminal CLI. Each layer has its own
orphan branch and is mounted here as a Git submodule.

## Layout

| Path | Branch | Technology |
| --- | --- | --- |
| `backend/` | `backend` | Bun API server |
| `frontend/` | `frontend` | Angular 19 web app |
| `cli/` | `cli` | Zero-dependency Node.js CLI |

`main` is the superproject and pins each submodule to an exact commit.

## API

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/links` | `{ "url": "https://..." }` | `201` link object, or `400` |
| `GET` | `/api/links` | - | `200` array of link objects |
| `GET` | `/:code` | - | `302` redirect and hit increment, or `404` |

A link object contains `code`, `url`, `shortUrl`, `hits`, and `createdAt`.
Links are stored in memory and are cleared when the backend restarts.

## Clone and run

Clone recursively so Git populates all three submodules:

```bash
git clone --recurse-submodules https://github.com/OngTiongKeng/Day_E1.git
cd Day_E1
```

Plain clones leave the submodule directories empty. To populate them later,
run `git submodule update --init --recursive`.

Run the pieces in separate terminals:

```bash
cd backend
bun start
```

```bash
cd frontend
npm install
npx ng serve
```

```bash
cd cli
node cli.js ls
```

The backend listens on port `3000`; the Angular development server uses
port `4200`.

## Updating a layer

Commit and push changes inside the relevant submodule first, then update the
pointer in this superproject:

```bash
cd backend
git add -A
git commit -m "Describe backend change"
git push
cd ..
git submodule update --remote backend
git add backend
git commit -m "Bump backend submodule"
git push
```

Repeat the same workflow for `frontend` or `cli`. The submodule commit and the
superproject pointer update are separate Git records.
