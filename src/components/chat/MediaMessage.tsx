import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play } from "lucide-react";
import { useState } from "react";
import AudioWaveformPlayer from "./AudioWaveformPlayer";
import { cn } from "@/lib/utils";

export type MediaKind = "text" | "file" | "audio" | "image" | "video";

export type MediaMessageData = {
  text?: string;
  kind?: MediaKind;
  fileName?: string;
  fileUrl?: string;
};

type MediaMessageProps = {
  message: MediaMessageData;
  isMe: boolean;
};

const MediaMessage = ({ message, isMe }: MediaMessageProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const kind = message.kind ?? "text";

  if (kind === "audio" && message.fileUrl) {
    return <AudioWaveformPlayer src={message.fileUrl} isMe={isMe} />;
  }

  if ((kind === "image" || kind === "video") && message.fileUrl) {
    return (
      <>
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="block w-full">
          {kind === "image" ? (
            <img
              src={message.fileUrl}
              alt={message.fileName ?? "Imagem"}
              className="w-full max-w-[320px] md:max-w-[380px] rounded-lg object-cover"
            />
          ) : (
            <div className="relative w-full max-w-[360px] aspect-video rounded-lg overflow-hidden bg-black/80">
              <video src={message.fileUrl} className="h-full w-full object-cover" preload="metadata" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )}
        </button>
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[95vw] w-fit">
            {kind === "image" ? (
              <img
                src={message.fileUrl}
                alt={message.fileName ?? "Imagem"}
                className="max-h-[80vh] w-full object-contain rounded-lg"
              />
            ) : (
              <video
                src={message.fileUrl}
                controls
                autoPlay
                className="max-h-[80vh] w-full rounded-lg bg-black"
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (kind === "file") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{message.fileName ?? message.text}</p>
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            download={message.fileName}
            className={cn("text-xs underline", isMe ? "text-primary-foreground/80" : "text-primary")}
          >
            Baixar anexo
          </a>
        )}
      </div>
    );
  }

  return <p className="text-sm leading-relaxed">{message.text}</p>;
};

export default MediaMessage;
