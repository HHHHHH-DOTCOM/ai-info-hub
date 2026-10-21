// 频道判定 v2：强关键词优先、泛词降权、真负面词否决、来源信号加成
import { CHANNELS } from './topics.mjs';

/** 每条频道规则：strong（命中即强）, weak（弱信号，需 >=2 或配合来源）, deny（否决） */
export const RULES = {
  'aigc-frontier': {
    strong: [
      '大模型', '生成式ai', '生成式 ai', 'aigc', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'deepseek',
      'qwen', '通义千问', '文心一言', '豆包', '混元', 'kimi', 'minimax', '智谱', 'openai', 'anthropic',
      '扩散模型', 'diffusion', '多模态', '世界模型', '智能体', 'ai agent', 'agentic', 'sora', 'veo',
      'midjourney', 'stable diffusion', 'flux', '文生图', '文生视频', '图生视频', '数字人', '具身智能',
      'agi', '模型发布', '开源模型', '推理模型', '算力', 'gpu集群', 'transformer',
    ],
    weak: ['ai', '人工智能', '模型', '算法', '训练', '推理', '芯片', '机器人', 'nvidia', '英伟达', 'meta'],
    deny: [],
    sourceBoost: ['qbitai', 'qbitai-news', 'jiqizhixin', 'openai', 'googleai', 'techcrunch-ai', 'venturebeat-ai', 'verge-ai', 'mittr-ai', 'infoq', 'geekpark'],
  },
  'aigc-skills': {
    strong: [
      '提示词', 'prompt工程', 'prompt', '工作流', 'workflow', 'comfyui', 'coze', 'dify', 'n8n', 'langchain',
      'mcp', 'vibe coding', 'cursor', 'claude code', 'copilot', 'ai编程', 'ai 编程', 'ai剪辑', 'ai 剪辑',
      '保姆级', '手把手', '实操教程', '教程来了', '案例拆解', '落地实践', '最佳实践', '避坑', '一键部署',
      '本地部署', '微调', 'fine-tune', 'rag', '知识库', '智能体搭建', '自动化流程',
    ],
    weak: ['教程', '技巧', '指南', '攻略', '方法', '入门', '上手', '怎么用', '如何', '实操', '实践', '工具推荐', '效率'],
    deny: [],
    sourceBoost: ['infoq', 'sspai', 'woshipm', 'oschina', 'zhihu-daily', 'github-trending', 'hn'],
  },
  hackathon: {
    strong: [
      'hackathon', '黑客松', 'hackathon 2026', '创客马拉松', 'buildathon', 'mlh', 'devpost', 'lablab',
      'game jam', 'gamejam', 'hack week', '48小时', '24小时挑战', '创客大赛',
    ],
    weak: ['竞赛', '大赛', '赛事', '挑战赛', '创新赛', '报名', '征集', '比赛'],
    deny: ['促销', '优惠', '团购'],
    sourceBoost: ['devpost-1', 'devpost-2', 'devpost-3', 'devpost-upcoming', '52jingsai'],
  },
  editing: {
    strong: [
      '剪辑', '剪辑师', '调色', '达芬奇', 'davinci resolve', 'premiere', 'final cut', 'fcpx',
      'after effects', '转场', '分镜', '运镜', '卡点', '混音', '音效设计', '响度', 'luts', '抠像',
      '影视飓风', '剪映', 'capcut', '视频制作', '电影感', 'vfx', '合成师', '后期制作', '剪辑技巧',
      '调色技巧', '拍摄技巧', '音频质感', '剪辑软件',
    ],
    weak: ['后期', '拍摄', '短片', '广告片', '摄影', '字幕', '特效', '画面', '镜头', '电影'],
    deny: ['首发评测', '开箱', '降价', '销量', '芯片曝光', '跑分', '续航', '像素', '上市', '真机图'],
    sourceBoost: ['xinpianchang', 'xinpianchang-aigc'],
  },
  disability: {
    strong: [
      '残疾', '残障', '无障碍', '听障', '视障', '肢残', '孤独症', '自闭症', '盲人', '聋人', '手语',
      '盲文', '残联', '助残', '特教', '特殊教育', '融合教育', '残健融合', '辅助器具', '合理便利',
      'accessibility', '残疾人证', '残疾人就业', '残疾人事业', '残疾预防',
    ],
    weak: ['康复', '就业帮扶', '公益', '志愿服务', '公益组织', '帮扶'],
    deny: [],
    sourceBoost: ['cdpf-news', 'cdpf-local', 'cdpf-notice', 'cdpf-ywpd'],
  },
  internship: {
    strong: [
      '实习', '实习生', 'internship', '日常实习', '暑期实习', '寒假实习', '内推', '校招',
      '管培生', '储备生', '见习', '校园招聘', '实习招聘', '实习岗位', '招聘实习生',
    ],
    weak: ['招聘', '岗位', '简历', '面试', 'offer', '入职', '薪资', '求职', '职业发展', '招募'],
    deny: ['招聘会圆满', '招聘会举办', '招聘启事（', '事业单位招聘', '公开招聘工作人员'],
    sourceBoost: ['shixiseng-ai', 'shixiseng-jianji', 'shixiseng-youxia', 'shixiseng-sheji'],
  },
  'gov-jobs': {
    strong: [
      '公务员', '国考', '省考', '选调生', '选调', '事业单位', '事业编', '参公', '公开遴选', '遴选',
      '中央企业', '央企', '国企招聘', '国有企业', '国家电网', '中国烟草', '烟草专卖', '铁路局',
      '三支一扶', '职位表', '岗位表', '招录公告', '拟录用', '笔试成绩', '行测', '申论', '政审',
      '定向招录', '残疾人专岗', '招聘公告', '招聘启事', '公开选调', '考核招聘', '招聘工作人员',
    ],
    weak: ['编制', '招录', '选聘', '公开招考', '公告', '公示', '体检', '面试', '聘用'],
    deny: ['公务员考试培训', '培训班', '网课', '优惠', '发电量', '大桥合龙', '投产', '开工建设', '走出传统产业'],
    // 岗位类频道：标题必须含有求职/招考词，否则不收（避免企业新闻混入）
    requireAny: ['招聘', '招录', '招考', '公告', '启事', '岗位', '职位', '遴选', '选调', '录用', '公示', '报名', '笔试', '面试', '聘用', '编制', '考试'],
    sourceBoost: ['sasac', 'sasac-gzdt', 'shiyebian'],
  },
  postgrad: {
    strong: [
      '考研', '硕士研究生', '研究生招生', '推免', '夏令营', '复试', '初试', '调剂', '复试线',
      '拟录取', '招生简章', '招生目录', '考试大纲', '参考书目', '报录比', '国家线', '自划线',
      '专业硕士', 'mfa', '艺术硕士', '戏剧与影视', '戏剧影视', '电影学', '广播电视', '博士研究生',
      '复试细则', '复试名单', '硕士招生', '研究生复试', '推免生', '招生计划', '报考', '录取名单',
    ],
    weak: ['研究生', '硕士', '博士', '招生', '学术', '讲座', '论坛', '学科', '学院'],
    deny: ['考研机构广告'],
    sourceBoost: ['yz-kyzx', 'pku-art', 'nju-art', 'whu-art', 'xmu-film', 'ecnu-comm', 'seu-art', 'nankai-wxy', 'csu-art', 'hnu-design', 'sdu-art', 'tongji-sal'],
  },
  bigtech: {
    strong: [
      '腾讯', '阿里云', '阿里巴巴', '字节跳动', '抖音', '百度', '华为', '小米', '美团', '京东', '快手',
      '网易', '哔哩哔哩', 'b站', '拼多多', '滴滴', '蚂蚁集团', '火山引擎', '飞书', '钉钉',
      '云栖大会', '开发者大会', '开放日', '校园大使', '训练营', '奖学金', '天池', '昇腾', '飞桨',
      '大厂', '互联网大厂', '开源之夏', '蓝桥杯', '挑战杯', '互联网+',
    ],
    weak: ['沙龙', 'meetup', '发布会', '论坛', '峰会', '大会', '工作坊', '招募', '报名'],
    deny: ['抱枕', '上市', '销量', '发售价', '开售', '众筹', '手机'],
    sourceBoost: [],
  },
  'ai-app-competition': {
    strong: [
      'ai应用', 'ai 应用', '应用创新', '算法大赛', '数据竞赛', '开发者大赛', '智能体开发', 'agent开发',
      'kaggle', 'datafountain', '天池', 'aistudio', '飞桨', '昇腾', '模型应用', 'ai挑战赛',
      '应用开发大赛', '创新应用大赛', '解决方案大赛', 'ai创新应用',
    ],
    weak: ['竞赛', '大赛', '挑战赛', '创新', '开发', '算法', '模型'],
    deny: [],
    sourceBoost: ['datafountain', 'cpipc', 'jsjds'],
  },
  'ai3d-game': {
    strong: [
      '游戏开发', '游戏设计', '独立游戏', 'game jam', 'gamejam', '游戏创作', 'ue5', '虚幻引擎',
      'unity', 'unreal', 'blender', '3d建模', '三维建模', 'ai建模', 'ai 3d', '3d生成', '模型生成',
      '数字孪生', '元宇宙', '虚拟现实', '游戏大赛', '游戏创意', 'itch.io',
      '关卡设计', '游戏引擎', 'steam', '玩家创作', 'indie game',
    ],
    weak: ['3d', '三维', '建模', '游戏', '渲染', '引擎', '美术', '动画', 'vr', 'ar', 'xr'],
    deny: [],
    sourceBoost: ['gcores', 'indienova'],
  },
  'ai-film-game': {
    strong: [
      '影游', '互动影游', '互动影像', '互动剧', '微短剧', '短剧', 'ai短片', 'ai 短片', 'ai电影',
      'ai 电影', 'ai影视', 'ai 影视', '影像大赛', '影像征集', '短片节', '电影节', '展映',
      '生成式影像', 'ai动漫', '漫剧', '数字艺术', '影像创作', '影视大赛', '微电影',
    ],
    weak: ['影像', '短片', '动画', '影视', '电影', '动漫', '国创', '艺术', '创作'],
    deny: [],
    sourceBoost: ['cdec', 'xinpianchang-aigc'],
  },
};

/** 结果结构：{ id, score, strong:boolean } */
export function classifyV2(titleText, sourceId, summaryText = '', tagText = '') {
  const t = ' ' + String(titleText || '').toLowerCase() + ' ';
  // 标签（赛事主题、分类）与标题同级，属于强证据
  const g = ' ' + String(tagText || '').toLowerCase() + ' ';
  const s = ' ' + String(summaryText || '').toLowerCase() + ' ';
  let out = [];
  for (const ch of CHANNELS) {    const r = RULES[ch.id];
    if (!r) continue;
    let strongTitle = 0;
    let weakTitle = 0;
    let strongSummary = 0;
    for (const k of r.strong) {
      if (t.includes(k) || g.includes(k)) strongTitle++;
      else if (s.includes(k)) strongSummary++;
    }
    for (const k of r.weak) if (t.includes(k) || g.includes(k)) weakTitle++;
    let denied = false;
    for (const k of r.deny || []) if (t.includes(k)) { denied = true; break; }
    if (denied && strongTitle === 0) continue;
    // requireAny：标题必须命中其中一个词，否则跳过（岗位类频道用）
    if (r.requireAny && !r.requireAny.some((k) => t.includes(k))) continue;

    const boosted = (r.sourceBoost || []).includes(sourceId);

    let score = 0;
    if (strongTitle > 0) {
      score = strongTitle * 3 + Math.min(strongSummary, 3) * 0.8 + Math.min(weakTitle, 3) * 0.5;
    } else if (boosted && strongSummary > 0) {
      // 垂直源 + 正文强信号
      score = Math.max(2.2, strongSummary * 1.2);
    } else if (weakTitle >= 3 || (weakTitle >= 2 && boosted)) {
      // 仅弱信号：需要标题里多个佐证
      score = 1.0 + weakTitle * 0.25;
    } else {
      continue;
    }
    if (boosted) score += 1.2;

    out.push({ id: ch.id, score: +(score * ch.weight).toFixed(2), strong: strongTitle > 0 });
  }
  out.sort((a, b) => b.score - a.score);

  // 招聘/实习类标题，只允许落在「实习 / 考公 / 残障」这几个求职相关频道
  const isJobPost = /实习|招聘|岗位|招录|校招|内推|招募|聘用|拟录用|录取名单/.test(String(titleText || ''));
  if (isJobPost) {
    const allowed = new Set(['internship', 'gov-jobs', 'disability', 'postgrad']);
    out = out.filter((o) => allowed.has(o.id));
  }

  // 强命中的频道优先，最多保留 3 个
  const strongOnly = out.filter((o) => o.strong);
  const chosen = strongOnly.length ? strongOnly.slice(0, 3) : out.slice(0, 1);
  return chosen;
}
