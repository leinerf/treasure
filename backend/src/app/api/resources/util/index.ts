import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { InvalidEntryError } from "../../../../domain/errors/InvalidEntryError.js";
import { EntryExistsError } from "../../../../domain/errors/EntryExistsError.js";
import { EntryNotFoundError } from "../../../../domain/errors/EntryNotFound.js";

const errorWrapper =  (fn: (req: Request, res: Response, next: NextFunction) => Promise<Response>) => {
    return async function(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {
            return await fn(req, res, next);
        } catch (err) {
            if (err instanceof InvalidEntryError || err instanceof EntryExistsError || err instanceof EntryNotFoundError) {
                return res.status(400).json({ error: err.message });
            } else {
                return res.status(500).json({ error: "Internal Server Error" });
            }
        }
    };
};

const createRoutes = (router: Router, resource: { resourcePath: string; routes: { path: string; method: string; controller: (req: Request, res: Response, next: NextFunction) => Promise<Response>; middlewares?: ((req: Request, res: Response, next: NextFunction) => void)[] }[] }) => {
    const routes = resource.routes
    routes.forEach(route => {
        const fullPath = `${resource.resourcePath}${route.path}`;
        const handler = errorWrapper(route.controller);
        const middlewares = route.middlewares || [];
        if (route.method === "get") {
            router.get(fullPath, ...middlewares, handler);
        } else if (route.method === "post") {
            router.post(fullPath, ...middlewares, handler);
        } else if (route.method === "put") {
            router.put(fullPath, ...middlewares, handler);
        } else if (route.method === "delete") {
            router.delete(fullPath, ...middlewares, handler);
        }
    });
};

export { createRoutes };