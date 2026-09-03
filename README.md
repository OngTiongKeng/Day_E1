# Snip backend

Snip is a zero-dependency Bun URL shortener. Links are stored in memory and
are cleared when the server restarts.

```bash
bun start
```

Set `PORT`, `BASE_URL`, or `PUBLIC_DIR` to configure the server. `POST
/api/links` creates links, `GET /api/links` lists them, and `GET /:code`
redirects to the original URL while incrementing its hit count.
