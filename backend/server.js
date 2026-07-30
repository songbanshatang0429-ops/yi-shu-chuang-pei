const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================
// 📧 邮箱与授权码已直接填入
// =========================================
const MY_EMAIL = '2263571470@qq.com';
const MY_PASS = 'rgonkirgkuxyebdg';
const RECEIVE_EMAIL = '2263571470@qq.com';

// 创建 QQ 邮箱 SMTP 发送器
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: MY_EMAIL,
        pass: MY_PASS
    }
});

// 确保数据存储目录存在
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// 静态托管前端代码目录
app.use(express.static(path.join(__dirname, '../frontend')));

// 后台登录接口
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

        // 🚀 触发邮件提醒（后台异步发送，不拖慢前端展示）
        const mailOptions = {
            from: `"易数创培云官网" <${MY_EMAIL}>`,
            to: RECEIVE_EMAIL,
            subject: `🔔 收到新的合作申请：${name} (${phone})`,
            html: `
                <div style="padding: 24px; background: #0c0d10; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="color: #ff334b; margin-top: 0;">🚀 易数创培云 - 收到新的合作对接申请</h2>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
                    <p style="margin: 8px 0; color: #a1a1aa;"><strong>提交时间：</strong> ${newMessage.createdAt}</p>
                    <p style="margin: 8px 0; color: #a1a1aa;"><strong>客户称呼/公司：</strong> <span style="color: #ffffff; font-weight: bold; font-size: 1.1em;">${name}</span></p>
                    <p style="margin: 8px 0; color: #a1a1aa;"><strong>联系电话：</strong> <span style="color: #ff7875; font-weight: bold; font-size: 1.1em;">${phone}</span></p>
                    <p style="margin: 8px 0; color: #a1a1aa;"><strong>需求描述：</strong></p>
                    <blockquote style="background: #16181d; padding: 14px; border-left: 4px solid #ff334b; margin: 10px 0 0 0; color: #f4f4f5; border-radius: 4px;">
                        ${demand || '无特定描述'}
                    </blockquote>
                </div>
            `
        };

        transporter.sendMail(mailOptions).then(() => {
            console.log('📧 邮件通知发送成功！');
        }).catch(err => {
            console.error('❌ 邮件发送失败:', err);
        });

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