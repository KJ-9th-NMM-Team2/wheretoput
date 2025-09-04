"use client";

import FloorPlanEditor from "@/components/FloorPlanEditor.jsx";
import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

export default function CreatePage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      signIn(undefined, { callbackUrl: "/create" });
    }
  }, [session, status]);

  if (!session?.user) {
    return null;
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <FloorPlanEditor />
    </div>
  );
}
