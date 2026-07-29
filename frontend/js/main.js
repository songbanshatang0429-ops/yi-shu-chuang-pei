// 1. 官网表单提交逻辑
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('cusName').value;
        const phone = document.getElementById('cusPhone').value;
        const demand = document.getElementById('cusDemand').value;

        try {
            const res = await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, demand })
            });
            const result = await res.json();
            if (result.success) {
                alert(result.message || '提交成功！');
                contactForm.reset();
            } else {
                alert(result.error || '提交失败');
            }
        } catch (err) {
            alert('网络错误，请稍后再试');
        }
    });
}

// 2. 后台管理员登录逻辑
async function login() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const result = await res.json();

        if (result.success) {
            localStorage.setItem('yishu_token', result.token);
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            loadMessages();
        } else {
            errorDiv.innerText = result.error || '账号或密码错误';
        }
    } catch (err) {
        errorDiv.innerText = '网络错误，登录失败';
    }
}

// 3. 加载后台留言列表逻辑
async function loadMessages() {
    try {
        const res = await fetch('/api/messages');
        const result = await res.json();
        const messageList = document.getElementById('messageList');
        
        if (result.success && result.messages) {
            messageList.innerHTML = '';
            
            if (result.messages.length === 0) {
                messageList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">暂无客户留言</td></tr>';
                return;
            }

            result.messages.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.time || ''}</td>
                    <td>${item.name || ''}</td>
                    <td>${item.phone || ''}</td>
                    <td>${item.demand || ''}</td>
                `;
                messageList.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('加载留言失败:', err);
    }
}

// 4. 退出登录逻辑
function logout() {
    localStorage.removeItem('yishu_token');
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
}

// 5. 页面加载时自动检查登录状态
window.onload = () => {
    if (localStorage.getItem('yishu_token')) {
        const loginSec = document.getElementById('loginSection');
        const dashSec = document.getElementById('dashboardSection');
        if (loginSec && dashSec) {
            loginSec.style.display = 'none';
            dashSec.style.display = 'block';
            loadMessages();
        }
    }
};