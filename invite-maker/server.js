/*
 * LIBESOLE INVITE MAKER
 *
 * A small local web app: fill in the form, preview the animation and
 * create a finished 1080 × 1920 MP4 invitation.
 *
 * Start it by double-clicking "Start Invite Maker.bat".
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");
const puppeteer = require("puppeteer-core");

const PORT = 4321;
const FPS = 30;
const ROOT = __dirname;
const JOBS_DIR = path.join(ROOT, "jobs");
const OUTPUT_DIR = path.join(ROOT, "output");
const SITE_IMAGES = path.join(ROOT, "..", "images");

fs.mkdirSync(JOBS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });


/* ---------- Find Edge / Chrome and ffmpeg ---------- */

function findBrowser() {
    const candidates = [
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    ];
    return candidates.find((p) => fs.existsSync(p));
}

function findFfmpeg() {
    try {
        const found = execSync("where ffmpeg", { stdio: ["ignore", "pipe", "ignore"] }).toString().split(/\r?\n/)[0].trim();
        if (found) return found;
    } catch (error) { /* not on PATH */ }

    const wingetRoot = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
    if (fs.existsSync(wingetRoot)) {
        for (const pkg of fs.readdirSync(wingetRoot).filter((d) => /ffmpeg/i.test(d))) {
            const pkgDir = path.join(wingetRoot, pkg);
            for (const build of fs.readdirSync(pkgDir)) {
                const exe = path.join(pkgDir, build, "bin", "ffmpeg.exe");
                if (fs.existsSync(exe)) return exe;
            }
        }
    }
    return null;
}

const BROWSER = findBrowser();
const FFMPEG = findFfmpeg();


/* ---------- Static files ---------- */

const TYPES = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
    ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".mp4": "video/mp4", ".json": "application/json"
};

function sendFile(res, filePath, extraHeaders = {}) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404);
        return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream", ...extraHeaders });
    fs.createReadStream(filePath).pipe(res);
}

/* Only serve files inside a given folder */
function safeJoin(base, relative) {
    const full = path.normalize(path.join(base, relative));
    return full.startsWith(base) ? full : null;
}

function sendJson(res, status, body) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
}

function readBody(req, limit = 300 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on("data", (chunk) => {
            size += chunk.length;
            if (size > limit) {
                reject(new Error("Upload too large"));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}


/* ---------- Jobs ---------- */

const jobs = new Map();
const queue = [];
let rendering = false;

/* "data:image/jpeg;base64,..." → file on disk, returns the public URL */
function saveDataUrl(dataUrl, jobDir, jobId, baseName) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
    if (!match) return null;
    const ext = {
        "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
        "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a",
        "audio/wav": ".wav", "audio/x-wav": ".wav", "audio/aac": ".aac", "audio/ogg": ".ogg"
    }[match[1]] || ".bin";
    const fileName = baseName + ext;
    fs.writeFileSync(path.join(jobDir, fileName), Buffer.from(match[2], "base64"));
    return { url: `/jobs/${jobId}/${fileName}`, file: path.join(jobDir, fileName) };
}

function slug(text) {
    return String(text || "").normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "invite";
}

function createJob(payload) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const jobDir = path.join(JOBS_DIR, id);
    fs.mkdirSync(jobDir, { recursive: true });

    const data = { ...payload.data };

    const couple = saveDataUrl(payload.couplePhoto, jobDir, id, "couple");
    data.couplePhoto = couple ? couple.url : null;

    data.gallery = (payload.gallery || [])
        .map((src, i) => saveDataUrl(src, jobDir, id, `gallery-${i + 1}`))
        .filter(Boolean)
        .map((saved) => saved.url);

    const music = saveDataUrl(payload.music, jobDir, id, "music");

    const name = `${slug(data.groom)}-${slug(data.bride)}-${new Date().toISOString().slice(0, 10)}-${id.slice(-4)}.mp4`;

    const job = { id, data, musicFile: music ? music.file : null, state: "queued", progress: 0, output: name, error: null };
    fs.writeFileSync(path.join(jobDir, "details.json"), JSON.stringify(data, null, 2));
    jobs.set(id, job);
    queue.push(job);
    processQueue();
    return job;
}

async function processQueue() {
    if (rendering || !queue.length) return;
    rendering = true;
    const job = queue.shift();
    try {
        await renderJob(job);
        job.state = "done";
        job.progress = 1;
    } catch (error) {
        console.error(error);
        job.state = "error";
        job.error = error.message;
    }
    rendering = false;
    processQueue();
}

async function renderJob(job) {
    if (!BROWSER) throw new Error("Microsoft Edge or Google Chrome was not found on this computer.");
    if (!FFMPEG) throw new Error("ffmpeg was not found. Install it with: winget install Gyan.FFmpeg");

    job.state = "rendering";
    const outFile = path.join(OUTPUT_DIR, job.output);

    const browser = await puppeteer.launch({
        executablePath: BROWSER,
        headless: true,
        args: ["--hide-scrollbars", "--force-device-scale-factor=1", "--disable-gpu"]
    });

    let ffmpeg;
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
        await page.goto(`http://localhost:${PORT}/template.html`, { waitUntil: "networkidle0", timeout: 60000 });

        const duration = await page.evaluate((d) => window.setupInvite(d), job.data);
        const totalFrames = Math.ceil(duration * FPS);
        const stage = await page.$("#stage");

        const args = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-"];

        if (job.musicFile) {
            const fadeStart = Math.max(0, duration - 2.5).toFixed(2);
            args.push("-i", job.musicFile,
                "-filter_complex", `[1:a]afade=t=in:st=0:d=1,afade=t=out:st=${fadeStart}:d=2.5[a]`,
                "-map", "0:v", "-map", "[a]");
        } else {
            args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-map", "0:v", "-map", "1:a");
        }

        args.push("-t", duration.toFixed(2),
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", outFile);

        ffmpeg = spawn(FFMPEG, args, { stdio: ["pipe", "ignore", "pipe"] });
        let ffmpegLog = "";
        ffmpeg.stderr.on("data", (chunk) => { ffmpegLog = (ffmpegLog + chunk).slice(-4000); });
        const finished = new Promise((resolve, reject) => {
            ffmpeg.on("close", (code) => code === 0 ? resolve() : reject(new Error("ffmpeg failed: " + ffmpegLog)));
        });

        for (let frame = 0; frame < totalFrames; frame += 1) {
            await page.evaluate((t) => window.renderAt(t), frame / FPS);
            const image = await stage.screenshot({ type: "jpeg", quality: 92 });
            if (!ffmpeg.stdin.write(image)) {
                await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
            }
            job.progress = frame / totalFrames;
        }

        ffmpeg.stdin.end();
        job.state = "encoding";
        await finished;
    } finally {
        await browser.close().catch(() => {});
    }
}


/* ---------- HTTP server ---------- */

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const route = decodeURIComponent(url.pathname);

    try {
        if (req.method === "GET" && (route === "/" || route === "/form.html")) {
            return sendFile(res, path.join(ROOT, "form.html"));
        }
        if (req.method === "GET" && route === "/template.html") {
            return sendFile(res, path.join(ROOT, "template.html"));
        }
        if (req.method === "GET" && route.startsWith("/assets/")) {
            const file = safeJoin(SITE_IMAGES, route.slice("/assets/".length));
            return file ? sendFile(res, file) : sendJson(res, 403, { error: "Forbidden" });
        }
        if (req.method === "GET" && route.startsWith("/jobs/")) {
            const file = safeJoin(JOBS_DIR, route.slice("/jobs/".length));
            return file ? sendFile(res, file) : sendJson(res, 403, { error: "Forbidden" });
        }
        if (req.method === "GET" && route.startsWith("/output/")) {
            const file = safeJoin(OUTPUT_DIR, route.slice("/output/".length));
            const download = url.searchParams.has("download") ? { "Content-Disposition": `attachment; filename="${path.basename(file)}"` } : {};
            return file ? sendFile(res, file, download) : sendJson(res, 403, { error: "Forbidden" });
        }
        if (req.method === "POST" && route === "/api/render") {
            const payload = JSON.parse((await readBody(req)).toString("utf8"));
            const job = createJob(payload);
            return sendJson(res, 200, { id: job.id });
        }
        if (req.method === "GET" && route.startsWith("/api/status/")) {
            const job = jobs.get(route.split("/").pop());
            if (!job) return sendJson(res, 404, { error: "Unknown job" });
            return sendJson(res, 200, {
                state: job.state, progress: job.progress, error: job.error,
                file: job.state === "done" ? `/output/${job.output}` : null, name: job.output,
                queued: job.state === "queued" ? queue.indexOf(job) + 1 : 0
            });
        }
        if (req.method === "POST" && route === "/api/open-output") {
            spawn("explorer.exe", [OUTPUT_DIR], { detached: true, stdio: "ignore" }).unref();
            return sendJson(res, 200, { ok: true });
        }

        res.writeHead(404);
        res.end("Not found");
    } catch (error) {
        console.error(error);
        sendJson(res, 500, { error: error.message });
    }
});

server.listen(PORT, "127.0.0.1", () => {
    console.log("");
    console.log("  ✿ Libesole Invite Maker is running");
    console.log(`  → Open http://localhost:${PORT} in your browser`);
    console.log("  → Keep this window open while you work. Close it to stop.");
    console.log("");
    if (!BROWSER) console.log("  ! Microsoft Edge / Chrome not found");
    if (!FFMPEG) console.log("  ! ffmpeg not found (winget install Gyan.FFmpeg)");
});
