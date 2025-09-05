const UserNotFound = () => {
  return (
    <div className="px-40 py-5">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          사용자를 찾을 수 없습니다
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          요청하신 사용자 정보를 불러올 수 없습니다.
        </p>
      </div>
    </div>
  );
};

export default UserNotFound;