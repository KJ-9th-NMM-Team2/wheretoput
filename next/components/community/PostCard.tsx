// Community post component
// Team: 상록
interface PostProps {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function PostCard({ title, content, author, createdAt }: PostProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-3">{content}</p>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>작성자: {author}</span>
        <span>{createdAt}</span>
      </div>
    </div>
  );
}