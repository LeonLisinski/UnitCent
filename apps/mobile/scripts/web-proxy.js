// Samo za razvoj na webu: proxy na Expo (8081) koji dodaje COOP/COEP zaglavlja (treba za SharedArrayBuffer / expo-sqlite).
// Pokretanje: node apps/mobile/scripts/web-proxy.js  →  otvori http://localhost:8082
const http = require("http");
const net = require("net");

const TARGET = 8081;
const PORT = 8082;

const server = http.createServer((req, res) => {
  const p = http.request({ host: "127.0.0.1", port: TARGET, path: req.url, method: req.method, headers: req.headers }, (r) => {
    res.writeHead(r.statusCode || 200, {
      ...r.headers,
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "credentialless",
    });
    r.pipe(res);
  });
  p.on("error", () => {
    res.writeHead(502);
    res.end("Expo ne radi na 8081");
  });
  req.pipe(p);
});

// WebSocket (HMR) se samo prosljeđuje.
server.on("upgrade", (req, socket, head) => {
  const up = net.connect(TARGET, "127.0.0.1", () => {
    up.write(`${req.method} ${req.url} HTTP/1.1\r\n` + Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") + "\r\n\r\n");
    if (head && head.length) up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, () => console.log(`Web proxy: http://localhost:${PORT} → ${TARGET}`));
