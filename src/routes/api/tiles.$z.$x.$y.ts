import { createFileRoute } from "@tanstack/react-router";

// Server-side MapTiler proxy. The key lives in process.env.MAPTILER_KEY
// (runtime secret) and never reaches the browser.
// URL: /api/tiles/{z}/{x}/{y}.png
export const Route = createFileRoute("/api/tiles/$z/$x/$y")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = process.env.MAPTILER_KEY;
        if (!key) {
          return new Response("MAPTILER_KEY not configured", { status: 503 });
        }

        // Validate numeric tile coords + strip optional .png suffix on y.
        const z = Number(params.z);
        const x = Number(params.x);
        const yRaw = String(params.y).replace(/\.png$/i, "");
        const y = Number(yRaw);
        if (
          !Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y) ||
          z < 0 || z > 22 || x < 0 || y < 0
        ) {
          return new Response("Bad tile coords", { status: 400 });
        }

        const upstream = `https://api.maptiler.com/maps/streets-v2/${z}/${x}/${y}.png?key=${key}`;
        const res = await fetch(upstream);
        if (!res.ok) {
          return new Response("Upstream tile error", { status: res.status });
        }
        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Type": res.headers.get("Content-Type") ?? "image/png",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      },
    },
  },
});
