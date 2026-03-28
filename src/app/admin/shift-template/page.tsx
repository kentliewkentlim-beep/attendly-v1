import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import ShiftTemplateClient from "./ShiftTemplateClient";

export default async function AdminShiftTemplatePage() {
  const templates = await prisma.shiftTemplate.findMany({
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" }
  });

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  async function handleSaveTemplate(data: { 
    id?: string; 
    name: string; 
    startTime: string; 
    endTime: string; 
    color?: string;
    companyId: string;
  }) {
    "use server";
    if (data.id) {
      await prisma.shiftTemplate.update({
        where: { id: data.id },
        data: { 
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          color: data.color,
          companyId: data.companyId
        }
      });
    } else {
      await prisma.shiftTemplate.create({
        data: { 
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          color: data.color,
          companyId: data.companyId
        }
      });
    }
    revalidatePath("/admin/shift-template");
  }

  async function handleDeleteTemplate(id: string) {
    "use server";
    await prisma.shiftTemplate.delete({ where: { id } });
    revalidatePath("/admin/shift-template");
  }

  async function handleSeedDefaults(companyId: string) {
    "use server";
    if (!companyId) return;

    const defaults = [
      { name: "Day", startTime: "10:00", endTime: "19:00", color: "#3b82f6" },
      { name: "Evening", startTime: "11:00", endTime: "20:00", color: "#8b5cf6" },
      { name: "Full", startTime: "10:00", endTime: "19:00", color: "#10b981" },
    ];

    for (const shift of defaults) {
      await prisma.shiftTemplate.create({
        data: {
          ...shift,
          companyId
        }
      });
    }
    revalidatePath("/admin/shift-template");
  }

  return (
    <ShiftTemplateClient 
      templates={templates} 
      companies={companies}
      onSaveTemplate={handleSaveTemplate}
      onDeleteTemplate={handleDeleteTemplate}
      onSeedDefaults={handleSeedDefaults}
    />
  );
}
