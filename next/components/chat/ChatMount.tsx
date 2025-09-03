import { auth } from "@/lib/auth";
import ChatPage from "./ChatPage";

export default async function ChatMount() {
    const session = await auth();

    const jwt = process.env.NEXT_PUBLIC_APP_JWT ?? "";
    const currentUserId = (session?.user?.id && String(session.user.id)) || "guest";

    return <ChatPage jwt={jwt} currentUserId={currentUserId} />;
}
