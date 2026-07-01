import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_PREFIXES = ["image/", "audio/", "video/"];
const ALLOWED_MIME_EXACT = ["application/pdf"];

const isAllowedMime = (mimetype) =>
  ALLOWED_MIME_PREFIXES.some((prefix) => mimetype.startsWith(prefix)) || ALLOWED_MIME_EXACT.includes(mimetype);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMime(file.mimetype)) {
      cb(new Error("Tipo de arquivo nao permitido."));
      return;
    }
    cb(null, true);
  },
});
