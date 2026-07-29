// 1. 丝滑滚动出现动画 (Intersection Observer)
document.addEventListener("DOMContentLoaded", () => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, { threshold: 0.1 });
    reveals.forEach(reveal => observer.observe(reveal));
});

// 2. 客户提交表单逻辑
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('formMsg');
        const data = {
            name: document.getElementById('cusName').value,
            phone: document.getElementById('cusPhone').value,
            demand: document.getElementById('cusDemand').value
        };

        try {
            msgDiv.style.color = '#333';
            msgDiv.innerText = '正在发送中...';
            const res = await fetch('https://yishuchuangpei.onrender.com/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                msgDiv.style.color = 'green';
                msgDiv.innerText = result.message;
                contactForm.reset();
            } else {
                msgDiv.style.color = 'red';
                msgDiv.innerText = result.error;
            }
        } catch (err) {
            msgDiv.style.color = 'red';
            msgDiv.innerText = '网络错误，请稍后再试';
        }
    });
}

// 3. 后台管理员登录逻辑
async function login() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const errorDiv = document.getElementById('loginError');

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
        errorDiv.innerText = result.error;
    }
}

// 4. 后台读取客户留言
async function loadMessages() {
    const token = localStorage.getItem('yishu_token');
    if (!token) return;

    const res = await fetch('/api/messages', {
        headers: { 'Authorization': token }
    });
    
    if (res.status === 401) {
        logout(); return;
    }
    
    const messages = await res.json();
    const tbody = document.getElementById('messageList');
    tbody.innerHTML = '';
    
    messages.forEach(msg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color:#888; font-size:0.9em;">${msg.date}</td>
            <td style="font-weight:bold;">${msg.name}</td>
            <td>${msg.phone}</td>
            <td>${msg.demand}</td>
        `;
        tbody.appendChild(tr);
    });
}

function logout() {
    localStorage.removeItem('yishu_token');
    location.reload();
}

// 如果已经在后台页面且有token，直接显示面板
if (window.location.pathname.includes('admin.html') && localStorage.getItem('yishu_token')) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    loadMessages();
}
