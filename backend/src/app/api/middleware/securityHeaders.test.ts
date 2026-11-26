import { once } from "node:events";
import express from "express";
import { describe, expect, test, vi } from "vitest";
import { contentSecurityPolicyDirectives, s3ImageOrigin, securityHeaders } from "./securityHeaders.js";

vi.mock("../../../config.js", () => ({
    config: { env: "test", aws_s3_bucket_name: "photos-bucket", aws_s3_region: "us-east-1" }
}));

const fetchHeaders = async (): Promise<Headers> => {
    const app = express();
    app.use(securityHeaders);
    app.get("/", (_req, res) => res.send("ok"));
    const server = app.listen(0, "127.0.0.1");
    try {
        await once(server, "listening");
        const address = server.address();
        if (!address || typeof address === "string") {
            throw new Error("Expected a TCP server address");
        }
        return (await fetch(`http://127.0.0.1:${address.port}/`)).headers;
    } finally {
        server.close();
    }
};

const directive = (policy: string, name: string): string[] | undefined =>
    policy.split(";").map((part) => part.trim().split(/\s+/)).find(([key]) => key === name)?.slice(1);

describe("security headers", () => {
    test("allow scripts, styles and requests only from this server", async () => {
        const policy = (await fetchHeaders()).get("content-security-policy") ?? "";
        expect(directive(policy, "default-src")).toEqual(["'self'"]);
        expect(directive(policy, "script-src")).toEqual(["'self'"]);
        expect(directive(policy, "script-src-attr")).toEqual(["'none'"]);
        expect(directive(policy, "style-src")).toEqual(["'self'"]);
        expect(directive(policy, "connect-src")).toEqual(["'self'"]);
        expect(directive(policy, "object-src")).toEqual(["'none'"]);
        expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
        expect(policy).not.toContain("unsafe-inline");
        expect(policy).not.toContain("unsafe-eval");
    });

    test("allow images from this server, upload previews and the S3 bucket only", async () => {
        const policy = (await fetchHeaders()).get("content-security-policy") ?? "";
        expect(directive(policy, "img-src")).toEqual(["'self'", "data:", "blob:", "https://photos-bucket.s3.us-east-1.amazonaws.com"]);
    });

    test("set the other protective headers and hide the framework", async () => {
        const headers = await fetchHeaders();
        expect(headers.get("x-content-type-options")).toBe("nosniff");
        expect(headers.get("x-frame-options")).toBe("SAMEORIGIN");
        expect(headers.get("referrer-policy")).toBe("no-referrer");
        expect(headers.get("strict-transport-security")).toContain("max-age=");
        expect(headers.get("x-powered-by")).toBeNull();
    });

    test("upgrade insecure requests only in production", () => {
        expect(contentSecurityPolicyDirectives(s3ImageOrigin("b", "r"), true).upgradeInsecureRequests).toEqual([]);
        expect(contentSecurityPolicyDirectives(s3ImageOrigin("b", "r"), false).upgradeInsecureRequests).toBeNull();
    });
});
