import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Telegram Reporting API
  app.post("/api/report", async (req, res) => {
    const { message_id, sender_id, receiver_id, reason, text } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Telegram credentials missing in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const telegramMessage = `
🚨 *بلاغ جديد* 🚨
-------------------------
👤 *المُبلّغ عنه:* ${sender_id || 'غير معروف'}
👤 *المُبلّغ:* ${receiver_id || 'غير معروف'}
📝 *السبب:* ${reason}
💬 *محتوى الرسالة:* ${text || 'لا يوجد (بلاغ عن مستخدم)'}
🆔 *معرف الرسالة:* ${message_id || 'لا يوجد'}
-------------------------
📅 *التاريخ:* ${new Date().toLocaleString('ar-EG')}
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Telegram API error");
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending Telegram notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
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
