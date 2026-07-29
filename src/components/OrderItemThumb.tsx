import { useState } from "react";
import { ImageOff } from "lucide-react";
import { API } from "@/lib/api";

export function OrderItemThumb({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={`${API}${imageUrl}`}
      alt={name}
      className="h-10 w-10 rounded-lg object-cover bg-secondary flex-shrink-0"
      onError={() => setFailed(true)}
    />
  );
}
