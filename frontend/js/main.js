// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const cusName = document.getElementById('cusName').value.trim();
        const cusPhone = document.getElementById('cusPhone').value.trim();
        const cusDemand = document.getElementById('cusDemand').value.trim();
        const fileInput = document.getElementById('attachmentInput');

        if (!cusName || !cusPhone) {
            alert('请填写姓名/公司名称与联系电话！');
            return;
        }

        let fileDataObj = null;

        // 如果用户选择了文件
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const selectedFile = fileInput.files[0];

            // 限制文件大小 20MB
            if (selectedFile.size > 20 * 1024 * 1024) {
                alert('附件文件大小不能超过 20MB！');
                return;
            }

            try {
                // 读取文件转换为 Base64 数据串
                const base64Str = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (evt) => resolve(evt.target.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(selectedFile);
                });

                fileDataObj = {
                    fileName: selectedFile.name,
                    fileData: base64Str
                };
            } catch (err) {
                console.error('读取附件失败:', err);
                alert('附件读取失败，请重新选择文件！');
                return;
            }
        }

        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>提交中，请稍候...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const res = await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cusName,
                    phone: cusPhone,
                    demand: cusDemand,
                    file: fileDataObj
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('🎉 您的对接申请及附件已成功提交！我们的团队将尽快与您联系。');
                contactForm.reset();
            } else {
                alert('❌ 提交失败：' + (data.error || '未知错误'));
            }
        } catch (err) {
            console.error('提交请求网络错误:', err);
            alert('❌ 网络请求失败，请检查网络连接！');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});