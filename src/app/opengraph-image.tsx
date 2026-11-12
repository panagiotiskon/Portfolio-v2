import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const portrait = await readFile(join(process.cwd(), "public/portrait.png"));
  const src = `data:image/png;base64,${portrait.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: 80,
          background: "#0b0a17",
          color: "#ece8f5",
          fontFamily: "monospace",
        }}
      >
        <img
          src={src}
          width={360}
          height={360}
          alt=""
          style={{ imageRendering: "pixelated", border: "8px solid #ffc94a" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 36, color: "#ffc94a", letterSpacing: 4 }}>{SITE.shortTitle}</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{SITE.name}</div>
          <div style={{ fontSize: 34, color: "#3cff7a" }}>Full Stack Developer · React · Node.js · Spring Boot</div>
        </div>
      </div>
    ),
    size,
  );
}
