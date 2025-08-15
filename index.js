import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { URL } from "url";
import dns from "dns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const urlStore = {};
let nextId = 1;

app.post("/api/shorturl", (req, res) => {
  const input = req.body.url;
  if (!input) {
    return res.status(400).json({ error: "Input is required" });
  }
  if (!/^https:?:\/\//i.test(input)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  let hostname = req.hostname;
  try {
    const parsed = new URL(input);
    hostname = parsed.hostname;
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const existingId = Object.keys(urlStore).find(
      (key) => urlStore[key] === input,
    );

    if (existingId) {
      // URL already in store → return existing short_url
      return res.json({
        original_url: input,
        short_url: Number(existingId),
      });
    }

    const id = nextId++;
    urlStore[id] = input;
    res.json({ original_url: input, short_url: id });
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  const id = req.params.id;
  const originalUrl = urlStore[id];
  if (!originalUrl) {
    return res.status(404).json({ error: "URL not found" });
  }
  res.redirect(originalUrl);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}\nhttp://localhost:${PORT}/`);
});
