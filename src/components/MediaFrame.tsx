import Image from "next/image";

type MediaFrameVariant = "hero" | "panel" | "card";

const sizesByVariant: Record<MediaFrameVariant, string> = {
  hero: "(max-width: 900px) calc(100vw - 1.25rem), 36vw",
  panel: "(max-width: 900px) calc(100vw - 1.25rem), 36vw",
  card: "(max-width: 900px) calc(100vw - 1.25rem), 48vw",
};

type MediaFrameProps = {
  alt: string;
  priority?: boolean;
  src: string;
  variant?: MediaFrameVariant;
};

export function MediaFrame({
  alt,
  priority = false,
  src,
  variant = "panel",
}: MediaFrameProps) {
  return (
    <div className={`media-frame media-frame--${variant}`}>
      <div className="media-frame__image-shell">
        <Image
          alt={alt}
          className="media-frame__image"
          fill
          priority={priority}
          sizes={sizesByVariant[variant]}
          src={src}
        />
      </div>
    </div>
  );
}
