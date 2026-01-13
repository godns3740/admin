function Frame() {
  return (
    <div className="bg-[#666f7a] content-stretch flex items-center justify-center px-[16px] py-[12px] relative rounded-[8px] shrink-0">
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-none relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">Tab1</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[#f0f1f5] content-stretch flex items-center justify-center px-[16px] py-[12px] relative rounded-[8px] shrink-0">
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-none relative shrink-0 text-[#6a6e76] text-[16px] text-nowrap whitespace-pre">Tab2</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#dadce5] content-stretch flex items-center justify-center px-[16px] py-[12px] relative rounded-[8px] shrink-0">
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-none relative shrink-0 text-[#6a6e76] text-[16px] text-nowrap whitespace-pre">Tab2</p>
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="bg-white relative size-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[20px] py-[10px] relative size-full">
          <Frame />
          <Frame1 />
          <Frame2 />
        </div>
      </div>
    </div>
  );
}