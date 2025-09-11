"use client";

import FloorPlanEditor from "@/components/FloorPlanEditor.jsx";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateStartModal from "@/components/CreateStartModal";

export default function CreatePage() {
  const { data: session, status } = useSession();
  const [showEditor, setShowEditor] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      signIn(undefined, { callbackUrl: "/create" });
    } else {
      setShowModal(true);
    }
  }, [session, status]);

  if (!session?.user) {
    return null;
  }

  const handleStartEditor = () => {
    setShowModal(false);
    setShowEditor(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push("/");
  };

  if (showEditor) {
    return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <FloorPlanEditor />
      </div>
    );
  }

  return (
    <>
      <CreateStartModal 
        isOpen={showModal}
        onClose={handleCloseModal}
        onStart={handleStartEditor}
      />
    </>
  );
}
