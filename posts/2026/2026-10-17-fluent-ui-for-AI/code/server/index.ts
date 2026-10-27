import express from "express";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
}

const app = createApp();
const production = process.argv.includes("--production");
let closeVite: (() => Promise<void>) | undefined;

if (production) {
    const index = fileURLToPath(new URL("../dist/index.html", import.meta.url));
    await access(index);
    app.use(express.static(fileURLToPath(new URL("../dist", import.meta.url))));
    app.get("/", (_request, response) => response.sendFile(index));
} else {
    const { createServer } = await import("vite");
    const vite = await createServer({
        root,
        server: { middlewareMode: true },
        appType: "spa"
    });
    app.use(vite.middlewares);
    closeVite = () => vite.close();
}

const server = app.listen(port, "127.0.0.1", () => {
    console.log(`Fluent demo: http://127.0.0.1:${port} (${production ? "production" : "development"})`);
    console.log("Fictional, in-memory data only. Restart the server to reset the demo.");
});
server.on("error", error => {
    console.error("Unable to start Fluent demo:", error);
    process.exitCode = 1;
    void closeVite?.();
});

async function shutdown() {
    server.close();
    server.closeAllConnections();
    await closeVite?.();
}
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
