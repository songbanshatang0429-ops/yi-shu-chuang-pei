const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================
// 📱 微信推送 Key (Server酱 SendKey)
// =========================================
const SERVERCHAN_SENDKEY = 'SCT387496TzDdLvYtCVIYQJCe9kB5uuFn1';

// 确保数据存储目录存在
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// 静态托管前端代码目录
app.use(express.static(path.join(__dirname, '../frontend')));

// 管理后台登录接口 (账号: angel / 密码: 1231)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'angel' && password === '1231') {
        return res.json({ success: true, token: 'TOKEN_ANGEL_SECURE_KEY_1231' });
    }
    return res.status(401).json({ success: false, error: '账号或密码错误！' });
});

const verifyToken = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token === 'TOKEN_ANGEL_SECURE_KEY_1231') {
        return next();
    }
    return res.status(401).json({ success: false, error: '未登录或登录已失效' });
};

// 提交合作对接申请 API
app.post('/api/message', async (req, res) => {
    try {
        const { name, phone, demand } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, error: '姓名与联系电话为必填项' });
        }

        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        const messages = JSON.parse(fileData || '[]');

        const newMessage = {
            id: Date.now().toString(),
            name,
            phone,
            demand: demand || '无特定描述',
            createdAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        };

        messages.unshift(newMessage);
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');

        // 🚀 通过 HTTPS API 异步推送微信弹窗（100% 穿透 Render 限制）
        if (SERVERCHAN_SENDKEY) {
            const pushTitle = `🚀 收到新客户申请：${name}`;
            const pushDesp = `**提交时间**：${newMessage.createdAt}\n\n` +
                             `**客户称呼/公司**：${name}\n\n` +
                             `**联系电话**：${phone}\n\n` +
                             `**需求描述**：${demand || '无特定描述'}`;

            fetch(`https://sctapi.ftqq.com/${SERVERCHAN_SENDKEY}.send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    title: pushTitle,
                    desp: pushDesp
                })
            }).then(r => r.json()).then(data => {
                console.log('📱 微信推送响应:', data);
            }).catch(err => {
                console.error('❌ 微信推送失败:', err);
            });
        }

        res.json({ success: true, message: '您的对接申请已提交成功！我们的团队将尽快与您联系。' });
    } catch (err) {
        console.error('保存失败:', err);
        res.status(500).json({ success: false, error: '服务器内部错误' });
    }
});

// 管理后台获取记录列表
app.get('/api/messages', verifyToken, (req, res) => {
    try {
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        res.json({ success: true, data: JSON.parse(fileData || '[]') });
    } catch (err) {
        res.status(500).json({ success: false, error: '读取数据失败' });
    }
});

// 管理后台删除指定记录
app.delete('/api/messages/:id', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        let messages = JSON.parse(fileData || '[]');
        messages = messages.filter(m => m.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');
        res.json({ success: true, message: '记录已成功删除' });
    } catch (err) {
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});