const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// 1. 中间件设置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 自动兼容前端网页路径
let frontendDir = path.join(__dirname, '../frontend');
if (!fs.existsSync(frontendDir)) {
  frontendDir = path.join(__dirname, 'frontend');
}

// 3. 自动检查并创建 data 存储目录（防崩溃）
const dataDir = path.join(__dirname, 'data');
const messagesFilePath = path.join(dataDir, 'messages.json');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(messagesFilePath)) {
  fs.writeFileSync(messagesFilePath, '[]', 'utf8');
}

// 4. 邮件配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: '2263571470@qq.com',
    pass: 'zlbuyvwzqyqtecfe'
  }
});

const RECEIVE_EMAIL = '2263571470@qq.com';

// 5. 核心表单提交处理逻辑（兼容 /api/message 和 /api/send-form）
const handleFormSubmit = (req, res) => {
  try {
    const { name, phone, demand } = req.body;
    
    // 步骤 A：立即保存到本地 JSON 文件供后台读取
    let messages = [];
    try {
      const fileData = fs.readFileSync(messagesFilePath, 'utf8');
      messages = JSON.parse(fileData);
    } catch (e) {
      messages = [];
    }
    messages.unshift({
      time: new Date().toLocaleString(),
      name,
      phone,
      demand
    });
    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');

    // 步骤 B：后台异步发邮件（绝对不加 await，防止被云平台端口拦截导致前端卡死）
    const mailOptions = {
      from: `"易数创培云官网" <2263571470@qq.com>`,
      to: RECEIVE_EMAIL,
      subject: '官网新合作对接需求',
      text: `
客户称呼/公司：${name}
联系电话：${phone}
需求描述：${demand}
      `
    };
    transporter.sendMail(mailOptions).catch(err => {
      console.log('提示: 邮件发送被云平台拦截（正常现象），数据已成功存入后台:', err.message);
    });

    // 步骤 C：秒回前端成功响应
    res.json({ success: true, message: '提交成功！我们的专家团队将在24小时内与您联系' });
  } catch (err) {
    console.error('表单处理出错:', err);
    res.json({ success: false, error: '提交失败，请稍后重试' });
  }
};

// 绑定两个常见的表单提交路径
app.post('/api/message', handleFormSubmit);
app.post('/api/send-form', handleFormSubmit);

// 5.1 后台管理员登录接口（账号：angel，密码：1231）
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'angel' && password === '1231') {
    res.json({ success: true, token: 'angel-token-success' });
  } else {
    res.json({ success: false, error: '账号或密码错误' });
  }
});

// 5.2 获取后台留言列表接口
app.get('/api/messages', (req, res) => {
  try {
    const fileData = fs.readFileSync(messagesFilePath, 'utf8');
    const messages = JSON.parse(fileData);
    res.json({ success: true, messages });
  } catch (err) {
    res.json({ success: false, messages: [] });
  }
});

// 6. 静态网页托管
app.use(express.static(frontendDir));

// 7. 兜底路由
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('未找到 index.html，请检查文件目录。');
  }
});

app.listen(port, () => {
  console.log(`服务已成功启动，运行端口: ${port}`);
});