import { articles } from './articles.js';
export const SITE_URL = 'https://finops-planner.vercel.app';
export const UPDATED_AT = '2026-09-12';
const pages = {
  '/planning': ['情境與 FIRE 規劃｜Personal FinOps Planner', '比較退休、轉職與自雇情境，按月推估現金及投資，保存版本並追蹤實績。'],
  '/diagnosis': ['完整財務診斷｜Personal FinOps Planner', '輸入收入、支出、資產與負債，檢查現金安全水位及完整財務指標。'],
  '/': ['今日財務 Dashboard｜Personal FinOps Planner', '免費試算每月可分配現金、緊急預備金、旅遊基金與退休目標。分開處理每月實領收入與年度獎金，並公開計算方法與限制。'],
  '/blog': ['個人理財文章｜Personal FinOps Planner', '從現金水位、存錢比例到退休規劃，以可重算案例了解個人 FinOps 的資金分配方法。'],
  '/about': ['關於本站｜Personal FinOps Planner', '了解 Personal FinOps Planner 的設計目的、內容製作方式與財務教育定位。'],
  '/methodology': ['計算方法與資料來源｜Personal FinOps Planner', '查看每月分配、現金月數、家庭財富分位與退休複利公式，了解資料口徑和模型限制。'],
  '/privacy-policy': ['隱私權政策｜Personal FinOps Planner', '了解財務試算的本機儲存、Google Analytics、分享摘要與第三方服務的資料處理方式。'],
  '/disclaimer': ['財務免責聲明｜Personal FinOps Planner', '說明財務試算、退休情境與教育內容的用途及限制。'],
  '/contact': ['聯絡與錯誤回報｜Personal FinOps Planner', '透過既有聯絡管道提供功能建議、回報計算問題或更正文章內容。'],
};
export const routes = [...Object.keys(pages), ...articles.map(a => `/blog/${a.slug}`)];
export function getMetadata(path) {
  path = path.replace(/\/$/, '') || '/';
  const alias = path === '/articles' ? '/blog' : articles.find(a => `/${a.slug}` === path) ? `/blog${path}` : path;
  const article = articles.find(a => `/blog/${a.slug}` === alias);
  const known = pages[alias] || (article && [article.title, article.description]);
  return {
    title: known?.[0] || '找不到頁面｜Personal FinOps Planner',
    description: known?.[1] || '這個頁面不存在，請回到首頁或文章列表。',
    canonical: SITE_URL + alias,
    noindex: !known,
    article,
  };
}
export function structuredData(meta) {
  if (meta.noindex) return null;
  if (meta.article) return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: meta.title, description: meta.description,
    dateModified: meta.article.updatedAt, inLanguage: 'zh-Hant-TW',
    mainEntityOfPage: meta.canonical,
    author: { '@type': 'Organization', name: 'Personal FinOps Planner', url: SITE_URL + '/about' },
  };
  return { '@context': 'https://schema.org', '@type': 'WebPage', name: meta.title, description: meta.description, url: meta.canonical, inLanguage: 'zh-Hant-TW' };
}
