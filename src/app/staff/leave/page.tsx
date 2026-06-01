import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import StaffLeaveClient from "./StaffLeaveClient";
import { revalidatePath } from "next/cache";

export default async function StaffLeavePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { leaves: { orderBy: { createdAt: "desc" } } }
  });

  if (!dbUser) redirect("/");

  async function handleApplyLeave(data: { 
    startDate: Date; 
    endDate: Date; 
    type: string; 
    durationType?: string;
    reason: string;
    attachment?: string;
  }) {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return;

    await prisma.leave.create({
      data: {
        userId: sessionUser.id,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        durationType: data.durationType || "FULL_DAY",
        reason: data.reason,
        status: "PENDING",
        attachment: data.attachment
      }
    });

    revalidatePath("/staff/leave");
  }

  // Upload an MC (medical certificate) document to Supabase Storage and return its public URL.
  async function uploadMcDocument(formData: FormData): Promise<string | null> {
    "use server";
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return null;
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return null;
    // Reject anything that isn't an image or PDF, cap ~10MB
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType || file.size > 10 * 1024 * 1024) return null;

    const supabase = getSupabaseServiceClient();
    await supabase.storage.createBucket("leave-docs", { public: true }).catch(() => {});
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `mc/${sessionUser.id}/${Date.now()}-${rand}.${ext}`;
    const { error } = await supabase.storage
      .from("leave-docs")
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (error) return null;
    const { data } = supabase.storage.from("leave-docs").getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <StaffLeaveClient
        leaveBalance={dbUser.leaveBalance}
        leaveHistory={dbUser.leaves}
        onApplyLeave={handleApplyLeave}
        onUploadMc={uploadMcDocument}
      />
    </div>
  );
}
