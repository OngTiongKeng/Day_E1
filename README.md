# Snip CLI

Zero-dependency Node.js CLI for the Snip URL shortener. It uses
`http://localhost:3000` by default; set `SNIP_API` to use another backend.

```bash
node cli.js add https://example.com
node cli.js ls
node cli.js open abc123
```

Use `snip`, `snip.cmd`, or `snip.ps1` as platform-friendly wrappers.
