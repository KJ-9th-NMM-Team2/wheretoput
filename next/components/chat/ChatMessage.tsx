// Chat message component
// Team: 준탁
interface MessageProps {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isOwn?: boolean;
}

export default function ChatMessage({ content, sender, timestamp, isOwn = false }: MessageProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-900'
      }`}>
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 text-gray-600">{sender}</p>
        )}
        <p className="text-sm">{content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {timestamp}
        </p>
      </div>
    </div>
  );
}