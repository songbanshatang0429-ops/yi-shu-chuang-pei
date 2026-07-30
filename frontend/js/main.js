document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalHTML = submitBtn.innerHTML;

            const name = document.getElementById('cusName').value.trim();
            const phone = document.getElementById('cusPhone').value.trim();
            const demand = document.getElementById('cusDemand').value.trim();

            if (!name || !phone) {
                alert('请填写您的姓名/公司名称与联系电话！');
                return;
            }

            // 加载动画状态
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在提交...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, phone, demand })
                });

                const result = await response.json();

                if (result.success) {
                    alert('🎉 ' + result.message);
                    contactForm.reset();
                } else {
                    alert('❌ 提交失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('网络错误:', error);
                alert('❌ 无法连接到服务器，请稍后再试。');
            } finally {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        });
    }
});