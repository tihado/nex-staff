import { redirect } from "next/navigation";
import { WorkplaceHome } from "@/components/workplace/workplace-home";
import { getAssistantPageProps } from "@/lib/assistant-page-props";

export default async function WorkplacePage() {
  const props = await getAssistantPageProps();

  if (!props) {
    redirect("/login");
  }

  return (
    <WorkplaceHome
      assistantName={props.assistantName}
      greeting={props.greeting}
      viewerLabel={props.viewerLabel}
    />
  );
}
