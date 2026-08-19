// frontend/js/main.js

// 二级服务菜单的数据字典（PDF 详细内容映射）
const serviceDetailsMap = {
    'video-1': {
        title: '01 海外游戏视频制作',
        badge: '视频与录制 · 创意出海',
        desc: '面向 TikTok、YouTube 等海外主流社媒平台，提供专业化的游戏短视频剪辑、创意二创、混剪以及品牌活动宣传视频制作服务，精准适配海外用户审美与传播节奏。',
        features: [
            '深度适配 TikTok / Shorts 竖屏爆款节奏',
            '海外本地化视觉风格与买量广告剪辑',
            '游戏二创、高能时刻混剪与宣传片制作'
        ],
        sop: '需求沟通 -> 脚本制作 -> 游戏画面采集 -> 剪辑包装 -> 企业标准审核交付'
    },
    'video-2': {
        title: '02 多语种录音与标注',
        badge: '视频与录制 · AI 数据服务',
        desc: '提供多语种语音采集、精准转写、人工校对及专业数据标注服务，产出高质量结构化语音数据，全方位满足 AI 模型训练、语音交互系统开发的核心数据需求。',
        features: [
            '覆盖英语、日语、东南亚语等多元语种采集',
            '高精度时间轴对齐与人工多轮交叉校验',
            '适配大模型 Audio AI 训练的高标准标注'
        ],
        sop: '数据规范制定 -> 多语种团队采集 -> 智能转写 -> 人工严格校验标注 -> 格式交付'
    },
    'video-3': {
        title: '03 游戏素材专业录制',
        badge: '视频与录制 · 专业运镜',
        desc: '承接游戏高光操作片段、核心角色技能特效展示、皮肤外观演示以及新手引导教程等多元化素材录制，以专业运镜与画面呈现，为游戏宣发与内容传播赋能。',
        features: [
            '专业高帧率 4K/60帧 画质帧级录制',
            '角色高光、特效演示、皮肤展示全角度运镜',
            '适配宣发素材库的规范化分集与命名管理'
        ],
        sop: '脚本对齐 -> 游戏账号与环境部署 -> 运镜录制 -> 格式转码 -> 素材整理归档'
    },
    'ai-1': {
        title: '01 3D白模Layout采集',
        badge: 'AI 与设计 · 空间多模态',
        desc: '参与 3D 场景与模型的布局规划设计，制作 3D Layout 动画等多模态数据的采集与整理工作，为 AI 训练和场景构建提供精准的基础素材。',
        features: [
            '3D 场景布局规划与白模搭设',
            '多模态 3D Layout 轨迹与帧动画数据采集',
            '为空间大模型与具身智能提供高质数据支撑'
        ],
        sop: '场景设计 -> 3D建模白模搭建 -> 轨迹动画录制 -> 数据清洗标记 -> 交付'
    },
    'ai-2': {
        title: '02 AI短剧生成全流程',
        badge: 'AI 与设计 · 一体化管线',
        desc: '依托 AI 技术实现短剧剧本智能策划、分镜画面自动生成、AI 配音合成及后期剪辑一体化，大幅缩短制作周期，降低内容生产的人力成本。',
        features: [
            'AI 剧本生成与分镜脚本自动解构',
            '高一致性角色 AI 生图与视频渲染',
            'AI 音频合成 + 后期专业剪辑合成'
        ],
        sop: 'AI剧本创作 -> 角色分镜生成 -> AI视频渲染 -> 音频拟音 -> 剪辑调色'
    },
    'ai-3': {
        title: '03 AI解说漫翻译适配',
        badge: 'AI 与设计 · 全球化传播',
        desc: '利用 AI 大模型完成视频解说词的多语种精准互译，同步生成适配不同文化语境的字幕，并提供本地化风格调校，助力内容全球化传播。',
        features: [
            '基于 LLM 的跨文化自然语境互译',
            '动态字幕对齐与本地化配音调色',
            '支持多国语言一键批量生成与排版'
        ],
        sop: '解说词提取 -> 大模型精准翻译 -> 本地化语境润色 -> 字幕音频合成'
    },
    'ai-4': {
        title: '04 全场景平面设计服务',
        badge: 'AI 与设计 · 高效视觉',
        desc: '提供海报、封面图、社媒配图、产品详情页等全品类平面设计，同时支持多尺寸套图批量修改与风格统一，满足品牌多元化视觉需求。',
        features: [
            'AI 辅助设计，大幅提升出图效率',
            '支持海报、社媒、电商详情页全品类适配',
            '批量多尺寸套图改版与统一视觉风格'
        ],
        sop: '视觉定位 -> 模版设计/AI生成 -> 批量尺寸适配 -> 资深工程师审核'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. 一级 Tab 切换逻辑
    const tabBtns = document.querySelectorAll('.biz-tab-btn');
    const bizPanels = document.querySelectorAll('.biz-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            bizPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. 合作对接表单提交逻辑（支持 Base64 附件上传）
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const cusName = document.getElementById('cusName').value.trim();
        const cusPhone = document.getElementById('cusPhone').value.trim();
        const cusDemand = document.getElementById('cusDemand').value.trim();
        const fileInput = document.getElementById('attachmentInput');

        if (!cusName || !cusPhone) {
            alert('请填写姓名/公司名称与联系电话！');
            return;
        }

        let fileDataObj = null;

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const selectedFile = fileInput.files[0];

            if (selectedFile.size > 20 * 1024 * 1024) {
                alert('附件文件大小不能超过 20MB！');
                return;
            }

            try {
                const base64Str = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (evt) => resolve(evt.target.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(selectedFile);
                });

                fileDataObj = {
                    fileName: selectedFile.name,
                    fileData: base64Str
                };
            } catch (err) {
                console.error('读取附件失败:', err);
                alert('附件读取失败，请重新选择文件！');
                return;
            }
        }

        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>提交中，请稍候...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const res = await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cusName,
                    phone: cusPhone,
                    demand: cusDemand,
                    file: fileDataObj
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('🎉 您的对接申请及附件已成功提交！我们的团队将尽快与您联系。');
                contactForm.reset();
            } else {
                alert('❌ 提交失败：' + (data.error || '未知错误'));
            }
        } catch (err) {
            console.error('提交请求网络错误:', err);
            alert('❌ 网络请求失败，请检查网络连接！');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});

// 3. 打开二级菜单详情 Modal
function openDetailModal(key) {
    const detail = serviceDetailsMap[key];
    if (!detail) return;

    const modalBody = document.getElementById('modalBody');
    let featuresHtml = detail.features.map(f => `<li>${f}</li>`).join('');

    modalBody.innerHTML = `
        <span class="modal-detail-badge">${detail.badge}</span>
        <h3 class="modal-detail-title">${detail.title}</h3>
        <p class="modal-detail-desc">${detail.desc}</p>
        
        <div class="modal-detail-section">
            <h4><i class="fa-solid fa-circle-check"></i> 服务核心优势与亮点</h4>
            <ul>${featuresHtml}</ul>
        </div>

        <div class="modal-detail-section">
            <h4><i class="fa-solid fa-gears"></i> 标准化 SOP 交付流程</h4>
            <p style="font-size: 0.88rem; color: #aaa; margin: 0;">${detail.sop}</p>
        </div>
    `;

    document.getElementById('detailModal').classList.add('active');
    document.body.style.overflow = 'hidden'; // 阻止背景滚动
}

// 4. 关闭二级菜单详情 Modal
function closeDetailModal(event) {
    if (event.target.id === 'detailModal') {
        closeDetailModalDirect();
    }
}

function closeDetailModalDirect() {
    document.getElementById('detailModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}