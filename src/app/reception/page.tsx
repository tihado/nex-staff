import { redirect } from "next/navigation";
import { AssistantHome } from "@/components/assistant/assistant-home";
import { getAssistantPageProps } from "@/lib/assistant-page-props";

export default async function ReceptionPage() {
  const props = await getAssistantPageProps();

  if (!props) {
    redirect("/login");
  }

  return (
    <AssistantHome
      assistantName={props.assistantName}
      greeting={props.greeting}
      viewerLabel={props.viewerLabel}
    />
  );
}
