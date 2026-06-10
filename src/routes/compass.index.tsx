import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compass/")({
  beforeLoad: () => {
    throw redirect({ to: "/compass/prepare" });
  },
});
