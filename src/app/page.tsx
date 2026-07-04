import { redirect } from "next/navigation";
import { getAssistantPageProps } from "@/lib/assistant-page-props";

export default async function HomePage() {
  const props = await getAssistantPageProps();

  if (!props) {
    redirect("/login");
  }

  redirect("/workplace");
}
