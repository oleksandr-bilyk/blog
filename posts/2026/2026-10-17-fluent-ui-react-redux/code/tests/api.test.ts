import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { once } from "node:events";
import type { Server } from "node:http";
import { createApp } from "../server/app";
import { customersSchema, requestsSchema } from "../shared/contracts";

let server: Server;
let base: string;
beforeEach(async () => {
    server = createApp(0, 0).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server port.");
    base = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});
const resolveRequests = (ids: string[], outcome: string) => fetch(`${base}/api/requests/resolve`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, outcome })
});

describe("fictional Node API", () => {
    it("returns validated sample data for every tab and customer", async () => {
        const response = await fetch(`${base}/api/requests`);
        expect(response.headers.get("cache-control")).toBe("no-store");
        const requests = requestsSchema.parse(await response.json());
        const customers = customersSchema.parse(await (await fetch(`${base}/api/customers`)).json());
        expect(requests).toHaveLength(8);
        expect(customers).toHaveLength(3);
        expect(requests.filter(item => item.kind === "Order" && item.status === "Pending")).toHaveLength(3);
        expect(requests.filter(item => item.kind === "Delivery" && item.status === "Pending")).toHaveLength(2);
        expect(requests.every(item => customers.some(customer => customer.name === item.customer))).toBe(true);
    });

    it.each(["Completed", "Rejected"])("persists a bulk %s outcome until restart", async outcome => {
        const response = await resolveRequests(["DEMO-101", "DEMO-104"], outcome);
        expect(response.status).toBe(200);
        const updated = requestsSchema.parse(await response.json());
        expect(updated.every(item => item.status === outcome)).toBe(true);
        const requests = requestsSchema.parse(await (await fetch(`${base}/api/requests`)).json());
        expect(requests.find(item => item.id === "DEMO-101")?.status).toBe(outcome);
        expect(requests.find(item => item.id === "DEMO-102")?.status).toBe("Pending");
    });

    it("rejects an unknown ID without partially updating a batch", async () => {
        expect((await resolveRequests(["DEMO-101", "missing"], "Completed")).status).toBe(404);
        const requests = requestsSchema.parse(await (await fetch(`${base}/api/requests`)).json());
        expect(requests.find(item => item.id === "DEMO-101")?.status).toBe("Pending");
    });

    it("rejects a resolved item without partially updating the remaining items", async () => {
        expect((await resolveRequests(["DEMO-101", "DEMO-106"], "Completed")).status).toBe(409);
        const requests = requestsSchema.parse(await (await fetch(`${base}/api/requests`)).json());
        expect(requests.find(item => item.id === "DEMO-101")?.status).toBe("Pending");
    });

    it.each([
        { ids: [], outcome: "Completed" },
        { ids: ["DEMO-101", "DEMO-101"], outcome: "Completed" },
        { ids: ["DEMO-101"], outcome: "Unknown" },
        { ids: ["DEMO-101"], outcome: "Completed", extra: true }
    ])("rejects malformed resolution $outcome", async body => {
        const response = await fetch(`${base}/api/requests/resolve`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        expect(response.status).toBe(400);
    });

    it("reports invalid JSON and unknown API routes", async () => {
        const response = await fetch(`${base}/api/requests/resolve`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: "{"
        });
        expect(response.status).toBe(400);
        expect((await response.json()).error).toContain("JSON");
        expect((await fetch(`${base}/api/missing`)).status).toBe(404);
    });

    it("saves only supported fictional customer settings", async () => {
        const settings = { deliveryMethod: "Delivery", notificationsEnabled: true };
        const response = await fetch(`${base}/api/customers/customer-1`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings)
        });
        expect(response.status).toBe(200);
        const customers = customersSchema.parse(await (await fetch(`${base}/api/customers`)).json());
        expect(customers[0]).toMatchObject(settings);
        const invalid = await fetch(`${base}/api/customers/customer-1`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...settings, email: "not-supported" })
        });
        expect(invalid.status).toBe(400);
    });
});
