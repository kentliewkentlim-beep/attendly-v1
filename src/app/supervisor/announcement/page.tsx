import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase";
import SupervisorAnnouncementClient from "./SupervisorAnnouncementClient";

export default async function SupervisorAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const announcementsRaw = await (prisma as any).announcement.findMany({
    where: { companyId: user.companyId },
    include: {
      author: true,
      outlet: true,
      _count: { select: { acks: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const announcements = announcementsRaw.map((a: any) => ({
    ...a,
    outletId: a.outletId ? a.outletId.toString() : null,
    outlet: a.outlet ? { ...a.outlet, id: a.outlet.id.toString() } : null
  }));

  const outletsRaw = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" }
  });
  const outlets = outletsRaw.map((o: any) => ({ ...o, id: o.id.toString() }));

  async function handleCreateAnnouncement(formData: FormData) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser || (sessionUser.role !== "SUPERVISOR" && sessionUser.role !== "ADMIN")) return;

    const title = (formData.get("title") as string || "").trim();
    const content = (formData.get("content") as string || "").trim();
    const outletId = formData.get("outletId") as string;
    const image = formData.get("image") as File | null;

    if (!title || !content) return;

    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      const supabase = getSupabaseServiceClient();
      await supabase.storage.createBucket("announcements", { public: true }).catch(() => {});
      const ext = (image.name.split(".").pop() || "jpg").toLowerCase();
      const path = `announcements/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      await supabase.storage.from("announcements").upload(path, image, {
        upsert: false,
        contentType: image.type || "image/jpeg"
      });
      const { data } = supabase.storage.from("announcements").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    await (prisma as any).announcement.create({
      data: {
        title,
        content,
        companyId: sessionUser.companyId,
        outletId: outletId ? BigInt(outletId) : null,
        authorId: sessionUser.id,
        imageUrl
      }
    });

    revalidatePath("/supervisor/announcement");
    revalidatePath("/admin/announcement");
    revalidatePath("/staff");
  }

  async function handleDeleteAnnouncement(id: string) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser || (sessionUser.role !== "SUPERVISOR" && sessionUser.role !== "ADMIN")) return;
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/supervisor/announcement");
    revalidatePath("/admin/announcement");
    revalidatePath("/staff");
  }

  return (
    <SupervisorAnnouncementClient
      announcements={announcements}
      outlets={outlets}
      onCreateAnnouncement={handleCreateAnnouncement}
      onDeleteAnnouncement={handleDeleteAnnouncement}
    />
  );
}
