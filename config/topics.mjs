// 12 个频道定义：关键词驱动的多标签分类器
// 一个条目可以同时属于多个频道（例如“AI 影游创作大赛”同时进 AI影游 + 大厂活动）

export const CHANNELS = [
  {
    id: 'aigc-frontier',
    name: 'AIGC 前沿',
    short: 'AIGC',
    icon: '✦',
    color: '#6ea8fe',
    desc: '大模型、生成式 AI、产品与产业的最新发展',
    keywords: [
      'aigc', '大模型', '生成式', '多模态', 'llm', 'gpt', 'claude', 'gemini', 'deepseek', 'qwen', '通义',
      '豆包', '文心', '混元', 'kimi', 'minimax', '智谱', 'openai', 'anthropic', 'diffusion', '扩散模型',
      'agent', '智能体', 'rag', '微调', 'fine-tun', '推理', '训练', '算力', 'gpu', 'transformer',
      '世界模型', '具身', '机器人', 'sora', 'veo', 'runway', 'midjourney', 'stable diffusion', 'flux',
      '开源模型', 'agi', 'ai 视频', 'ai视频', 'ai 绘画', 'ai绘画', '数字人', '语音合成', 'embedding',
    ],
    weight: 1.0,
  },
  {
    id: 'aigc-skills',
    name: 'AIGC 技巧与做法',
    short: '技巧',
    icon: '⚙',
    color: '#7ee0c0',
    desc: '提示词、工作流、实操方法与落地案例',
    keywords: [
      '教程', '技巧', '提示词', 'prompt', '工作流', 'workflow', '实操', '上手', '入门', '指南', '攻略',
      '怎么用', '如何用', '方法论', '案例拆解', '复盘', '保姆级', '一分钟', '手把手', '避坑', '配置',
      'comfyui', 'coze', 'dify', 'n8n', 'langchain', 'mcp', '插件', '自动化', '部署', '本地部署',
      'ai 编程', 'ai编程', 'vibe coding', 'cursor', 'claude code', 'copilot', 'ai 剪辑', 'ai 设计',
    ],
    weight: 1.1,
  },
  {
    id: 'hackathon',
    name: '全球 AI 黑客松',
    short: '黑客松',
    icon: '⚡',
    color: '#ffd166',
    desc: '世界各地 AI hackathon、创客马拉松、创新赛',
    keywords: [
      'hackathon', '黑客松', 'hack', '创客', '马拉松', '创新大赛', '创新赛', '挑战赛', '挑战杯',
      'devpost', 'lablab', 'mlh', 'major league hacking', '48 hour', '24 hour', 'buildathon',
      '创新创意大赛', '创业大赛', '竞赛', '大赛', '赛事', '报名', '征集',
    ],
    weight: 1.2,
    // 只有命中这些强信号才算黑客松类，避免“报名/征集”泛化
    strong: ['hackathon', '黑客松', '创客马拉松', 'buildathon', 'mlh', 'devpost', 'lablab'],
  },
  {
    id: 'editing',
    name: '剪辑技巧',
    short: '剪辑',
    icon: '✂',
    color: '#ff9ecd',
    desc: '剪辑、调色、声音、AI 后期的最新技术与思路',
    keywords: [
      '剪辑', '后期', '调色', 'premiere', 'adobe', '达芬奇', 'davinci', 'final cut', 'fcpx',
      'ae', 'after effects', '转场', '分镜', '运镜', '卡点', '字幕', '音效', '混音', '响度',
      '影视飓风', '剪映', 'capcut', '视频制作', '短片', '广告片', '调色师', '摄影师', '剪辑师',
      '拍摄技巧', '电影感', 'luts', '降噪', '抠像', '特效', 'vfx', '合成',
    ],
    weight: 1.15,
  },
  {
    id: 'disability',
    name: '残障大学生成长',
    short: '残障',
    icon: '♿',
    color: '#8fd694',
    desc: '残障大学生职业就业、实习成长营、政策与服务',
    keywords: [
      '残疾', '残障', '无障碍', '听障', '视障', '肢残', '孤独症', '自闭症', '盲人', '聋人',
      '特教', '特殊教育', '融合教育', '康复', '助残', '残联', '残疾人证', '手语', '盲文',
      '残健融合', '就业帮扶', '辅助器具', '合理便利', 'accessibility', 'a11y',
    ],
    weight: 1.4,
  },
  {
    id: 'internship',
    name: '实习机会',
    short: '实习',
    icon: '◈',
    color: '#a0b4ff',
    desc: '最新实习岗位、日常实习、暑期实习与内推',
    keywords: [
      '实习', 'intern', 'internship', '日常实习', '暑期实习', '寒假实习', '内推', '校招',
      '管培生', '日常招聘', '岗位', '招聘', '简历', '面试', 'offer', '储备生', '见习',
    ],
    weight: 1.3,
  },
  {
    id: 'gov-jobs',
    name: '考公·考编·央国企',
    short: '考公',
    icon: '⛨',
    color: '#ffb37e',
    desc: '全国残障大学生可报考的公务员、事业编、央国企岗位',
    keywords: [
      '公务员', '考公', '省考', '国考', '选调', '选调生', '事业单位', '事业编', '编制', '参公',
      '央企', '国企', '中央企业', '国家电网', '中国烟草', '烟草', '铁路局', '事业单位招聘',
      '招录', '选聘', '公开遴选', '笔试', '行测', '申论', '面试公告', '体检', '政审', '公示',
      '岗位表', '职位表', '三支一扶', '选调', '基层', '专岗', '定向招录',
    ],
    weight: 1.35,
  },
  {
    id: 'postgrad',
    name: '戏影考研·985',
    short: '考研',
    icon: '🎓',
    color: '#c8a2ff',
    desc: '戏剧与影视专业 985 院校最新消息、竞争情况、初试复试资料',
    keywords: [
      '戏剧与影视', '戏剧影视', '电影', '广播电视', '考研', '硕士研究生', '研究生招生', '推免',
      '夏令营', '复试', '初试', '调剂', '复试线', '复试名单', '拟录取', '招生简章', '招生目录',
      '考试大纲', '参考书目', '专业课', '初试科目', '专业硕士', 'mfa', '艺术硕士', '戏剧',
      '影视学', '报考人数', '报录比', '分数线', '国家线', '自划线', '复试细则', '硕士',
    ],
    weight: 1.45,
  },
  {
    id: 'bigtech',
    name: '大厂活动·比赛',
    short: '大厂',
    icon: '◆',
    color: '#7fd1ff',
    desc: '互联网大厂线上线下活动、开放日、开发者大会与赛事',
    keywords: [
      '腾讯', '阿里', '阿里云', '字节', '字节跳动', '抖音', '百度', '华为', '小米', '美团', '京东',
      '快手', '网易', 'b站', '哔哩哔哩', 'pdd', '拼多多', '滴滴', '蚂蚁', '火山引擎', '飞书',
      '开发者大会', '云栖', '天池', '腾讯云', '开放日', '沙龙', 'meetup', '发布会', '招募',
      '奖学金', '校园大使', '训练营', '工作坊', '论坛', '峰会', '大会',
    ],
    weight: 1.2,
  },
  {
    id: 'ai-app-competition',
    name: 'AI 应用开发竞赛',
    short: 'AI应用赛',
    icon: '▶',
    color: '#ff8f8f',
    desc: 'AI 应用、Agent、大模型应用开发类比赛与活动',
    keywords: [
      'ai 应用', 'ai应用', '应用开发', '智能体开发', 'agent 开发', '大模型 应用', '应用创新',
      '开发者大赛', '算法大赛', '数据竞赛', 'kaggle', 'datafountain', '天池', 'aistudio',
      '飞桨', '昇腾', '国产化', '模型应用', 'ai 挑战赛', 'ai挑战赛', '创新应用', 'hack',
    ],
    weight: 1.25,
  },
  {
    id: 'ai3d-game',
    name: 'AI 3D / 游戏开发',
    short: '3D游戏',
    icon: '◉',
    color: '#9be3ff',
    desc: 'AI 3D 生成、游戏开发、Game Jam 与相关赛事',
    keywords: [
      '3d', '三维', '建模', 'blender', 'ue5', 'unreal', 'unity', '虚幻引擎', '游戏开发',
      'game jam', 'gamejam', '游戏创作', '独立游戏', 'indie', '游戏设计', '关卡', '美术资产',
      'gis', '数字孪生', '元宇宙', '虚拟现实', 'vr', 'ar', 'xr', '拓展现实', '渲染', '引擎',
      '游戏大赛', '游戏创意', '游戏制作', '玩家', 'itch.io', 'steam',
    ],
    weight: 1.25,
  },
  {
    id: 'ai-film-game',
    name: 'AI 影游·互动影像',
    short: '影游',
    icon: '❖',
    color: '#ffc46b',
    desc: 'AI 影视、互动影游、AIGC 影像创作比赛与展映',
    keywords: [
      '影游', '互动影游', '互动影像', '互动剧', '短剧', '微短剧', 'ai 短片', 'ai短片', 'ai 电影',
      'ai电影', 'ai 影视', 'ai影视', '影像', '短片节', '电影节', '展映', '影像大赛', '影视大赛',
      '动漫', '漫剧', '动画', '国创', '数字艺术', '生成式影像', 'sora 影片', 'ai 创作',
    ],
    weight: 1.3,
  },
];

export const CHANNEL_MAP = Object.fromEntries(CHANNELS.map((c) => [c.id, c]));

/** 关键词 → 频道索引（构建一次，供快速匹配） */
const INDEX = CHANNELS.map((c) => ({
  id: c.id,
  weight: c.weight,
  strong: c.strong || null,
  kws: c.keywords.map((k) => k.toLowerCase()),
}));

/** 命中频道并打分 */
export function matchChannels(text, opts = {}) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  const hits = [];
  for (const ch of INDEX) {
    let score = 0;
    let strongHit = false;
    for (const kw of ch.kws) {
      if (t.includes(kw)) {
        score += kw.length >= 4 ? 2 : 1;
        if (ch.strong && ch.strong.some((s) => kw.includes(s.toLowerCase()))) strongHit = true;
      }
    }
    if (score === 0) continue;
    // 有 strong 白名单的频道，必须命中强信号
    if (ch.strong && !strongHit) {
      // 仍允许来自“已知赛事类源”的条目进入（由 opts.trustedCompetition 控制）
      if (!opts.trustedCompetition) continue;
      score = Math.max(1, Math.round(score / 2));
    }
    hits.push({ id: ch.id, score: score * ch.weight });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits;
}
