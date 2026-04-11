import http from "http";
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer();

const servers = [
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:5003",
];

let current = 0;

const server = http.createServer((req, res) => {
  const target = servers[current];

  current = (current + 1) % servers.length;

  proxy.web(req, res, { target }, (err) => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Server error");
  });
});

server.listen(5000, () => {
  console.log("Load balancer running on port 5000");
});
