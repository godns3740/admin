  const handleRegister = async () => {
    if (selectedHospitals.length === 0) {
      alert('병원을 선택해주세요.');
      return;
    }

    // 채널명 확인
    const emptyChannelName = selectedHospitals.find(h => !h.channelName.trim());
    if (emptyChannelName) {
      alert('모든 병원의 채널명을 입력해주세요.');
      return;
    }

    if (!confirm(`${selectedHospitals.length}개 병원에 공지 이미지를 등록하시겠습니까?`)) {
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      const uploadResults: { hospital: string; url: string }[] = [];
      
      for (const hospital of selectedHospitals) {
        try {
          // 1. 이미지 생성
          const blob = await generateNoticeImage(hospital);
          
          // 2. Cloudinary 업로드
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
          formData.append('folder', 'notice_images');
          formData.append('public_id', `${hospital.hspId}_${Date.now()}`);

          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!cloudinaryResponse.ok) {
            throw new Error('Cloudinary 업로드 실패');
          }

          const cloudinaryData = await cloudinaryResponse.json();
          uploadResults.push({
            hospital: hospital.hspNm,
            url: cloudinaryData.secure_url,
          });

          // 3. Sheety에 메타데이터 저장 또는 업데이트
          try {
            // 기존 Notice 데이터 조회
            const existingNotices = await getAllNotices();
            const existingNotice = existingNotices.find(
              notice => notice.hspId === hospital.hspId && notice.noticeType === activeTab
            );

            if (existingNotice && existingNotice.id) {
              // 기존 데이터가 있으면 덮어쓰기 (UPDATE)
              await updateNoticeInSheet(existingNotice.id, {
                cloudinaryUrl: cloudinaryData.secure_url,
                publicId: cloudinaryData.public_id,
                createdAt: new Date().toISOString(),
                uniqueKey: `${hospital.hspId}_${activeTab}_${Date.now()}`, // 새로운 고유 키
              });
              console.log(`${hospital.hspNm} (${activeTab}) 덮어쓰기 완료`);
            } else {
              // 기존 데이터가 없으면 새로 추가 (POST)
              await saveNoticeToSheet({
                hspId: hospital.hspId,
                hospitalName: hospital.hspNm,
                noticeType: activeTab, // 단일/복수 구분
                cloudinaryUrl: cloudinaryData.secure_url,
                publicId: cloudinaryData.public_id,
                createdAt: new Date().toISOString(),
                uniqueKey: `${hospital.hspId}_${activeTab}_${Date.now()}`, // 고유 키 생성
              });
              console.log(`${hospital.hspNm} (${activeTab}) 신규 등록 완료`);
            }
          } catch (sheetyError) {
            // Sheety 저장 실패해도 계속 진행 (Cloudinary 업로드는 성공)
            console.warn(`${hospital.hspNm} Sheety 저장 실패 (건너뜀):`, sheetyError);
          }

          successCount++;
        } catch (error) {
          console.error(`${hospital.hspNm} 등록 실패:`, error);
        }
      }

      // 업로드된 URL 콘솔에 출력 (Sheety 저장 실패 시 참고용)
      if (uploadResults.length > 0) {
        console.log('업로드된 이미지 URL:');
        uploadResults.forEach(result => {
          console.log(`- ${result.hospital}: ${result.url}`);
        });
      }

      if (successCount > 0) {
        alert(`${successCount}개 병원에 공지 이미지가 등록되었습니다.`);
      } else {
        alert('공지 이미지 등록에 실패했습니다.');
      }
      
      setSelectedHospitals([]);
      
    } catch (error) {
      console.error('등록 실패:', error);
      alert('공지 이미지 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };
