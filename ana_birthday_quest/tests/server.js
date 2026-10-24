const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 31425;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

process.on('uncaughtException', (err) => {
    fs.appendFileSync(path.join(__dirname, 'server_error.log'), `[UncaughtException] ${err.stack || err}\n`);
    console.error('[Server UncaughtException]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    fs.appendFileSync(path.join(__dirname, 'server_error.log'), `[UnhandledRejection] ${reason}\n`);
    console.error('[Server UnhandledRejection]', reason);
});

process.on('exit', (code) => {
    fs.appendFileSync(path.join(__dirname, 'server_error.log'), `[Process Exit] code: ${code}\n`);
});

process.on('SIGINT', () => {
    fs.appendFileSync(path.join(__dirname, 'server_error.log'), `[SIGINT]\n`);
});

process.on('SIGTERM', () => {
    fs.appendFileSync(path.join(__dirname, 'server_error.log'), `[SIGTERM]\n`);
});

const server = http.createServer((req, res) => {
    req.on('error', (err) => console.error('[Req Error]', err));
    res.on('error', (err) => console.error('[Res Error]', err));

    try {
        let rawUrl = (req.url || '/').split('?')[0];
        let safeUrl = rawUrl;
        try {
            safeUrl = decodeURI(rawUrl);
        } catch (e) {
            safeUrl = rawUrl;
        }

        let filePath = path.normalize(path.join(ROOT_DIR, safeUrl));

        // Security check: ensure path stays inside ROOT_DIR
        if (!filePath.startsWith(ROOT_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        if (filePath.endsWith(path.sep)) {
            filePath = path.join(filePath, 'index.html');
        } else {
            try {
                if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                    filePath = path.join(filePath, 'index.html');
                }
            } catch (e) {}
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (res.writableEnded) return;
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Server Error: ${err.code}`);
                }
            } else {
                if (res.writableEnded) return;
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, {
                    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                });
                res.end(content);
            }
        });
    } catch (err) {
        console.error('[Handler Error]', err);
        if (!res.writableEnded) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        }
    }
});

server.on('error', (err) => {
    console.error('[Server Error]', err);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
});

// Heartbeat to keep process actively alive
setInterval(() => {}, 60000);
