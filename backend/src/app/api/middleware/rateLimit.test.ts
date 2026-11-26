import { once } from "node:events";
import express from "express";
import { describe, expect, test, vi } from "vitest";
import { apiRateLimit } from "./rateLimit.js";

describe("API rate limit", () => {
    test("limits API requests per IP for 15 minutes without limiting non-API routes", async () => {
        const app = express();
        app.use("/api", apiRateLimit);
        app.get("/api/:name", (_req, res) => res.sendStatus(200));
        app.get("/outside", (_req, res) => res.sendStatus(200));
        const server = app.listen(0, "127.0.0.1");
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
        try {
            await once(server, "listening");
            const address = server.address();
            if (!address || typeof address === "string") {
                throw new Error("Expected a TCP server address");
            }
            const base = `http://127.0.0.1:${address.port}`;

            for (let i = 0; i < 100; i++) {
                const response = await fetch(`${base}/api/${i % 2 ? "other" : "test"}`);
                expect(response.status).toBe(200);
            }
            vi.setSystemTime(new Date("2030-01-01T00:14:59Z"));
            const blocked = await fetch(`${base}/api/test`);
            expect(blocked.status).toBe(429);
            expect(blocked.headers.get("retry-after")).toBe("1");
            expect(await blocked.json()).toEqual({ error: "Too many requests, please try again later." });
            expect((await fetch(`${base}/outside`)).status).toBe(200);
            vi.setSystemTime(new Date("2030-01-01T00:15:00Z"));
            expect((await fetch(`${base}/api/test`)).status).toBe(200);
        } finally {
            vi.useRealTimers();
            await new Promise<void>((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
    });
});
