import { db } from "@/lib/db";

// Photos an admin uploaded. An id never changes what it shows, so browsers may keep it for good.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await db.carPhoto.findUnique({ where: { id }, select: { contentType: true, data: true } });
  if (!photo) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
