import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import CompaniesClient from "./CompaniesClient";

export default async function CompaniesPage() {
  const getCompanies = async (includeGps: boolean) =>
    prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            outlets: true,
          },
        },
        outlets: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            companyId: true,
            ...(includeGps
              ? { latitude: true, longitude: true, geofenceMeters: true }
              : {}),
            createdAt: true,
            updatedAt: true,
            _count: { select: { users: true } },
          },
          orderBy: { name: "asc" },
        },
        users: {
          where: { role: "SUPERVISOR" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

  const companies = await getCompanies(true).catch(async () => await getCompanies(false));

  async function handleSaveCompany(data: { id?: string; name: string }) {
    "use server";
    if (data.id) {
      await prisma.company.update({
        where: { id: data.id },
        data: { name: data.name }
      });
    } else {
      await prisma.company.create({
        data: { name: data.name }
      });
    }
    revalidatePath("/admin/companies");
  }

  async function handleDeleteCompany(id: string) {
    "use server";
    // Optional: Add logic to check if there are users/outlets before deleting
    // For now, let's assume we allow it (Prisma will handle cascading if configured, 
    // but in our schema we didn't specify onDelete: Cascade for all)
    
    // First delete all outlets of this company
    await prisma.outlet.deleteMany({ where: { companyId: id } });
    
    // Then delete the company
    await prisma.company.delete({ where: { id } });
    revalidatePath("/admin/companies");
  }

  async function handleSaveOutlet(data: { id?: string; name: string; address?: string; phone?: string; latitude?: number | null; longitude?: number | null; geofenceMeters?: number | null; companyId: string }) {
    "use server";
    const gpsProvided =
      data.latitude !== null && data.latitude !== undefined ||
      data.longitude !== null && data.longitude !== undefined ||
      data.geofenceMeters !== null && data.geofenceMeters !== undefined;

    const baseData: any = {
      name: data.name,
      address: data.address,
      phone: data.phone,
    };

    const withGps: any = {
      ...baseData,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      geofenceMeters: data.geofenceMeters ?? null,
    };

    try {
      if (data.id) {
        await prisma.outlet.update({
          where: { id: data.id },
          data: withGps,
        });
      } else {
        await prisma.outlet.create({
          data: {
            ...withGps,
            companyId: data.companyId,
          },
        });
      }
    } catch (e: any) {
      if (gpsProvided) {
        throw new Error("GPS columns not found in database. Run the Supabase SQL migration for Outlet latitude/longitude/geofenceMeters, then try again.");
      }
      if (data.id) {
        await prisma.outlet.update({
          where: { id: data.id },
          data: baseData,
        });
      } else {
        await prisma.outlet.create({
          data: {
            ...baseData,
            companyId: data.companyId,
          },
        });
      }
    }
    revalidatePath("/admin/companies");
  }

  async function handleDeleteOutlet(id: string) {
    "use server";
    await prisma.outlet.delete({ where: { id } });
    revalidatePath("/admin/companies");
  }

  return (
    <CompaniesClient 
      companies={companies} 
      onSaveCompany={handleSaveCompany}
      onDeleteCompany={handleDeleteCompany}
      onSaveOutlet={handleSaveOutlet}
      onDeleteOutlet={handleDeleteOutlet}
    />
  );
}
