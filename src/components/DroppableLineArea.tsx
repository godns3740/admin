import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableHospitalItemWithLine } from './DraggableHospitalItemWithLine';

interface SelectedHospital {
  hspId: string;
  hspNm: string;
  channelName: string;
  colorCode: string;
  gradientColor: string;
  logoWhite: string;
  line?: 1 | 2;
}

interface Props {
  line: 1 | 2;
  hospitals: SelectedHospital[];
  moveHospital: (dragIndex: number, hoverIndex: number, fromLine: 1 | 2, toLine: 1 | 2) => void;
  removeHospital: (hspId: string) => void;
}

export const DroppableLineArea = ({ line, hospitals, moveHospital, removeHospital }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'hospital',
    drop: (item: { index: number; line: 1 | 2; hspId: string }) => {
      // 같은 줄이면 무시
      if (item.line === line) {
        return;
      }
      
      // 다른 줄로 이동 - 맨 뒤에 추가
      moveHospital(item.index, hospitals.length, item.line, line);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      className={`border-2 border-dashed rounded-lg p-3 min-h-[60px] transition-colors ${
        isOver ? 'border-[#2b77f5] bg-blue-50' : 'border-gray-300'
      }`}
    >
      {hospitals.length > 0 ? (
        <div className="space-y-2">
          {hospitals.map((hospital, index) => (
            <DraggableHospitalItemWithLine
              key={hospital.hspId}
              hospital={hospital}
              index={index}
              line={line}
              moveHospital={moveHospital}
              removeHospital={removeHospital}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-gray-400 py-2">
          {isOver ? '여기에 놓으세요' : ''}
        </div>
      )}
    </div>
  );
};
