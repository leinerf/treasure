import helmet from "helmet";
import { config } from "../../../config.js";

/** Host that S3 presigned photo URLs point at, e.g. my-bucket.s3.us-east-1.amazonaws.com. */
export const s3ImageOrigin = (bucket: string, region: string): string =>
    `https://${bucket}.s3.${region}.amazonaws.com`;

/**
 * Content-Security-Policy for the built frontend this server hosts. The browser refuses
 * anything not listed, so an injected script can't load or run, and can't send data
 * (such as the in-memory access token) to another site. When the frontend starts
 * loading something new (a font, an analytics script, an API on another host), add its
 * origin to the matching directive here.
 */
export const contentSecurityPolicyDirectives = (imageOrigin: string, production: boolean) => ({
    defaultSrc: ["'self'"],
    // Only the bundled scripts. No inline <script>, no eval, no inline event handlers.
    scriptSrc: ["'self'"],
    scriptSrcAttr: ["'none'"],
    // Only the bundled stylesheet. React's style={{}} props are still allowed: they set styles through the DOM, not markup.
    styleSrc: ["'self'"],
    // blob: is for previews of a photo before it's uploaded; the S3 origin is for stored profile photos.
    imgSrc: ["'self'", "data:", "blob:", imageOrigin],
    fontSrc: ["'self'"],
    // fetch/XHR may only reach this server, which blocks sending stolen data to an attacker's host.
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    // Upgrading http:// requests to https:// would break local development over plain http.
    upgradeInsecureRequests: production ? [] : null,
});

const production = config.env === "production" || config.env === "prod";

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: contentSecurityPolicyDirectives(s3ImageOrigin(config.aws_s3_bucket_name, config.aws_s3_region), production),
    },
});
