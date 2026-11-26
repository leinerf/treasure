import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { afterAll, describe, expect, test, vi } from "vitest";

// Point the upload folder at a temporary directory: fileUpload.ts joins the app directory,
// API_STATIC_DIR and API_IMG_DIR, so API_STATIC_DIR is the temp dir relative to the app directory.
const paths = vi.hoisted(() => {
    const nodePath = require("node:path") as typeof import("node:path");
    const nodeFs = require("node:fs") as typeof import("node:fs");
    const nodeOs = require("node:os") as typeof import("node:os");
    const root = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "treasure-upload-"));
    const appDir = nodePath.dirname(nodePath.dirname(__dirname));
    return { root, staticDir: nodePath.relative(appDir, root) };
});

vi.mock("../../../config.js", () => ({ config: { api_static_dir: paths.staticDir, api_img_dir: "images" } }));
vi.mock("../../../domain/services/tokenService.js", () => ({ TokenService: { userIdFromAccessToken: () => "user-1" } }));

const { generateUploadFilename, IMAGE_EXTENSIONS, MAX_UPLOAD_BYTES, uploadSingleImage, bufferUploadSingle } = await import("./fileUpload.js");

const userDir = path.join(paths.root, "images", "user-1");

afterAll(() => fs.rmSync(paths.root, { recursive: true, force: true }));

type Stored = { file: { filename: string; path: string } | null; error?: string };

/** Uploads files through the real upload middleware and returns the status and what was stored. */
const uploadFile = async (
    filename: string, type: string,
    { bytes = 32, middleware = uploadSingleImage("profile"), count = 1 }: { bytes?: number; middleware?: express.RequestHandler; count?: number } = {}
): Promise<{ status: number; body: Stored }> => {
    const app = express();
    app.post("/upload", (_req, res, next) => { res.locals.accessToken = "token"; next(); }, middleware,
        (req, res) => res.json({ file: req.file ? { filename: req.file.filename, path: req.file.path } : null }));
    const server = app.listen(0, "127.0.0.1");
    try {
        await once(server, "listening");
        const address = server.address();
        if (!address || typeof address === "string") throw new Error("Expected a TCP server address");
        const form = new FormData();
        for (let i = 0; i < count; i++) {
            form.append("profile", new Blob([new Uint8Array(bytes)], { type }), filename);
        }
        const response = await fetch(`http://127.0.0.1:${address.port}/upload`, { method: "POST", body: form });
        return { status: response.status, body: (await response.json()) as Stored };
    } finally {
        server.close();
    }
};

describe("generateUploadFilename", () => {
    test("names allowed images with a timestamp, a random id and the type's extension", () => {
        expect(generateUploadFilename("image/png")).toMatch(/^\d+-[0-9a-f-]{36}\.png$/);
        expect(generateUploadFilename("image/jpeg")).toMatch(/\.jpg$/);
        expect(generateUploadFilename("image/png")).not.toBe(generateUploadFilename("image/png"));
    });

    test("refuses other types, including names of inherited object properties", () => {
        for (const type of ["text/html", "application/javascript", "image/svg+xml", "constructor", "__proto__", ""]) {
            expect(generateUploadFilename(type)).toBeNull();
        }
        expect([...IMAGE_EXTENSIONS.values()]).toEqual([".jpg", ".png", ".webp", ".gif"]);
    });
});

describe("disk upload", () => {
    test("stores the file under a generated image name, ignoring the client's name and extension", async () => {
        const { body: { file } } = await uploadFile("evil.html", "image/png");
        expect(file?.filename).toMatch(/^\d+-[0-9a-f-]{36}\.png$/);
        expect(file?.filename).not.toContain("evil");
        expect(path.dirname(file!.path)).toBe(userDir);
        expect(fs.readdirSync(userDir).some((name) => name.endsWith(".html"))).toBe(false);
    });

    test("keeps a path in the client's name from leaving the user's folder", async () => {
        const { body: { file } } = await uploadFile("../../../evil.js", "image/jpeg");
        expect(path.dirname(file!.path)).toBe(userDir);
        expect(file?.filename).toMatch(/\.jpg$/);
    });

    test("accepts an image of exactly the size limit", async () => {
        const { status, body } = await uploadFile("photo.png", "image/png", { bytes: MAX_UPLOAD_BYTES });
        expect(status).toBe(200);
        expect(fs.statSync(body.file!.path).size).toBe(MAX_UPLOAD_BYTES);
    });

    test("rejects an image over the size limit with 413 and keeps no partial file", async () => {
        const before = fs.existsSync(userDir) ? fs.readdirSync(userDir).length : 0;
        const { status, body } = await uploadFile("big.png", "image/png", { bytes: MAX_UPLOAD_BYTES + 1 });
        expect(status).toBe(413);
        expect(body.error).toBe("Image must be 5 MB or smaller");
        expect(fs.existsSync(userDir) ? fs.readdirSync(userDir).length : 0).toBe(before);
    });

    test("rejects more than one file with 400", async () => {
        const { status, body } = await uploadFile("photo.png", "image/png", { count: 2 });
        expect(status).toBe(400);
        expect(body.error).toBe('Upload one image in the "profile" field');
    });

    test("skips files that aren't an allowed image type", async () => {
        const before = fs.existsSync(userDir) ? fs.readdirSync(userDir).length : 0;
        const { body: { file } } = await uploadFile("page.html", "text/html");
        expect(file).toBeNull();
        expect(fs.existsSync(userDir) ? fs.readdirSync(userDir).length : 0).toBe(before);
    });
});

describe("in-memory upload for S3", () => {
    test("rejects a file over the size limit with 413 before buffering it all", async () => {
        const { status, body } = await uploadFile("big.png", "image/png", { bytes: MAX_UPLOAD_BYTES + 1, middleware: bufferUploadSingle("profile") });
        expect(status).toBe(413);
        expect(body.error).toBe("Image must be 5 MB or smaller");
    });

    test("accepts a file within the limit", async () => {
        const { status } = await uploadFile("photo.png", "image/png", { middleware: bufferUploadSingle("profile") });
        expect(status).toBe(200);
    });
});
