import { redirect } from "next/navigation";

export const runtime = "edge";

export default function DipRoutePage() {
    redirect("/services/improvement-program");
}
