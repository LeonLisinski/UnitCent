import { ImageResponse } from "next/og";
import { getPost, publishedPosts } from "../../../content/blog";

export const alt = "UnitCent blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const revalidate = 3600;

export function generateStaticParams() {
  return publishedPosts().map((p) => ({ slug: p.slug }));
}

/* Isti jezik kao app/opengraph-image.tsx: tamna podloga, prsten, naslov članka. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  const title = post?.title ?? "UnitCent blog";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#070b0b", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 100 100" fill="none" strokeLinecap="round">
            <circle cx="50" cy="50" r="34" stroke="#3dd6a3" strokeOpacity="0.22" strokeWidth="16" />
            <path d="M74.04 25.96A34 34 0 1 0 74.04 74.04" stroke="#3dd6a3" strokeWidth="16" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#f2f4f1" }}>Unit<span style={{ color: "#3dd6a3" }}>Cent</span></div>
          <div style={{ display: "flex", marginLeft: 12, fontSize: 28, color: "#a3b0ab" }}>Blog</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {post ? <div style={{ display: "flex", fontSize: 28, color: "#3dd6a3", textTransform: "uppercase", letterSpacing: 3 }}>{post.category}</div> : null}
          <div style={{ display: "flex", fontSize: title.length > 60 ? 60 : 70, fontWeight: 800, color: "#f2f4f1", lineHeight: 1.08, maxWidth: 1040 }}>{title}</div>
        </div>
      </div>
    ),
    size
  );
}
