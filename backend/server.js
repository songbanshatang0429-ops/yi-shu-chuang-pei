const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let frontendDir = path.join(__dirname, '../frontend');
if (!fs.existsSync(frontendDir)) {
  frontendDir = path.join(__dirname, 'frontend');
}

const dataDir = path.join(__dirname, 'data');
const messagesFilePath = path.join(dataDir, 'messages.json');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(messagesFilePath)) {
  fs.writeFileSync(messagesFilePath, '[]', 'utf8');
}

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

const handleFormSubmit = (req, res) => {
  try {
    const { name, phone, demand } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: '称呼和联系电话不能为空' });
    }

    let messages = [];
    try {
      if (fs.existsSync(messagesFilePath)) {
        messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf8'));
      }
    } catch (e) {
      messages = [];
    }

    messages.unshift({
      time: new Date().toLocaleString(),
      name,
      phone,
      demand: demand || '无'
    });

    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');

    const mailOptions = {
      from: `"易数创培云官网" <2263571470@qq.com>`,
      to: RECEIVE_EMAIL,
      subject: '官网新合作对接需求',
      text: `客户称呼/公司：${name}\n联系电话：${phone}\n需求描述：${demand || '无'}`
    };
    transporter.sendMail(mailOptions).catch(err => {
      console.log('[提示] 邮件发送被拦截（正常现象），数据已成功保存至后台。');
    });

    return res.json({ success: true, message: '提交成功！我们的专家团队将在24小时内与您联系' });
  } catch (err) {
    console.error('表单处理异常:', err);
    return res.status(500).json({ success: false, error: '服务器处理失败，请稍后重试' });
  }
};

app.post('/api/message', handleFormSubmit);
app.post('/api/send-form', handleFormSubmit);

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'angel' && password === '1231') {
    return res.json({ success: true, token: 'angel-token-success' });
  }
  return res.status(401).json({ success: false, error: '账号或密码错误' });
});

app.get('/api/messages', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    if (!fs.existsSync(messagesFilePath)) {
      return res.json({ success: true, messages: [] });
    }
    const messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf8'));
    return res.json({ success: true, messages });
  } catch (err) {
    console.error('获取留言列表失败:', err);
    return res.json({ success: false, messages: [] });
  }
});

app.use(express.static(frontendDir));

app.get('*', (req, res) => {
  const indexPath = path.join(frontendDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('未找到 index.html');
  }
});

app.listen(port, () => {
  console.log(`服务已成功启动，运行端口: ${port}`);
});