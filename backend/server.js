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

// 4. 邮件配置（QQ邮箱）
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

// 5. 表单提交接口
app.post('/api/send-form', async (req, res) => {
  try {
    const { name, phone, demand } = req.body;
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
    await transporter.sendMail(mailOptions);
    res.json({ success: true, msg: '提交成功' });
  } catch (err) {
    console.error('发送邮件失败:', err);
    res.json({ success: false, msg: '提交失败，请稍后重试' });
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