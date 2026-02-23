import { NextRequest, NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "edge";

function errorResponse(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 40) : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function createTempPassword(length = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const random = new Uint32Array(length);
  crypto.getRandomValues(random);
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[random[i] % chars.length];
  }
  return password;
}

function buildWelcomeEmailHtml(params: {
  fullName: string;
  magicLink: string;
  appUrl: string;
}) {
  const { fullName, magicLink, appUrl } = params;
  const logoUrl = `${appUrl}/selam-logo.png`;

  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="${logoUrl}" alt="Selam Driving School" style="max-width: 150px; height: auto;" />
        </div>

        <h1 style="font-size: 28px; line-height: 1.2; margin: 0 0 12px; font-weight: 800;">Welcome to Selam Driving School</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 20px;">Hi <strong>${fullName}</strong>, your student account is ready.</p>

        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px;">
          Use the button below to open your student portal instantly. This secure magic link logs you in directly.
        </p>

        <div style="text-align: center; margin: 0 0 28px;">
          <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; letter-spacing: 0.02em; padding: 14px 24px; border-radius: 12px;">Open Student Portal</a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin: 0 0 24px;">
          <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0; word-break: break-all;">
            If the button does not work, use this link:<br />
            <a href="${magicLink}" style="color: #2563eb; text-decoration: none;">${magicLink}</a>
          </p>
        </div>

        <p style="font-size: 13px; color: #94a3b8; margin: 0; text-align: center;">
          Questions? Email us at <a href="mailto:selamdrivingschool@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">selamdrivingschool@gmail.com</a>
        </p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 16px 0 0;">© ${new Date().getFullYear()} Selam Driving School</p>
    </div>
  `;
}

async function findUserByEmail(email: string) {
  const perPage = 200;
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const match = users.find((u: any) => u.email?.toLowerCase() === email);
    if (match) return match;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function ensureProfile(params: {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
}) {
  const { userId, email, fullName, phone } = params;

  const { data: existingProfile, error: profileReadError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileReadError) throw profileReadError;

  if (!existingProfile) {
    const { error: insertError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      email,
      full_name: fullName,
      phone,
      role: "student",
    });

    if (insertError) throw insertError;
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      email,
      full_name: fullName,
      ...(phone ? { phone } : {}),
    })
    .eq("id", userId);

  if (updateError) throw updateError;
}

async function linkGuestRecords(userId: string, email: string) {
  const [enrollmentsByEmail, enrollmentsByJsonEmail, bookingsByEmail] = await Promise.all([
    supabaseAdmin
      .from("enrollments")
      .update({ user_id: userId, student_id: userId })
      .eq("email", email)
      .is("user_id", null),
    supabaseAdmin
      .from("enrollments")
      .update({ user_id: userId, student_id: userId })
      .eq("customer_details->>email", email)
      .is("user_id", null),
    supabaseAdmin
      .from("bookings")
      .update({ user_id: userId })
      .eq("student_email", email)
      .is("user_id", null),
  ]);

  if (enrollmentsByEmail.error) throw enrollmentsByEmail.error;
  if (enrollmentsByJsonEmail.error) throw enrollmentsByJsonEmail.error;
  if (bookingsByEmail.error) throw bookingsByEmail.error;
}

async function buildMagicLink(email: string, appUrl: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${appUrl}/student/magic?next=/student/dashboard`,
    },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error(error?.message || "Failed to generate magic link");
  }

  return data.properties.action_link;
}

export async function POST(request: NextRequest) {
  const sharedKey = process.env.ADMIN_PORTAL_SHARED_KEY?.trim();
  if (!sharedKey) {
    return errorResponse(500, "ADMIN_PORTAL_SHARED_KEY is not configured.");
  }

  const providedKey = request.headers.get("x-admin-key")?.trim();
  if (!providedKey || providedKey !== sharedKey) {
    return errorResponse(401, "Unauthorized");
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON body.");
  }

  const email = normalizeEmail(payload?.email);
  const fullName = normalizeName(payload?.fullName);
  const phone = normalizePhone(payload?.phone);
  const source = typeof payload?.source === "string" ? payload.source.slice(0, 64) : "admin_portal";

  if (!isValidEmail(email)) {
    return errorResponse(400, "A valid email is required.");
  }
  if (!fullName || fullName.length > 120) {
    return errorResponse(400, "fullName is required (max 120 chars).");
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://selamdrivingschool.com").replace(/\/$/, "");

  try {
    let user = await findUserByEmail(email);
    let created = false;

    if (!user) {
      const tempPassword = createTempPassword();
      const { data: createdUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          role: "student",
          source,
        },
      });

      if (createError || !createdUserData.user) {
        throw new Error(createError?.message || "Failed to create user");
      }

      user = createdUserData.user;
      created = true;
    } else {
      const { error: updateAuthUserError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          full_name: fullName,
          name: fullName,
          role: "student",
          source,
        },
      });
      if (updateAuthUserError) {
        throw new Error(updateAuthUserError.message || "Failed to update auth user metadata");
      }
    }

    await ensureProfile({ userId: user.id, email, fullName, phone });
    await linkGuestRecords(user.id, email);

    const magicLink = await buildMagicLink(email, appUrl);

    await sendBrevoEmail({
      to: [{ email, name: fullName }],
      subject: "Your Selam Student Portal Access",
      htmlContent: buildWelcomeEmailHtml({
        fullName,
        magicLink,
        appUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      emailSent: true,
      created,
    });
  } catch (error: any) {
    console.error("Admin student create flow failed:", error);
    return errorResponse(500, error?.message || "Failed to create student.");
  }
}
