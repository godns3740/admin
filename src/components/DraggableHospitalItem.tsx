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
}

interface Props {
  hospital: SelectedHospital;
  index: number;
  moveHospital: (dragIndex: number, hoverIndex: number) => void;
  removeHospital: (hspId: string) => void;
}

export const DraggableHospitalItem = ({ hospital, index, moveHospital, removeHospital }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'hospital',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveHospital(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'hospital',
    item: () => {
      return { index };
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
