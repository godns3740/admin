import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, X } from 'lucide-react';

interface SelectedHospital {
  hspId: string;
  hspNm: string;
  channelName: string;
  colorCode: string;
  gradientColor: string;
  logoWhite: string;
  line: 1 | 2; // 줄 정보 추가
}

interface Props {
  hospital: SelectedHospital;
  index: number;
  line: 1 | 2;
  moveHospital: (dragIndex: number, hoverIndex: number, fromLine: 1 | 2, toLine: 1 | 2) => void;
  removeHospital: (hspId: string) => void;
}

export const DraggableHospitalItemWithLine = ({ hospital, index, line, moveHospital, removeHospital }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'hospital',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number; line: 1 | 2; hspId: string }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragLine = item.line;
      const hoverLine = line;

      // 같은 줄에서 같은 위치면 무시
      if (dragIndex === hoverIndex && dragLine === hoverLine) {
        return;
      }

      // 같은 아이템이면 무시
      if (item.hspId === hospital.hspId) {
        return;
      }

      moveHospital(dragIndex, hoverIndex, dragLine, hoverLine);
      item.index = hoverIndex;
      item.line = hoverLine;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'hospital',
    item: () => {
      return { index, line, hspId: hospital.hspId };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 transition-opacity ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div className="cursor-move text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <span className="flex-1 text-[#2C2C2C] font-medium">{hospital.hspNm}</span>
      <button
        onClick={() => removeHospital(hospital.hspId)}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};