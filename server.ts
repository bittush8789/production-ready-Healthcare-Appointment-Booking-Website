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

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/send-confirmation", (req, res) => {
    const { patient_name, doctor_name, date, time, email } = req.body;
    
    // Email Template Body
    const subject = "Appointment Confirmation - Green Valley Clinic";
    const body = `Hello ${patient_name}, your appointment with ${doctor_name} is confirmed for ${date} at ${time}. Location: Green Valley Clinic, San Diego. Thank you!`;

    console.log("------------------------------------------");
    console.log(`SENDING EMAIL TO: ${email}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${body}`);
    console.log("------------------------------------------");

    // In a real app, you'd use SendGrid/Nodemailer here.
    // For now, we simulate success.
    res.json({ success: true, message: "Confirmation email sent (simulated)" });
  });

  // Vite middleware for development
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
