import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { IconData, updateIconInSheet, deleteIconFromSheet } from '../utils/sheety';
import { updateCloudinaryTags, deleteFromCloudinary, uploadToCloudinary } from '../utils/cloudinary';

interface IconEditModalProps {
  icon: IconData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIcon: IconData) => void;
  onDelete: (iconId: number) => void;
}

export default function IconEditModal({ icon, isOpen, onClose, onUpdate, onDelete }: IconEditModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen && icon) {
      const tagArray = icon.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(tagArray);
      setCurrentImageUrl(icon.cloudinaryUrlWhite);
      setNewImage('');
    }
  }, [isOpen, icon]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isFocused || currentImageUrl) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const base64 = canvas.toDataURL('image/png');
                  setNewImage(base64);
                  setCurrentImageUrl(base64);
                }
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(blob);
          }
          e.preventDefault();
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isFocused, currentImageUrl]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) {
      return;
    }
    if (tags.includes(trimmed)) {
      alert('이미 존재하는 태그입니다.');
      return;
    }
    setTags([...tags, trimmed]);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (tags.length === 0) {
      alert('최소 하나 이상의 태그가 필요합니다.');
      return;
    }

    try {
      setIsUpdating(true);

      const tagsString = tags.join(', ');
      
      let updateData: any = { tags: tagsString };

      // 새 이미지가 있으면 이미지도 함께 업데이트
      if (newImage) {
        // 1. 투명 배경 버전 업로드 (기존 public_id로 덮어쓰기)
        const cloudinaryUrlTransparent = await uploadToCloudinary(
          newImage, 
          icon.publicIdTransparent, 
          tags,
          true // overwrite = true로 기존 이미지 덮어쓰기
        );

        // 2. 흰색 배경 버전 생성 및 업로드 (기존 public_id로 덮어쓰기)
        const whiteBackgroundImage = await createWhiteBackgroundImage(newImage);
        const cloudinaryUrlWhite = await uploadToCloudinary(
          whiteBackgroundImage, 
          icon.publicIdWhite, 
          tags,
          true // overwrite = true로 기존 이미지 덮어쓰기
        );

        updateData.cloudinaryUrlTransparent = cloudinaryUrlTransparent;
        updateData.cloudinaryUrlWhite = cloudinaryUrlWhite;
      } else {
        // 이미지 변경 없이 태그만 업데이트
        await updateCloudinaryTags(icon.publicIdTransparent, tags);
        await updateCloudinaryTags(icon.publicIdWhite, tags);
      }

      // 3. Google Sheets 업데이트
      await updateIconInSheet(icon.id!, updateData);

      // 4. 부모 컴포넌트에 업데이트 알림
      onUpdate({
        ...icon,
        ...updateData,
        tags: tagsString,
      });

      alert(newImage ? '아이콘이 성공적으로 업데이트되었습니다.' : '태그가 성공적으로 업데이트되었습니다.');
      onClose();
    } catch (error) {
      console.error('업데이트 실패:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `정말로 이 아이콘을 삭제하시겠습니까?\n\n아이콘명: ${icon.englishName}\n태그: ${icon.tags}\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      // 1. Cloudinary에서 삭제 (투명 버전)
      await deleteFromCloudinary(icon.publicIdTransparent);
      
      // 2. Cloudinary에서 삭제 (흰배경 버전)
      await deleteFromCloudinary(icon.publicIdWhite);

      // 3. Google Sheets에서 삭제
      await deleteIconFromSheet(icon.id!);

      // 4. 부모 컴포넌트에 삭제 알림
      onDelete(icon.id!);

      alert('아이콘이 성공적으로 삭제되었습니다.');
      onClose();
    } catch (error) {
      console.error('아이콘 삭제 실패:', error);
      alert('아이콘 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 흰색 배경이 있는 이미지 생성
  const createWhiteBackgroundImage = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 흰색 배경 그리기
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 200, 200);
          
          // 이미지 그리기
          ctx.drawImage(img, 0, 0, 200, 200);
          
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
        }
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = base64Image;
    });
  };

  const handleImageUpdate = async () => {
    if (!newImage) {
      alert('새 이미지를 붙여넣기 해주세요.');
      return;
    }

    const confirmed = window.confirm(
      `정말로 이 아이콘의 이미지를 변경하시겠습니까?\n\n아이콘명: ${icon.englishName}\n\n기존 이미지가 덮어쓰기 됩니다.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsUpdating(true);

      // 1. 투명 배경 버전 업로드 (기존 public_id로 덮어쓰기)
      const cloudinaryUrlTransparent = await uploadToCloudinary(
        newImage, 
        icon.publicIdTransparent, 
        tags
      );

      // 2. 흰색 배경 버전 생성 및 업로드 (기존 public_id로 덮어쓰기)
      const whiteBackgroundImage = await createWhiteBackgroundImage(newImage);
      const cloudinaryUrlWhite = await uploadToCloudinary(
        whiteBackgroundImage, 
        icon.publicIdWhite, 
        tags
      );

      // 3. Google Sheets 업데이트 (URL만 업데이트, public_id는 그대로)
      await updateIconInSheet(icon.id!, { 
        cloudinaryUrlTransparent,
        cloudinaryUrlWhite,
      });

      // 4. 부모 컴포넌트에 업데이트 알림
      onUpdate({
        ...icon,
        cloudinaryUrlTransparent,
        cloudinaryUrlWhite,
      });

      alert('아이콘 이미지가 성공적으로 업데이트되었습니다.');
      setNewImage('');
      onClose();
    } catch (error) {
      console.error('아이콘 이미지 업데이트 실패:', error);
      alert('아이콘 이미지 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearImage = () => {
    setCurrentImageUrl('');
    setNewImage('');
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
            <h3 className="text-[20px] font-semibold text-[#2C2C2C]">
              아이콘 태그 편집
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#666666]" />
            </button>
          </div>

          {/* 바디 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* 아이콘 미리보기 */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#E8EAED]">
              <div
                className={`relative w-24 h-24 rounded-lg p-3 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                  isFocused
                    ? 'border-2 border-dashed border-[#2b77f5] bg-[#E8F0FF]'
                    : currentImageUrl
                    ? 'border border-[#E8EAED] bg-white'
                    : 'border-2 border-dashed border-[#E0E0E0] hover:border-[#2b77f5] hover:bg-[#F9FCFF] bg-white'
                }`}
                onClick={() => !currentImageUrl && setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                tabIndex={currentImageUrl ? -1 : 0}
              >
                {currentImageUrl ? (
                  <>
                    <img
                      src={currentImageUrl}
                      alt={icon.englishName}
                      className="max-w-full max-h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearImage();
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-[#999999] mx-auto mb-1" />
                    <p className="text-[#999999] text-xs">붙여넣기</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[#2C2C2C] font-medium mb-1">{icon.englishName}</p>
                <p className="text-[#999999] text-sm">
                  등록일: {new Date(icon.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* 현재 태그 */}
            <div className="mb-4">
              <label className="block text-[#2C2C2C] font-medium mb-3">
                현재 태그
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E8F0FF] text-[#2b77f5] border border-[#2b77f5]/20"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-[#2b77f5]/10 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-[#999999] text-sm">태그가 없습니다.</p>
                )}
              </div>
            </div>

            {/* 태그 추가 */}
            <div>
              <label className="block text-[#2C2C2C] font-medium mb-3">
                새 태그 추가
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                  placeholder="태그 입력 후 Enter"
                />
                <button
                  onClick={handleAddTag}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-[#E8EAED]">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#FF4D4F] text-white rounded-lg hover:bg-[#FF1F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-t-2 border-t-white rounded-full"></div>
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-[#666666] hover:bg-[#F5F5F5] rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#2b77f5] text-white rounded-lg hover:bg-[#1763E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-t-2 border-t-white rounded-full"></div>
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}