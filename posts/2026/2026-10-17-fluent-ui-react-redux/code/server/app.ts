import express, { type ErrorRequestHandler } from "express";
import { setTimeout } from "node:timers/promises";
import { customerSettingsSchema, resolveRequestsSchema } from "../shared/contracts";
import { createCustomers, createRequests } from "./data";

export function createApp(loadDelayMs = 5000, mutationDelayMs = 250) {
    const app = express();
    const requests = createRequests();
    const customers = createCustomers();
    app.disable("x-powered-by");
    app.use("/api", express.json({ limit: "4kb" }));
    app.use("/api", async (request, response, next) => {
        response.setHeader("Cache-Control", "no-store");
        if (request.method !== "GET" && request.method !== "HEAD") await setTimeout(mutationDelayMs);
        next();
    });

    app.get("/api/requests", async (_request, response) => {
        await setTimeout(loadDelayMs);
        response.json(requests);
    });

    app.get("/api/customers", (_request, response) => response.json(customers));
    app.patch("/api/customers/:id", (request, response) => {
        const parsed = customerSettingsSchema.safeParse(request.body);
        if (!parsed.success) {
            response.status(400).json({ error: "Provide a delivery method and a boolean notifications setting." });
            return;
        }
        const customer = customers.find(item => item.id === request.params.id);
        if (!customer) {
            response.status(404).json({ error: "That demo customer does not exist." });
            return;
        }
        Object.assign(customer, parsed.data);
        response.json(customer);
    });

    app.post("/api/requests/resolve", (request, response) => {
        const parsed = resolveRequestsSchema.safeParse(request.body);
        if (!parsed.success) {
            response.status(400).json({ error: "Provide unique request IDs and an outcome of Completed or Rejected." });
            return;
        }
        const items = requests.filter(candidate => parsed.data.ids.includes(candidate.id));
        if (items.length !== parsed.data.ids.length) {
            response.status(404).json({ error: "One or more demo requests do not exist." });
            return;
        }
        if (items.some(item => item.status !== "Pending")) {
            response.status(409).json({ error: "Only pending demo requests can be completed or rejected. Refresh and retry." });
            return;
        }
        for (const item of items) {
            item.status = parsed.data.outcome;
            item.updatedAt = new Date().toISOString();
        }
        response.json(items);
    });

    app.use("/api", (_request, response) => {
        response.status(404).json({ error: "Unknown demo API route." });
    });

    const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
        if (error instanceof SyntaxError && "body" in error) {
            response.status(400).json({ error: "Request body must be valid JSON." });
            return;
        }
        if (error?.type === "entity.too.large") {
            response.status(413).json({ error: "Request body is too large." });
            return;
        }
        console.error("Mock API request failed:", error);
        response.status(500).json({ error: "The mock API could not handle this request." });
    };
    app.use(handleError);
    return app;
}
