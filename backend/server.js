const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================
// 🔑 1. 数据库与 Server 酱微信推送配置
// =========================================
const MONGO_URI = 'mongodb+srv://songbanshatang0429_db_user:UIJ12cKfRrQUZdMn@yishuchuangpei.hg7lqvh.mongodb.net/yishuchuangpei?retryWrites=true&w=majority';
const SERVERCHAN_SENDKEY = 'SCT387496TzDdLvYtCVIYQJCe9kB5uuFn1';

// 连接 MongoDB 免费云数据库
mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 MongoDB 云数据库连接成功！数据将永久保存！'))
    .catch(err => console.error('❌ 数据库连接失败:', err));

// 定义数据库中的记录结构
const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    demand: { type: String, default: '无特定描述' },
    createdAt: { type: String, default: () => new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) }
});

const Message = mongoose.model('Message', MessageSchema);

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

// 提交合作对接申请 API（存入云数据库 + 触发微信弹窗推送）
app.post('/api/message', async (req, res) => {
    try {
        const { name, phone, demand } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, error: '姓名与联系电话为必填项' });
        }

        // 1. 永久保存数据到云数据库
        const newMessage = await Message.create({ name, phone, demand });

        // 2. 异步触发 Server酱 微信推送
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
            }).catch(err => console.error('❌ 微信推送失败:', err));
        }

        res.json({ success: true, message: '您的对接申请已提交成功！我们的团队将尽快与您联系。' });
    } catch (err) {
        console.error('保存失败:', err);
        res.status(500).json({ success: false, error: '服务器内部错误' });
    }
});

// 管理后台从云数据库获取全部历史记录
app.get('/api/messages', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find().sort({ _id: -1 });
        const formatted = messages.map(m => ({
            id: m._id.toString(),
            name: m.name,
            phone: m.phone,
            demand: m.demand,
            createdAt: m.createdAt
        }));
        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: '读取云数据库失败' });
    }
});

// 管理后台删除记录
app.delete('/api/messages/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndDelete(id);
        res.json({ success: true, message: '记录已成功删除' });
    } catch (err) {
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));