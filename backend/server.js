const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

// 解析 JSON 与表单请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保数据目录与文件存在
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// 静态托管前端代码目录
app.use(express.static(path.join(__dirname, '../frontend')));

// =========================================
// 管理后台 Token 登录与安全校验 (账号: angel | 密码: 1231)
// =========================================

// 1. 登录验证接口
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'angel' && password === '1231') {
        return res.json({ success: true, token: 'TOKEN_ANGEL_SECURE_KEY_1231' });
    }
    return res.status(401).json({ success: false, error: '账号或密码错误！' });
});

// 2. Token 安全拦截中间件
const verifyToken = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token === 'TOKEN_ANGEL_SECURE_KEY_1231') {
        return next();
    }
    return res.status(401).json({ success: false, error: '未登录或登录已失效，请重新登录' });
};

// API: 提交合作对接信息 (公开接口，客户均可提交)
app.post('/api/message', (req, res) => {
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

        res.json({ success: true, message: '您的对接申请已提交成功！我们的团队将尽快与您联系。' });
    } catch (err) {
        console.error('保存留言失败:', err);
        res.status(500).json({ success: false, error: '服务器内部错误，保存失败' });
    }
});

// API: 获取所有合作对接记录（受 Token 保护，需要登录）
app.get('/api/messages', verifyToken, (req, res) => {
    try {
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        const messages = JSON.parse(fileData || '[]');
        res.json({ success: true, data: messages });
    } catch (err) {
        console.error('读取留言失败:', err);
        res.status(500).json({ success: false, error: '读取数据失败' });
    }
});

// API: 删除指定的对接记录（受 Token 保护，需要登录）
app.delete('/api/messages/:id', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        let messages = JSON.parse(fileData || '[]');
        messages = messages.filter(m => m.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');
        res.json({ success: true, message: '记录已成功删除' });
    } catch (err) {
        console.error('删除留言失败:', err);
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

// 监听服务端口
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});