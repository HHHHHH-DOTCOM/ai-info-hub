// 信息源清单（全部为 2026-10 实测可直连的源）
// type: rss | html | devpost | datafountain
// hint: 该源默认归属频道（用于「可信赛事源」判定）

export const SOURCES = [
  /* ======================= AIGC 前沿 / 技巧 ======================= */
  { id: 'qbitai', name: '量子位', type: 'rss', url: 'https://www.qbitai.com/feed', hint: 'aigc-frontier' },
  { id: 'qbitai-news', name: '量子位·资讯', type: 'rss', url: 'https://rsshub.rssforever.com/qbitai/category/%E8%B5%84%E8%AE%AF', hint: 'aigc-frontier' },
  { id: 'jiqizhixin', name: '机器之心', type: 'rss', url: 'https://www.jiqizhixin.com/rss', hint: 'aigc-frontier' },
  { id: 'ithome', name: 'IT之家', type: 'rss', url: 'https://www.ithome.com/rss/', hint: 'aigc-frontier' },
  { id: 'infoq', name: 'InfoQ 中文', type: 'rss', url: 'https://www.infoq.cn/feed', hint: 'aigc-skills' },
  { id: 'sspai', name: '少数派', type: 'rss', url: 'https://sspai.com/feed', hint: 'aigc-skills' },
  { id: 'woshipm', name: '人人都是产品经理', type: 'rss', url: 'https://www.woshipm.com/feed', hint: 'aigc-skills' },
  { id: 'geekpark', name: '极客公园', type: 'rss', url: 'https://www.geekpark.net/rss', hint: 'aigc-frontier' },
  { id: 'tmtpost', name: '钛媒体', type: 'rss', url: 'https://www.tmtpost.com/rss.xml', hint: 'aigc-frontier' },
  { id: 'ifanr', name: '爱范儿', type: 'rss', url: 'https://www.ifanr.com/feed', hint: 'aigc-frontier' },
  { id: 'oschina', name: '开源中国', type: 'rss', url: 'https://www.oschina.net/news/rss', hint: 'aigc-skills' },
  { id: '36kr-flash', name: '36氪·快讯', type: 'rss', url: 'https://rsshub.rssforever.com/36kr/newsflashes', hint: 'aigc-frontier' },
  { id: 'zhihu-daily', name: '知乎日报', type: 'rss', url: 'https://rsshub.rssforever.com/zhihu/daily', hint: 'aigc-skills' },
  { id: 'github-trending', name: 'GitHub Trending', type: 'rss', url: 'https://rsshub.rssforever.com/github/trending/daily/any', hint: 'aigc-skills' },
  { id: 'solidot', name: 'Solidot', type: 'rss', url: 'https://www.solidot.org/index.rss', hint: 'aigc-frontier' },
  { id: 'mydrivers', name: '快科技', type: 'rss', url: 'https://rss.mydrivers.com/rss.aspx?Tid=1', hint: 'aigc-frontier' },
  { id: 'dgtle', name: '数字尾巴', type: 'rss', url: 'https://www.dgtle.com/rss/dgtle.xml', hint: 'aigc-skills' },

  { id: 'openai', name: 'OpenAI News', type: 'rss', url: 'https://openai.com/news/rss.xml', hint: 'aigc-frontier' },
  { id: 'googleai', name: 'Google AI Blog', type: 'rss', url: 'https://blog.google/technology/ai/rss/', hint: 'aigc-frontier' },
  { id: 'techcrunch-ai', name: 'TechCrunch AI', type: 'rss', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', hint: 'aigc-frontier' },
  { id: 'venturebeat-ai', name: 'VentureBeat AI', type: 'rss', url: 'https://venturebeat.com/category/ai/feed/', hint: 'aigc-frontier' },
  { id: 'verge-ai', name: 'The Verge AI', type: 'rss', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', hint: 'aigc-frontier' },
  { id: 'mittr-ai', name: 'MIT Tech Review AI', type: 'rss', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', hint: 'aigc-frontier' },
  { id: 'hn', name: 'Hacker News', type: 'rss', url: 'https://hnrss.org/frontpage', hint: 'aigc-skills' },

  /* ============================ 剪辑技巧 ============================ */
  { id: 'xinpianchang', name: '新片场', type: 'html', url: 'https://www.xinpianchang.com/', hint: 'editing', include: /xinpianchang\.com\/a\d+/, minLen: 6 },
  { id: 'xinpianchang-aigc', name: '新片场·AIGC', type: 'html', url: 'https://www.xinpianchang.com/channel/video?category=0', hint: 'ai-film-game', include: /xinpianchang\.com\/a\d+/, minLen: 6 },

  /* ============================ 黑客松 ============================ */
  { id: 'devpost-1', name: 'Devpost 黑客松', type: 'devpost', url: 'https://devpost.com/api/hackathons?status[]=open&page=1', hint: 'hackathon' },
  { id: 'devpost-2', name: 'Devpost 黑客松', type: 'devpost', url: 'https://devpost.com/api/hackathons?status[]=open&page=2', hint: 'hackathon' },
  { id: 'devpost-3', name: 'Devpost 黑客松', type: 'devpost', url: 'https://devpost.com/api/hackathons?status[]=open&page=3', hint: 'hackathon' },
  { id: 'devpost-4', name: 'Devpost 黑客松', type: 'devpost', url: 'https://devpost.com/api/hackathons?status[]=open&page=4', hint: 'hackathon' },
  { id: 'devpost-upcoming', name: 'Devpost 即将开始', type: 'devpost', url: 'https://devpost.com/api/hackathons?status[]=upcoming&page=1', hint: 'hackathon' },

  /* ========================= 大厂 / AI 应用赛 ========================= */
  { id: 'datafountain', name: 'DataFountain', type: 'datafountain', url: 'https://www.datafountain.cn/competitions', hint: 'ai-app-competition' },
  { id: 'cpipc', name: '中国研究生创新实践系列大赛', type: 'html', url: 'https://cpipc.acge.org.cn/', hint: 'ai-app-competition', include: /cpipc\.acge\.org\.cn\/pw\/(news|document|race)\/detail/, minLen: 10 },
  { id: 'jsjds', name: '中国大学生计算机设计大赛', type: 'html', url: 'https://jsjds.blcu.edu.cn/', hint: 'ai-app-competition', include: /jsjds\.blcu\.edu\.cn\/info\/\d+\/\d+\.htm/, minLen: 10 },
  { id: '52jingsai', name: '我爱竞赛网', type: 'html', url: 'https://www.52jingsai.com/portal.php?mod=list&catid=1', hint: 'hackathon', include: /52jingsai\.com\/bisai\/article-/, minLen: 8 },
  { id: '52jingsai-sheji', name: '我爱竞赛网·设计影像', type: 'html', url: 'https://www.52jingsai.com/portal.php?mod=list&catid=2', hint: 'ai-film-game', include: /52jingsai\.com\/bisai\/article-/, minLen: 8 },
  { id: 'cdec', name: '好创意数字艺术大赛', type: 'html', url: 'https://www.cdec.org.cn/', hint: 'ai-film-game', include: /cdec\.org\.cn\/articleDetail/, minLen: 4 },
  { id: 'sasac', name: '国务院国资委', type: 'html', url: 'http://www.sasac.gov.cn/n2588025/index.html', hint: 'gov-jobs', include: /sasac\.gov\.cn\/n2588025\/n2588\d+\/c\d+\/content\.html/, minLen: 8 },
  { id: 'sasac-gzdt', name: '国资委·央企动态', type: 'html', url: 'http://www.sasac.gov.cn/n2588025/n2588139/index.html', hint: 'gov-jobs', include: /sasac\.gov\.cn\/.*\/c\d+\/content\.html/, minLen: 8 },

  /* ====================== 3D / 游戏开发 ====================== */
  { id: 'gcores', name: '机核 GCORES', type: 'gcores', url: 'https://www.gcores.com/gapi/v1/articles?page[limit]=30&sort=-published-at', hint: 'ai3d-game' },
  { id: 'gcores-radios', name: '机核·电台', type: 'html', url: 'https://www.gcores.com/radios', hint: 'ai3d-game', include: /gcores\.com\/radios\/\d+/, minLen: 6 },
  { id: 'indienova', name: 'indienova', type: 'html', url: 'https://www.indienova.com/', hint: 'ai3d-game', include: /indienova\.com\/(indie-game|article|games|column)/, minLen: 8 },
  { id: 'indienova-dev', name: 'indienova·开发', type: 'html', url: 'https://www.indienova.com/indie-game-development', hint: 'ai3d-game', include: /indienova\.com\/indie-game-(development|news|review)\//, minLen: 8 },
  { id: 'gamersky', name: '游民星空', type: 'html', url: 'https://www.gamersky.com/news/', hint: 'ai3d-game', include: /gamersky\.com\/news\/\d{6}\/\d+\.shtml/, minLen: 8 },
  { id: '3dm', name: '3DM 游戏网', type: 'html', url: 'https://www.3dmgame.com/news/', hint: 'ai3d-game', include: /3dmgame\.com\/(news|original)\/\d+\/\d+\.html/, minLen: 8 },
  { id: 'youxituoluo', name: '游戏陀螺', type: 'html', url: 'https://www.youxituoluo.com/', hint: 'ai3d-game', include: /youxituoluo\.com\/\d+\.html/, minLen: 8 },

  /* ====================== 残障大学生 ====================== */
  { id: 'cdpf-news', name: '中国残联·要闻', type: 'html', url: 'https://www.cdpf.org.cn/xwzx/ywdt1/', hint: 'disability', include: /cdpf\.org\.cn\/xwzx\/ywdt1\/\w+\.htm/, minLen: 8 },
  { id: 'cdpf-local', name: '中国残联·地方动态', type: 'html', url: 'https://www.cdpf.org.cn/xwzx/dfdt1/', hint: 'disability', include: /cdpf\.org\.cn\/xwzx\/dfdt1\/\w+\.htm/, minLen: 8 },
  { id: 'cdpf-notice', name: '中国残联·通知公告', type: 'html', url: 'https://www.cdpf.org.cn/zwgk/ggtz1/', hint: 'disability', include: /cdpf\.org\.cn\/zwgk\/ggtz1\/\w+\.htm/, minLen: 8 },
  { id: 'cdpf-ywpd', name: '中国残联·业务动态', type: 'html', url: 'https://www.cdpf.org.cn/ywpd/', hint: 'disability', include: /cdpf\.org\.cn\/ywpd\/.*\/\w+\.htm/, minLen: 10, exclude: /index\.htm$/ },

  /* ====================== 考公 · 考编 · 央国企 ====================== */
  { id: 'shiyebian', name: '事业单位招聘网', type: 'html', url: 'https://www.shiyebian.net/xinxi/', hint: 'gov-jobs', include: /shiyebian\.net\/xinxi\/\d+\.html/, minLen: 10 },

  /* ====================== 实习 / 就业 ====================== */
  { id: 'shixiseng-ai', name: '实习僧·AI 实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=AI&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-jianji', name: '实习僧·剪辑实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E5%89%AA%E8%BE%91&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-youxia', name: '实习僧·游戏实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E6%B8%B8%E6%88%8F&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-sheji', name: '实习僧·设计实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E8%AE%BE%E8%AE%A1&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-yunying', name: '实习僧·运营实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E8%BF%90%E8%90%A5&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-chanpin', name: '实习僧·产品实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E4%BA%A7%E5%93%81&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-suanfa', name: '实习僧·算法实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E7%AE%97%E6%B3%95&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },
  { id: 'shixiseng-yingshi', name: '实习僧·影视实习', type: 'html', url: 'https://www.shixiseng.com/interns?keyword=%E5%BD%B1%E8%A7%86&city=%E5%85%A8%E5%9B%BD', hint: 'internship', include: /shixiseng\.com\/intern\/inn_\w+/, minLen: 5, font: true },

  /* ====================== 戏影考研 985 ====================== */
  { id: 'yz-kyzx', name: '研招网·考研资讯', type: 'html', url: 'https://yz.chsi.com.cn/kyzx/', hint: 'postgrad', include: /yz\.chsi\.com\.cn\/kyzx\/\w+\/20\d{4}\/\d{8}\/\d+\.html/, minLen: 5 },
  { id: 'yz-kydt', name: '研招网·考研动态', type: 'html', url: 'https://yz.chsi.com.cn/kyzx/kydt/', hint: 'postgrad', include: /yz\.chsi\.com\.cn\/kyzx\/kydt\/\d{6}\/\d{8}\/\d+\.html/, minLen: 8 },
  { id: 'yz-fstj', name: '研招网·复试调剂', type: 'html', url: 'https://yz.chsi.com.cn/kyzx/fstj/', hint: 'postgrad', include: /yz\.chsi\.com\.cn\/kyzx\/fstj\/\d{6}\/\d{8}\/\d+\.html/, minLen: 8 },
  { id: 'yz-tjxx', name: '研招网·调剂信息', type: 'html', url: 'https://yz.chsi.com.cn/kyzx/tjxx/', hint: 'postgrad', include: /yz\.chsi\.com\.cn\/kyzx\/tjxx\/\d{6}\/\d{8}\/\d+\.html/, minLen: 8 },
  { id: 'yz-jybzc', name: '研招网·教育部政策', type: 'html', url: 'https://yz.chsi.com.cn/kyzx/jybzc/', hint: 'postgrad', include: /yz\.chsi\.com\.cn\/kyzx\/jybzc\/\d{6}\/\d{8}\/\d+\.html/, minLen: 8 },
  { id: 'pku-art', name: '北京大学艺术学院', type: 'html', url: 'https://art.pku.edu.cn/rcpyjxxm/MFA/mfa_tzgg/', hint: 'postgrad', include: /art\.pku\.edu\.cn\/rcpyjxxm\/.*\.htm/, minLen: 8 },
  { id: 'pku-art-news', name: '北京大学艺术学院·动态', type: 'html', url: 'https://art.pku.edu.cn/', hint: 'postgrad', include: /art\.pku\.edu\.cn\/.*\.htm/, minLen: 10 },
  { id: 'nju-art', name: '南京大学艺术学院', type: 'html', url: 'https://art.nju.edu.cn/tzgg/list.htm', hint: 'postgrad', include: /art\.nju\.edu\.cn\/.*\/page\.htm/, minLen: 8 },
  { id: 'whu-art', name: '武汉大学艺术学院', type: 'html', url: 'https://art.whu.edu.cn/', hint: 'postgrad', include: /art\.whu\.edu\.cn\/info\/\d+\/\d+\.htm/, minLen: 8 },
  { id: 'xmu-film', name: '厦门大学电影学院', type: 'html', url: 'https://film.xmu.edu.cn/', hint: 'postgrad', include: /film\.xmu\.edu\.cn\/info\/\d+\/\d+\.htm/, minLen: 8 },
  { id: 'ecnu-comm', name: '华东师大传播学院', type: 'html', url: 'https://comm.ecnu.edu.cn/', hint: 'postgrad', include: /comm\.ecnu\.edu\.cn\/.*\/page\.htm/, minLen: 8 },
  { id: 'seu-art', name: '东南大学艺术学院', type: 'html', url: 'https://arts.seu.edu.cn/', hint: 'postgrad', include: /arts\.seu\.edu\.cn\/20\d{2}\/\d+\/.*page\.htm/, minLen: 8 },
  { id: 'nankai-wxy', name: '南开大学文学院', type: 'html', url: 'https://wxy.nankai.edu.cn/', hint: 'postgrad', include: /wxy\.nankai\.edu\.cn\/20\d{2}\/\d+\/.*page\.htm/, minLen: 10 },
  { id: 'csu-art', name: '中南大学建筑与艺术学院', type: 'html', url: 'https://art.csu.edu.cn/', hint: 'postgrad', include: /art\.csu\.edu\.cn\/info\/\d+\/\d+\.htm/, minLen: 8 },
  { id: 'hnu-design', name: '湖南大学设计艺术学院', type: 'html', url: 'https://design.hnu.edu.cn/', hint: 'postgrad', include: /design\.hnu\.edu\.cn\/info\/\d+\/\d+\.htm/, minLen: 8 },
  { id: 'sdu-art', name: '山东大学艺术学院', type: 'html', url: 'https://www.art.sdu.edu.cn/', hint: 'postgrad', include: /art\.sdu\.edu\.cn\/info\/\d+\/\d+\.htm/, minLen: 8 },
  { id: 'tongji-sal', name: '同济大学人文学院', type: 'html', url: 'https://sal.tongji.edu.cn/', hint: 'postgrad', include: /sal\.tongji\.edu\.cn\/\d+\/\d+\/c\d+a\d+\/page\.htm/, minLen: 10 },
];

/** 微信 / QQ 导出目录（用户把每日消息导出成 txt/json/md 放这里） */
export const INBOX_DIR = 'inbox';

/** 抓取并发 */
export const CONCURRENCY = 8;

/** 每次采集保留的最大条目数（每个源） */
export const MAX_PER_SOURCE = 60;

/** 保留历史天数 */
export const KEEP_DAYS = 120;
