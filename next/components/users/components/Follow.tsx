interface FollowProps {
    user: any;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    followLoading: boolean;
    session: any;
    setFollowModalTab: (tab: "followers" | "following") => void;
    setFollowModalOpen: (open: boolean) => void;
    handleFollowToggle: () => void;
}

export function Follow({
    user,
    followersCount,
    followingCount,
    isFollowing,
    followLoading,
    session,
    setFollowModalTab,
    setFollowModalOpen,
    handleFollowToggle
}: FollowProps) {
    return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-orange-600 flex items-center justify-center overflow-hidden">
                    {user.profile_image ? (
                        <img
                            src={user.profile_image}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-amber-700 dark:text-orange-200">
                            {user.name?.[0]?.toUpperCase() || "?"}
                        </span>
                    )}
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {user.display_name || user.name}
                    </h1>
                    <p className="text-amber-700 dark:text-orange-300 text-lg">
                        @{user.name}
                    </p>
                    <div className="flex items-center gap-6 text-sm mt-2">
                        <span className="text-gray-600 dark:text-gray-400">
                            공개 방 {user.public_rooms_count}개
                        </span>
                        <button
                            onClick={() => {
                                setFollowModalTab("followers");
                                setFollowModalOpen(true);
                            }}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                            팔로워 <span className="font-semibold ">{followersCount}</span>
                        </button>
                        <button
                            onClick={() => {
                                setFollowModalTab("following");
                                setFollowModalOpen(true);
                            }}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                            팔로잉 <span className="font-semibold">{followingCount}</span>
                        </button>
                    </div>
                </div>

                {session?.user?.id && session.user.id !== user.user_id && (
                    <div className="mt-4">
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isFollowing
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                : "bg-amber-600 dark:bg-blue-500 text-white hover:bg-amber-700 dark:hover:bg-blue-700"
                                } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {followLoading ? "처리 중..." : isFollowing ? "팔로잉" : "팔로우"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}