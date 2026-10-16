import { CLOUDINARY_CLOUD } from "@/constants/cloudinary";
import type { ProjectMedia } from "@/data/types";

const isUrl = (s: string) => /^https?:\/\//i.test(s) || s.startsWith("/");

/** For a Cloudinary delivery URL, inserts transformations right after /upload/. Other URLs are left alone. */
function withTransform(
  url: string,
  kind: "image" | "video",
  transform: string,
) {
  const marker = `/${kind}/upload/`;
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  return url.replace(marker, `${marker}${transform}/`);
}

/** Image URL, resized and format-optimised by Cloudinary. */
export function imageUrl(src: string, width = 1280) {
  const t = `f_auto,q_auto,w_${width}`;
  if (isUrl(src)) return withTransform(src, "image", t);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${t}/${src}`;
}

/** MP4 URL for a video, plus an automatic still frame to use as its poster. */
export function videoSources(
  src: string,
  width = 960,
): { video: string; poster?: string } {
  const t = `f_mp4,q_auto,w_${width}`;
  const p = `so_0,f_jpg,q_auto,w_${width}`;

  if (isUrl(src)) {
    const video = withTransform(src, "video", t);
    const isCloudinary =
      src.includes("res.cloudinary.com") && src.includes("/video/upload/");
    const poster = isCloudinary
      ? withTransform(src, "video", p).replace(
          /\.[a-z0-9]{2,4}(\?.*)?$/i,
          ".jpg",
        )
      : undefined;
    return { video, poster };
  }

  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/video/upload/`;
  const id = src.replace(/\.[a-z0-9]{2,4}$/i, "");
  return { video: `${base}${t}/${id}.mp4`, poster: `${base}${p}/${id}.jpg` };
}

/** A small still for a gallery thumbnail: the image itself, or the video's poster. */
export function mediaThumb(m: ProjectMedia, width = 400) {
  if (m.type === "image") return imageUrl(m.src, width);
  if (m.poster) return imageUrl(m.poster, width);
  return videoSources(m.src, width).poster ?? "";
}
