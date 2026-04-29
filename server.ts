import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Root level API check
  app.get("/api-check", (req, res) => {
    res.json({ message: "API check ok" });
  });

  // API Router
  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/health", (req, res) => {
    console.log("Health check requested");
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Proxy route for payment API to bypass CORS
  apiRouter.post(["/proxy-payment", "/proxy-payment/"], async (req, res) => {
    try {
      console.log("Received payment proxy request:", req.body);
      const response = await fetch(
        "https://payment.escaliagora.com.br/api/v1/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        },
      );

      const data = await response.json();
      console.log("Payment API response status:", response.status);

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error: any) {
      debugger;
      console.error("Proxy payment error:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error", message: error.message });
    }
  });

  // Root for API
  app.use("/api", apiRouter);

  // Catch-all for API that didn't match
  app.all("/api/*", (req, res) => {
    console.log(`Unmatched API request: ${req.method} ${req.url}`);
    res
      .status(404)
      .json({ error: "Not Found", message: `API route ${req.url} not found` });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
