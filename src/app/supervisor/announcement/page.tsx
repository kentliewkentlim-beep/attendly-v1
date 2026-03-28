import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SupervisorAnnouncementClient from "./SupervisorAnnouncementClient";

export default async function SupervisorAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERVISOR" && user.role !== "ADMIN")) redirect("/staff");

  const announcements = await prisma.announcement.findMany({
    where: {
      companyId: user.companyId,
    },
    include: {
      author: true,
      outlet: true
    },
    orderBy: { createdAt: "desc" }
  });

  const outlets = await prisma.outlet.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" }
  });

  async function handleCreateAnnouncement(data: { title: string; content: string; outletId: string | null }) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    
    await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        companyId: user.companyId,
        outletId: data.outletId,
        authorId: user.id
      }
    });

    revalidatePath("/supervisor/announcement");
  }

  async function handleDeleteAnnouncement(id: string) {
    "use server";
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/supervisor/announcement");
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
