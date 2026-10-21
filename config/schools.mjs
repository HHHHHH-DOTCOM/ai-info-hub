// 985 院校与戏影相关院系识别（用于给条目打标签）
export const SCHOOLS_985 = [
  { name: '北京大学', short: '北大' },
  { name: '清华大学', short: '清华' },
  { name: '中国人民大学', short: '人大' },
  { name: '北京师范大学', short: '北师大' },
  { name: '北京航空航天大学', short: '北航' },
  { name: '北京理工大学', short: '北理工' },
  { name: '中国农业大学', short: '中国农大' },
  { name: '中央民族大学', short: '民大' },
  { name: '南开大学', short: '南开' },
  { name: '天津大学', short: '天大' },
  { name: '大连理工大学', short: '大工' },
  { name: '东北大学', short: '东大' },
  { name: '吉林大学', short: '吉大' },
  { name: '哈尔滨工业大学', short: '哈工大' },
  { name: '复旦大学', short: '复旦' },
  { name: '同济大学', short: '同济' },
  { name: '上海交通大学', short: '上交' },
  { name: '华东师范大学', short: '华东师大' },
  { name: '南京大学', short: '南大' },
  { name: '东南大学', short: '东南' },
  { name: '浙江大学', short: '浙大' },
  { name: '中国科学技术大学', short: '中科大' },
  { name: '厦门大学', short: '厦大' },
  { name: '山东大学', short: '山大' },
  { name: '中国海洋大学', short: '海大' },
  { name: '武汉大学', short: '武大' },
  { name: '华中科技大学', short: '华科' },
  { name: '中南大学', short: '中南' },
  { name: '湖南大学', short: '湖大' },
  { name: '中山大学', short: '中大' },
  { name: '华南理工大学', short: '华工' },
  { name: '四川大学', short: '川大' },
  { name: '电子科技大学', short: '成电' },
  { name: '重庆大学', short: '重大' },
  { name: '西安交通大学', short: '西交' },
  { name: '西北工业大学', short: '西工大' },
  { name: '兰州大学', short: '兰大' },
  { name: '西北农林科技大学', short: '西农' },
  { name: '国防科技大学', short: '国防科大' },
];

/** 有戏剧与影视 / 电影 / 广播电视相关学科的重点院校（用于戏影考研重点标注） */
export const FILM_SCHOOLS = [
  '北京大学', '北京师范大学', '中国人民大学', '南京大学', '武汉大学', '厦门大学',
  '华东师范大学', '东南大学', '南开大学', '中南大学', '湖南大学', '山东大学',
  '同济大学', '上海交通大学', '浙江大学', '四川大学', '重庆大学', '吉林大学',
  '中山大学', '华中科技大学', '复旦大学', '清华大学', '西安交通大学',
];

const FILM_WORDS = ['戏剧与影视', '戏剧影视', '影视', '电影', '广播电视', '戏剧', '影像', '动画', '播音', '表演'];

/** 判断条目涉及哪些院校 / 是否戏影专业 */
export function tagSchools(text) {
  const t = String(text || '');
  const hit985 = [];
  for (const s of SCHOOLS_985) {
    if (t.includes(s.name) || (s.short.length >= 2 && t.includes(s.short))) hit985.push(s.name);
  }
  const tags = [];
  if (hit985.length) tags.push('985');
  if (hit985.some((n) => FILM_SCHOOLS.includes(n))) tags.push('film985');
  if (FILM_WORDS.some((w) => t.includes(w))) tags.push('xiju');
  return { tags, schools: hit985 };
}
