"use client";
import { useState } from "react";

export default function PostAchievement() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        points: 0,
        icon: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'points' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const req = await fetch(`/api/users/justId/achievements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await req.json();
            console.log('Result:', result);
            
            // 성공시 폼 초기화
            if (req.ok) {
                setFormData({
                    title: '',
                    description: '',
                    category: '',
                    points: 0,
                    icon: ''
                });
                alert('업적이 성공적으로 생성되었습니다!');
            }
        } catch (error) {
            console.log("Fetch achievement error: ", error);
            alert('업적 생성에 실패했습니다.');
        }
    };
    
    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-black rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">업적 생성</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">제목</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">설명</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">카테고리</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">선택하세요</option>
                        <option value="beginner">초보자</option>
                        <option value="intermediate">중급자</option>
                        <option value="advanced">고급자</option>
                        <option value="special">특수</option>
                        <option value="hidden">히든</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">포인트</label>
                    <input
                        type="number"
                        name="points"
                        value={formData.points}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">아이콘</label>
                    <input
                        type="text"
                        name="icon"
                        value={formData.icon}
                        onChange={handleInputChange}
                        placeholder="🏆"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    업적 생성
                </button>
            </form>
        </div>
    );
}