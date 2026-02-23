import { NextRequest, NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "edge";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function buildMagicLinkEmailHtml(params: { fullName?: string; magicLink: string }) {
  const { fullName, magicLink } = params;
  const greeting = fullName ? `Hi ${fullName},` : "Hi there,";

  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px;">
        <h1 style="font-size: 28px; line-height: 1.2; margin: 0 0 12px; font-weight: 800;">Selam Driving School</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 20px;">${greeting}</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px;">
          Here is your new secure sign-in link for the student portal.
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
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const requestedNext = typeof body?.next === "string" ? body.next.trim() : "/student/dashboard";
    const nextPath = requestedNext.startsWith("/") ? requestedNext : "/student/dashboard";
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://selamdrivingschool.com").replace(/\/$/, "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email." }, { status: 400 });
    }

    let fullName = "";
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const matchedUser = (usersData?.users || []).find((u: any) => u.email?.toLowerCase() === email);
      fullName = matchedUser?.user_metadata?.full_name || matchedUser?.user_metadata?.name || "";
    } catch (profileError) {
      console.error("Request magic link: could not load user profile info:", profileError);
    }

    try {
      const redirectTo = `${appUrl}/student/magic?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(email)}`;
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (!error && data?.properties?.action_link) {
        await sendBrevoEmail({
          to: [{ email, name: fullName || undefined }],
          subject: "Your new Selam student sign-in link",
          htmlContent: buildMagicLinkEmailHtml({
            fullName: fullName || undefined,
            magicLink: data.properties.action_link,
          }),
        });
      } else {
        console.error("Request magic link: generateLink failed:", error);
      }
    } catch (sendError) {
      console.error("Request magic link send failure:", sendError);
    }

    // Generic success to avoid exposing account existence.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request magic link route failure:", error);
    return NextResponse.json({ success: false, error: "Unable to process request." }, { status: 500 });
  }
}
