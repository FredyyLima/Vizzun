import { apiPath } from "@/lib/api";

export const resizeImage = (file: File, maxSize = 900, quality = 0.8) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const image = new Image();

    reader.onload = () => {
      image.onload = () => {
        const maxDimension = Math.max(image.width, image.height);
        const scale = maxDimension > maxSize ? maxSize / maxDimension : 1;
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas não disponível."));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = () => reject(new Error("Não foi possível processar a imagem."));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Erro ao ler a imagem."));
    reader.readAsDataURL(file);
  });

export const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export const uploadFile = async (file: Blob, filename: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file, filename);
  const response = await fetch(apiPath("/api/uploads"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Falha ao enviar arquivo.");
  }
  const result = (await response.json()) as { url: string };
  return result.url;
};
