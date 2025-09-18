"use client";

import FloorPlanEditor from "@/components/FloorPlanEditor.jsx";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateStartModal from "@/components/CreateStartModal";
import MobileBlockModal from "@/components/ui/MobileBlockModal";

export default function CreatePage() {
  const { data: session, status } = useSession();
  const [showEditor, setShowEditor] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMobile(window.innerWidth < 640); // sm 브레이크포인트
  }, []);

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

  if (isMobile) {
    return (
      <MobileBlockModal
        title="PC에서만 지원됩니다"
        description="방 빌드 기능은 더 나은 편집 환경을 위해 PC(데스크탑/노트북)에서만 이용 가능합니다."
        showMobileButton={false}
        onBackButtonClick={() => router.back()}
      />
    );
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
