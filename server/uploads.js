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

const MAX_DATA_URL_BYTES = 10 * 1024 * 1024;

const EXTENSION_BY_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export const isAllowedDocumentMime = (mimetype) => mimetype.startsWith("image/") || mimetype === "application/pdf";

// Usado apenas no cadastro (POST /api/register), onde ainda nao existe sessao
// autenticada para chamar POST /api/uploads. O cliente ja manda o arquivo
// como data URL no corpo da requisicao; aqui so trocamos "guardar o base64
// inteiro no banco" por "gravar em disco e guardar so o caminho".
export const saveDataUrlToUploads = (dataUrl) => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de arquivo invalido.");
  }
  const [, mimetype, base64] = match;
  if (!isAllowedDocumentMime(mimetype)) {
    throw new Error("Tipo de arquivo nao permitido.");
  }
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_DATA_URL_BYTES) {
    throw new Error("Arquivo muito grande.");
  }
  const filename = `${randomUUID()}${EXTENSION_BY_MIME[mimetype] ?? ""}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
};
