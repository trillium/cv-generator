import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$resumeType")({
  component: ResumeTypeLayout,
});

function ResumeTypeLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
