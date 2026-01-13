import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Folder } from 'lucide-react';
import { getAllDesigns, SheetData } from '../utils/sheety';

export default function HospitalChannelList() {
  const [hospitals, setHospitals] = useState<SheetData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoading(true);
      try {
        // Sheety에서 등록된 병원 데이터 가져오기
        const allDesigns = await getAllDesigns();
        
        // 가나다순 정렬 (storagePrefix 필터링 제거)
        const sorted = allDesigns
          .sort((a, b) => a.hospitalName.localeCompare(b.hospitalName, 'ko'));
        
        console.log('병원 리스트:', sorted);
        setHospitals(sorted);
      } catch (error) {
        console.error('병원 리스트 로드 실패:', error);
        setHospitals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.hspId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (hospital.storagePrefix && hospital.storagePrefix.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">병원 채널 구성</h2>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="병원명 또는 병원ID로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
            />
          </div>
        </div>

        {/* 병원 리스트 */}
        {isLoading ? (
          <div className="text-center py-16 text-[#999999]">
            로딩 중...
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-16 text-[#999999]">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 병원이 없습니다.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.hspId}
                onClick={() => navigate(`/hospital-channels/${hospital.hspId}`)}
                className="bg-white border border-[#E8EAED] rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#F5F5F7] rounded-lg flex items-center justify-center group-hover:bg-[#2b77f5] transition-colors">
                    <Folder className="w-6 h-6 text-[#666666] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2C2C2C] mb-1 truncate">
                      {hospital.hospitalName}
                    </h3>
                    <p className="text-[#999999] text-sm truncate">
                      {hospital.hspId}
                    </p>
                    <p className="text-[#666666] text-sm mt-1 truncate">
                      {hospital.storagePrefix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}