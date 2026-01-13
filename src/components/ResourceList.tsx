import { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import type { Resource } from '../App';

interface ResourceListProps {
  resources: Resource[];
  onSelect: (id: string) => void;
}

export default function ResourceList({ resources, onSelect }: ResourceListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'date' | 'name'>('date');

  const filteredResources = resources.filter((resource) =>
    resource.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 정렬 적용
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortOrder === 'date') {
      // 최근 등록이 상단 (내림차순)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // 가나다순 (오름차순)
      return a.hospitalName.localeCompare(b.hospitalName, 'ko-KR');
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'date' ? 'name' : 'date');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-[#2C2C2C] mb-6 text-[24px] font-bold">등록된 디자인</h2>

      <div className="mb-6 flex justify-between items-center gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="병원명으로 검색"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="text-gray-700">
            {sortOrder === 'date' ? '등록순' : '가나다순'}
          </span>
        </button>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? '검색 결과가 없습니다.' : '등록된 리소스가 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">병원명</th>
                <th className="px-6 py-3 text-left text-gray-700">컬러코드</th>
                <th className="px-6 py-3 text-left text-gray-700">등록날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedResources.map((resource) => (
                <tr
                  key={resource.id}
                  onClick={() => onSelect(resource.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-gray-900">
                    {resource.hospitalName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700">#{resource.colorCode}</span>
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: `#${resource.colorCode}` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(resource.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}