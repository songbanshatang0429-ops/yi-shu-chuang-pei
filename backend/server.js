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

// 5. 核心表单提交处理逻辑
const handleFormSubmit = (req, res) => {
  try {
    const { name, phone, demand } = req.body;
    console.收到表单提交数据:`, { name, phone, demand });

    // 读取现有留言
    let messages = [];
    try {
      if (fs.existsSync(messagesFilePath)) {
        const fileData = fs.readFileSync(messagesFilePath, 'utf8');
        messages = JSON.parse(fileData);
      }
    } catch (e) {
      console.error('读取 messages.json 失败:', e);
      messages = [];
    }

    // 压入新留言
    messages.unshift({
      time: new Date().toLocaleString(),
      name,
      phone,
      demand
    });

    // 写入文件
    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');
    console.log('数据已成功写入 messages.json，当前总条数:', messages.length);

    // 后台异步发邮件（被 Render 拦截不影响保存）
    const mailOptions = {
      from: `"易数创培云官网" <2263571470@qq.com>`,
      to: RECEIVE_EMAIL,
      subject: '官网新合作对接需求',
      text: `客户称呼/公司：${name}\n联系电话：${phone}\n需求描述：${demand}`
    };
    transporter.sendMail(mailOptions).catch(err => {
      console.log('提示: 邮件发送被云平台拦截（正常现象）:', err.message);
    });

    res.json({ success: true, message: '提交成功！我们的专家团队将在24小时内与您联系' });
  } catch (err) {
    console.error('表单处理出错:', err);
    res.json({ success: false, error: '提交失败，请稍后重试' });
  }
};

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
    if (!fs.existsSync(messagesFilePath)) {
      return res.json({ success: true, messages: [] });
    }
    const fileData = fs.readFileSync(messagesFilePath, 'utf8');
    const messages = JSON.parse(fileData);
    console.log('后台正在获取留言列表，当前条数:', messages.length);
    res.json({ success: true, messages });
  } catch (err) {
    console.error('获取留言列表失败:', err);
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