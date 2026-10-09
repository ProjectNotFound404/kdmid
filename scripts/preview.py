from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parent.parent


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/__chrome_preview.js":
            content = (root / "tests/fixtures/chrome-preview.js").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript; charset=utf-8")
            self.end_headers()
            self.wfile.write(content)
        elif self.path in ("/people.html", "/popup.html"):
            content = (root / "extension" / self.path.lstrip("/")).read_text()
            content = content.replace("<head>", '<head><script src="/__chrome_preview.js"></script>', 1)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(content.encode())
        else:
            super().do_GET()


server = ThreadingHTTPServer(("127.0.0.1", 8766), partial(Handler, directory=root / "extension"))
print("UI-only preview: http://127.0.0.1:8766/people.html", flush=True)
server.serve_forever()
