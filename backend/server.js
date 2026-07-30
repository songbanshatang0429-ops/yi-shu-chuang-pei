const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 💡 调高传输限制至 35MB（满足 20MB 附件转换为 Base64 后的传输需求）
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// =========================================
// 🔑 1. 数据库与 Server 酱微信推送配置
// =========================================
const MONGO_URI = 'mongodb+srv://songbanshatang0429_db_user:UIJ12cKfRrQUZdMn@yishuchuangpei.hg7lqvh.mongodb.net/yishuchuangpei?retryWrites=true&w=majority';
const SERVERCHAN_SENDKEY = 'SCT387496TzDdLvYtCVIYQJCe9kB5uuFn1';

// 连接 MongoDB 免费云数据库
mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 MongoDB 云数据库连接成功！数据与大附件将永久保存！'))
    .catch(err => console.error('❌ 数据库连接失败:', err));

// 定义数据库中的记录结构
const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    demand: { type: String, default: '无特定描述' },
    file: {
        fileId: { type: mongoose.Schema.Types.ObjectId, default: null }, // GridFS 云文件 ID
        fileName: { type: String, default: null }
    },
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
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token === 'TOKEN_ANGEL_SECURE_KEY_1231') {
        return next();
    }
    return res.status(401).json({ success: false, error: '未登录或登录已失效' });
};

// 提交合作对接申请 API（附件使用 GridFS 存储在 MongoDB 云端，隔绝方糖）
app.post('/api/message', async (req, res) => {
    try {
        const { name, phone, demand, file } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, error: '姓名与联系电话为必填项' });
        }

        let fileInfo = null;

        // 如果包含附件，采用 GridFS 大文件分片存储机制
        if (file && file.fileData && file.fileName) {
            const base64Data = file.fileData.replace(/^data:.*;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
            const uploadStream = bucket.openUploadStream(file.fileName);

            await new Promise((resolve, reject) => {
                uploadStream.on('finish', resolve);
                uploadStream.on('error', reject);
                uploadStream.end(buffer);
            });

            fileInfo = {
                fileId: uploadStream.id,
                fileName: file.fileName
            };
        }

        // 1. 永久保存主数据至 MongoDB 云数据库
        const newMessage = await Message.create({
            name,
            phone,
            demand,
            file: fileInfo
        });

        // 2. 异步触发 Server酱 微信推送（仅推送纯文字，决不传输附件数据）
        if (SERVERCHAN_SENDKEY) {
            const hasAttachmentText = (fileInfo && fileInfo.fileName) 
                ? `📎 **附件提示**：已上传《${fileInfo.fileName}》（请登录后台下载）` 
                : `📎 **附件提示**：未上传附件`;

            const pushTitle = `🚀 收到新客户申请：${name}`;
            const pushDesp = `**提交时间**：${newMessage.createdAt}\n\n` +
                             `**客户称呼/公司**：${name}\n\n` +
                             `**联系电话**：${phone}\n\n` +
                             `**需求描述**：${demand || '无特定描述'}\n\n` +
                             `${hasAttachmentText}`;

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

// 管理后台文件下载 API
app.get('/api/files/:id', verifyToken, async (req, res) => {
    try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
        const _id = new mongoose.Types.ObjectId(req.params.id);
        const files = await bucket.find({ _id }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).send('文件不存在');
        }

        const fileName = files[0].filename;
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

        bucket.openDownloadStream(_id).pipe(res);
    } catch (err) {
        console.error('下载文件失败:', err);
        res.status(500).send('下载失败');
    }
});

// 管理后台获取记录列表
app.get('/api/messages', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find().sort({ _id: -1 });
        const formatted = messages.map(m => ({
            id: m._id.toString(),
            name: m.name,
            phone: m.phone,
            demand: m.demand,
            file: m.file && m.file.fileId ? { fileId: m.file.fileId.toString(), fileName: m.file.fileName } : null,
            createdAt: m.createdAt
        }));
        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: '读取云数据库失败' });
    }
});

// 管理后台删除记录（自动同步删除云端的 GridFS 附件）
app.delete('/api/messages/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);

        if (message && message.file && message.file.fileId) {
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' });
            await bucket.delete(new mongoose.Types.ObjectId(message.file.fileId)).catch(err => console.error('删除云端附件失败:', err));
        }

        await Message.findByIdAndDelete(id);
        res.json({ success: true, message: '记录与附件已成功删除' });
    } catch (err) {
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));