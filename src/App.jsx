import React, { useMemo, useState } from "react";
import GrowthAgent from "./GrowthAgent";
import { articles } from "./articles";
import "./App.css";

const isDev = window.location.search.includes("dev");

const STORAGE_KEY = "finopsPlannerInputs";

const defaultInputs = {
  monthlyIncome: 100000,
  annualBonus: 0,
  mortgage: 25000,
  mortgageRemainingMonths: 297,
  personalLoan: 0,
  personalLoanRemainingMonths: 0,
  insurance: 2000,
  livingExpense: 25000,
  otherExpense: 1000,
  currentCash: 300000,
  cashGoal: 1000000,
  annualTravelBudget: 50000,
  currentTravelFund: 0,
  currentInvestmentAsset: 0,
  minInvestment: 12000,
  maxInvestment: 50000,
  annualReturnRate: 6,
  retirementMonthlyCashflow: 60000,
  currentAge: 35,
  retirementAge: 55,
};

const getInitialInputs = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultInputs, ...JSON.parse(saved) } : defaultInputs;
  } catch {
    return defaultInputs;
  }
};

const formatNTD = (value) => {
  const number = Number(value) || 0;
  return `NT$ ${Math.round(number).toLocaleString("zh-TW")}`;
};

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(Number(value) || 0, min), max);
};

function SiteHeader() {
  return (
    <header className="site-header">
      <a href="/" className="site-logo">
        Personal FinOps Planner
      </a>
      <nav className="site-nav">
        <a href="/">首頁</a>
        <a href="/monthly-saving-rate">存錢比例</a>
        <a href="/blog">文章</a>
        <a href="/about">關於本站</a>
        <a href="/contact">聯絡我們</a>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <a href="/">首頁</a>
      <a href="/monthly-saving-rate">存錢比例</a>
      <a href="/blog">文章</a>
      <a href="/about">關於本站</a>
      <a href="/privacy-policy">隱私權政策</a>
      <a href="/disclaimer">免責聲明</a>
      <a href="/contact">聯絡我們</a>
    </footer>
  );
}

function PageShell({ children, className = "app" }) {
  return (
    <main className={className}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}

function HomeButton() {
  return (
    <div className="page-actions">
      <a className="home-button" href="/">
        ← 回到首頁
      </a>
    </div>
  );
}

function InputCard({ label, value, onChange, suffix = "NTD" }) {
  return (
    <div className="input-card">
      <label>{label}</label>
      <div className="input-wrap">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span>{suffix}</span>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const percent = clamp(value);

  let statusClass = "danger";
  if (percent >= 80) statusClass = "good";
  else if (percent >= 50) statusClass = "warning";

  return (
    <div className="progress-bg">
      <div
        className={`progress-fill ${statusClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function MetricCard({ title, value, note }) {
  return (
    <div className="metric-card">
      <p>{title}</p>
      <h3>{value}</h3>
      {note && <span>{note}</span>}
    </div>
  );
}

function AllocationCard({ title, amount, note }) {
  return (
    <div className="allocation-card">
      <p>{title}</p>
      <h2>{formatNTD(amount)}</h2>
      {note && <span>{note}</span>}
    </div>
  );
}

function SharePanel({ result }) {
  const pageUrl = window.location.href;

  const shareText = `我的 Personal FinOps 計算結果：
每月可分配金額：${formatNTD(result.available)}
現金安全月數：${result.cashRunwayMonths.toFixed(1)} 個月
6 個月現金目標：${formatNTD(result.sixMonthCashTarget)}
自訂現金目標：${formatNTD(result.cashGoal)}
距離自訂現金目標還差：${formatNTD(result.cashGapToCustomGoal)}
建議每月補現金：${formatNTD(result.suggestedMonthlyCashTopUp)}
財務自由目標資產：${formatNTD(result.financialFreedomTarget)}
退休時預估投資資產：${formatNTD(result.projectedInvestmentAtRetirement)}
目前還差：${formatNTD(result.financialFreedomGap)}

用這個免費個人財務管理工具，試算你的現金流管理、每月存錢比例、投資配置與財務自由缺口：
${pageUrl}`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(pageUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}`,
    threads: `https://www.threads.net/intent/post?text=${encodedText}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("已複製分享文案，可貼到 IG、Threads、LINE 或其他平台。");
    } catch {
      alert("複製失敗，請手動選取文字。");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Personal FinOps 計算結果",
          text: shareText,
          url: pageUrl,
        });
      } catch {
        return;
      }
    } else {
      copyText();
    }
  };

  const savePdf = () => {
    window.print();
  };

  return (
    <section className="section share-section">
      <h2>分享我的計算結果</h2>
      <p className="share-description">
        可將目前的現金水位、投資配置、每月存錢比例與財務自由缺口分享出去，也可以列印或另存成 PDF。
      </p>

      <div className="share-buttons">
        <button type="button" onClick={nativeShare}>
          手機分享
        </button>
        <a href={shareLinks.facebook} target="_blank" rel="noreferrer">
          Facebook
        </a>
        <a href={shareLinks.threads} target="_blank" rel="noreferrer">
          Threads
        </a>
        <a href={shareLinks.x} target="_blank" rel="noreferrer">
          X
        </a>
        <a href={shareLinks.line} target="_blank" rel="noreferrer">
          LINE
        </a>
        <button type="button" onClick={copyText}>
          複製給 IG
        </button>
        <button type="button" onClick={savePdf}>
          存成 PDF
        </button>
      </div>
    </section>
  );
}

function BlogIndexPage() {
  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">Personal FinOps Blog</p>
        <h1>個人 FinOps 文章專區</h1>
        <p>
          這裡整理現金流管理、每月存錢比例、投資配置、旅遊基金、負債管理與財務自由推估等主題。
          這些文章不提供個別投資標的建議，而是協助你建立一套可長期執行的個人財務管理邏輯。
        </p>
        <p>
          Personal FinOps 的核心，是把收入、支出、現金水位、投資與人生目標放在同一個架構中檢視。
          當你能看懂每月資金如何流動，就能更理性地安排儲蓄、旅遊、還債與退休準備。
        </p>
        <a className="cta-button" href="/">
          回首頁使用免費試算工具
        </a>
      </section>

      <section className="blog-grid">
        {articles.map((article) => (
          <article className="article-card" key={article.slug}>
            <p className="article-category">{article.category}</p>
            <h2>{article.title}</h2>
            <p>{article.description}</p>
            <a href={`/blog/${article.slug}`}>閱讀文章 →</a>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

function ArticlePage({ slug }) {
  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <PageShell>
        <section className="seo-content">
          <HomeButton />
          <h1>找不到文章</h1>
          <p>這篇文章可能已經移除，請回到文章列表查看其他個人財務管理內容。</p>
          <a className="cta-button" href="/blog">
            回文章列表
          </a>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <article className="article-page">
        <HomeButton />
        <p className="article-category">{article.category}</p>
        <h1>{article.title}</h1>
        <p className="article-meta">最後更新：{article.updatedAt}</p>
        <p className="article-description">{article.description}</p>

        {article.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}

        <div className="article-cta">
          <h2>用 Personal FinOps Planner 試算你的財務狀況</h2>
          <p>
            閱讀完文章後，你可以回到首頁輸入自己的收入、固定支出、現金水位、
            投資金額與退休目標，建立專屬的個人財務儀表板。
          </p>
          <a className="cta-button" href="/">
            回首頁免費試算
          </a>
        </div>
      </article>
    </PageShell>
  );
}

function MonthlySavingRatePage() {
  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">Personal Finance Guide</p>
        <h1>每月存錢比例怎麼算？上班族個人財務管理入門指南</h1>

        <p>
          每月存錢比例是個人財務管理中最重要的指標之一。比起單純記帳，
          更重要的是知道每個月收入進來後，應該分配多少給生活費、緊急預備金、
          投資、旅遊基金與長期財務自由目標。
        </p>

        <div style={{ marginTop: "20px", marginBottom: "24px" }}>
          <a href="/#calculator" className="cta-button">
            👉 回到首頁免費試算
          </a>
        </div>
      </section>

      <section className="seo-content">
        <h2>每月存錢比例不是固定公式，而是現金流決策</h2>
        <p>
          很多人會問每月應該存收入的幾成，常見答案是 20%、30% 或 50%。
          這些數字可以當作參考，但不應該直接套用。因為每個人的收入、
          房貸、信貸、保險、家庭責任、生活費與財務目標都不同。
          真正適合你的每月存錢比例，應該由現金流狀況決定。
        </p>
        <p>
          例如同樣月收入 10 萬元，有人沒有貸款，每月生活費 3 萬元；
          也有人同時有房貸、信貸與高額保險費，每月固定支出已經超過 7 萬元。
          兩個人的收入相同，但能承擔的儲蓄與投資比例完全不同。
          因此，存錢比例應先從每月可分配金額開始計算。
        </p>

        <h2>第一步：先算出每月可分配金額</h2>
        <p>
          每月可分配金額等於每月收入加上年度獎金月平均，再扣掉固定支出。
          固定支出包含房貸、信貸、保險、生活費與其他支出。
          這個數字比總收入更重要，因為它代表你真正能拿來安排現金水位、
          旅遊基金、投資與退休準備的資金。
        </p>
        <p>
          如果每月可分配金額為負，代表固定支出已經超過收入，
          此時不應急著提高投資比例，而是要先檢查支出結構。
          若可分配金額為正，才進一步判斷該補現金、投資，還是安排旅遊基金。
        </p>

        <h2>第二步：檢查現金安全水位</h2>
        <p>
          現金水位是每月存錢比例的核心。若目前現金不足 3 個月必要生活費，
          建議先把大部分剩餘資金用來補緊急預備金。若現金水位介於 3 到 6 個月，
          可以一邊補現金，一邊維持最低投資金額。若現金水位已達 6 個月以上，
          才比較適合提高投資比例。
        </p>
        <p>
          現金水位不是越低越有效率，也不是越高越安全。太低會讓你在突發狀況中被迫賣出資產；
          太高則可能讓資金長期閒置，降低資產成長效率。理想狀態是先建立安全水位，
          再依照人生目標分配到旅遊、投資與退休準備。
        </p>

        <h2>第三步：把旅遊基金納入每月分配</h2>
        <p>
          很多人存錢計畫失敗，不是因為日常生活費太高，而是因為大型支出沒有提前準備。
          旅遊、進修、家電、保險年繳或稅金都可能讓某個月份突然超支。
          因此，旅遊基金應該被視為年度預算，而不是臨時消費。
        </p>
        <p>
          若你每年希望安排一到兩次旅行，可以先設定年度旅遊預算，
          再拆成每月沉澱金額。這樣旅行不會破壞投資計畫，也不會讓信用卡帳單變成壓力。
          好的理財規劃不是完全不花錢，而是讓重要花費有資金來源。
        </p>

        <h2>第四步：設定投資金額上下限</h2>
        <p>
          投資金額不應該只由心情決定。建議設定每月最低投資金額與最高投資金額。
          最低投資金額可以維持長期紀律，最高投資金額則避免在現金水位不足時過度投入市場。
          當現金安全月數不足時，投資維持最低金額即可；當現金水位穩定後，
          再逐步提高投資比例。
        </p>
        <p>
          這種方式比單純說「每月投資收入的 30%」更實際，因為它會根據你的現金流狀態調整。
          理財規劃最重要的是可持續，而不是短期看起來很積極。
        </p>

        <h2>用 Personal FinOps Planner 試算你的每月存錢比例</h2>
        <p>
          Personal FinOps Planner 是免費個人財務管理工具，可以協助你輸入每月收入、
          年度獎金、房貸、信貸、貸款剩餘期數、保險、生活費、其他支出、
          目前現金、年度旅遊預算、投資金額與退休目標。工具會自動計算每月可分配金額、
          現金安全月數、6 個月現金目標、自訂現金目標、旅遊基金達成率、
          建議股票投資金額與財務自由缺口。
        </p>
        <p>
          透過這個工具，你可以把每月存錢比例從模糊口號變成具體數字。
          當你知道自己每月到底有多少錢可以分配，也知道目前現金水位是否安全，
          就能更有紀律地安排投資、旅行與退休準備。
        </p>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <a href="/#calculator" className="cta-button">
            👉 免費計算我的每月存錢比例
          </a>
        </div>
      </section>

      <section className="seo-content">
        <h2>每月存錢比例常見問題 FAQ</h2>

        <h3>每月存錢 20% 夠嗎？</h3>
        <p>
          對剛開始理財的人來說，每月存下收入的 20% 是很好的起點。
          若收入穩定且支出可控，可以逐步提高到 30% 或 40%。
        </p>

        <h3>收入不高也需要存錢嗎？</h3>
        <p>
          需要。即使金額不高，也建議建立固定儲蓄習慣。
          早期重點不是金額大小，而是建立穩定的現金流管理紀律。
        </p>

        <h3>應該先存錢還是先投資？</h3>
        <p>
          建議先建立 3 至 6 個月緊急預備金，再逐步提高投資比例。
          如果現金水位不足，過度投資反而會增加財務壓力。
        </p>

        <h3>每月存錢比例越高越好嗎？</h3>
        <p>
          不一定。過高的存錢比例如果壓縮必要生活品質，容易導致計畫無法長期執行。
          最好的比例是能穩定維持、並逐步累積資產的比例。
        </p>
      </section>
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell className="legal-page">
      <HomeButton />
      <h1>關於個人 FinOps 財務管理工具</h1>

      <p>
        個人 FinOps 財務管理工具是一個以企業 FinOps、TBM 與現金流管理概念為基礎所設計的個人理財輔助工具，
        目標是協助使用者更清楚地掌握每月收入、固定支出、生活費、投資配置與旅遊基金之間的關係。
      </p>

      <p>
        許多人在管理個人財務時，常常只關注「這個月還剩多少錢」，卻忽略了現金水位是否安全、投資比例是否合理、
        旅遊或大型支出是否有提前準備，以及每月支出是否已經超過可承受範圍。本工具希望用更直覺的方式，
        幫助使用者建立自己的財務儀表板。
      </p>

      <p>
        透過輸入每月收入、貸款、保險、生活費、投資金額與旅遊預算，使用者可以快速檢視自己的現金安全月數、
        每月可分配資金、投資與現金比例，以及旅遊基金累積進度。這些資訊可以作為日常理財決策的參考，
        例如是否需要降低非必要支出、提高現金準備、調整投資金額，或重新安排年度旅遊預算。
      </p>

      <p>
        本網站提供的所有計算結果僅供個人財務規劃參考，不構成任何投資、稅務、法律或保險建議。
        使用者仍應依照自身實際財務狀況、風險承受度與人生規劃，審慎做出決策。
      </p>

      <p>
        如果你正在尋找一個簡單、實用、可以幫助自己建立財務紀律的工具，這個網站可以作為你的起點。
        從現金流開始，逐步建立投資、旅遊基金與長期財務自由的規劃基礎。
      </p>
    </PageShell>
  );
}

function PrivacyPolicyPage() {
  return (
    <PageShell className="legal-page">
      <HomeButton />
      <h1>隱私權政策</h1>

      <p>
        歡迎使用個人 FinOps 財務管理工具。本隱私權政策說明本網站如何處理使用者資料、Cookie、
        第三方服務與廣告相關資訊。使用本網站即表示你了解並同意本政策的內容。
      </p>

      <h2>一、我們收集的資訊</h2>
      <p>
        本網站目前主要提供財務試算與規劃工具。使用者在頁面中輸入的收入、支出、投資金額、旅遊預算等資料，
        主要用於即時計算與畫面呈現。本網站不會要求你提供身分證字號、銀行帳號、信用卡號等高度敏感個人資料。
      </p>

      <h2>二、瀏覽器本機儲存</h2>
      <p>
        為了讓使用者下次開啟網站時可以保留前一次輸入的試算資料，本網站會將收入、支出、現金目標、
        投資設定與退休年齡等資料儲存在使用者自己的瀏覽器 localStorage 中。這些資料主要保存在使用者裝置端，
        方便下次使用，不會作為個別化投資建議用途。
      </p>

      <h2>三、Cookie 與第三方服務</h2>
      <p>
        本網站可能使用 Cookie 或類似技術，以改善網站體驗、分析流量來源，或提供更合適的內容與廣告。
        Cookie 是儲存在使用者瀏覽器中的小型文字檔案，可協助網站記住部分使用狀態或提供統計分析。
      </p>

      <p>
        本網站可能使用 Google AdSense 等第三方廣告服務。第三方廣告供應商可能會使用 Cookie，
        根據使用者過去造訪本網站或其他網站的情況投放廣告。
      </p>

      <h2>四、資料用途</h2>
      <ul>
        <li>提供財務試算與網站功能</li>
        <li>改善網站內容與使用者體驗</li>
        <li>分析網站流量與使用情況</li>
        <li>顯示第三方廣告或衡量廣告成效</li>
      </ul>

      <h2>五、第三方連結</h2>
      <p>
        本網站可能包含連往第三方網站的連結。當使用者點擊這些連結並離開本網站後，
        第三方網站的資料處理方式將依其各自的隱私權政策為準，本網站不對第三方網站的內容或資料處理方式負責。
      </p>

      <h2>六、政策更新</h2>
      <p>
        本網站可能因應服務調整、法規變更或第三方服務政策更新而修改本隱私權政策。
        最新版本將公布於本頁面。
      </p>

      <p>最後更新日期：2026 年 5 月 6 日</p>
    </PageShell>
  );
}

function DisclaimerPage() {
  return (
    <PageShell className="legal-page">
      <HomeButton />
      <h1>財務免責聲明</h1>

      <p>
        本網站提供之內容與計算工具僅供一般財務規劃、現金流管理與個人理財教育參考，
        不構成投資建議、理財建議、保險建議、稅務建議、法律建議或任何形式的專業顧問服務。
      </p>

      <p>
        Personal FinOps Planner 所產生的現金水位、每月分配建議、投資推估、退休現金流與財務自由目標，
        均依使用者自行輸入的資料與簡化假設計算。實際結果可能受到收入變化、市場波動、利率變動、
        通膨、稅務、個人風險承受度與家庭責任等因素影響。
      </p>

      <p>
        本網站不保證任何投資報酬，也不推薦特定股票、ETF、基金、保險、貸款或金融商品。
        使用者應依自身財務狀況、風險承受能力與人生目標審慎評估，必要時應諮詢合格專業人士。
      </p>

      <p>
        使用本網站代表你了解並同意：所有財務決策均由使用者自行承擔責任，本網站與內容提供者不因使用者依據網站資訊做出的任何決策，
        承擔直接或間接損失責任。
      </p>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell className="legal-page">
      <HomeButton />
      <h1>聯絡我們</h1>

      <p>
        如果你對個人 FinOps 財務管理工具有任何問題、建議、合作邀約，或發現網站內容需要修正，
        歡迎透過以下方式與我們聯繫。
      </p>

      <h2>聯絡方式</h2>
      <p>
        Facebook 粉絲專頁：
        <a
          href="https://www.facebook.com/finopsplanner"
          target="_blank"
          rel="noopener noreferrer"
        >
          個人 FinOps 財務管理
        </a>
      </p>

      <h2>網站用途</h2>
      <p>
        本網站主要提供個人財務管理、現金流試算、投資分配與旅遊基金規劃相關工具。
        網站內容僅供一般資訊與個人規劃參考，不提供個別化投資建議。
      </p>

      <h2>回覆時間</h2>
      <p>
        我們會盡量在收到訊息後的合理時間內回覆，但實際回覆時間可能依訊息內容與工作量而有所不同。
      </p>
    </PageShell>
  );
}

export default function App() {
  const path = window.location.pathname;

  const [formData, setFormData] = useState(getInitialInputs);
  const [submittedData, setSubmittedData] = useState(getInitialInputs);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedData = {
      ...formData,
      retirementAge: Math.max(formData.retirementAge, formData.currentAge),
      maxInvestment: Math.max(formData.maxInvestment, formData.minInvestment),
      mortgageRemainingMonths: Math.max(formData.mortgageRemainingMonths, 0),
      personalLoanRemainingMonths: Math.max(formData.personalLoanRemainingMonths, 0),
    };

    setFormData(normalizedData);
    setSubmittedData(normalizedData);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
    } catch {
      // localStorage unavailable
    }

    setTimeout(() => {
      document.getElementById("dashboard")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const resetInputs = () => {
    setFormData(defaultInputs);
    setSubmittedData(defaultInputs);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const result = useMemo(() => {
    const {
      monthlyIncome,
      annualBonus,
      mortgage,
      mortgageRemainingMonths,
      personalLoan,
      personalLoanRemainingMonths,
      insurance,
      livingExpense,
      otherExpense,
      currentCash,
      cashGoal,
      annualTravelBudget,
      currentTravelFund,
      currentInvestmentAsset,
      minInvestment,
      maxInvestment,
      annualReturnRate,
      retirementMonthlyCashflow,
      currentAge,
      retirementAge,
    } = submittedData;

    const fixedExpense =
      mortgage + personalLoan + insurance + livingExpense + otherExpense;

    const monthlyBonusEquivalent = annualBonus / 12;
    const monthlyTotalIncome = monthlyIncome + monthlyBonusEquivalent;
    const available = monthlyTotalIncome - fixedExpense;
    const necessaryExpense = fixedExpense;

    const expenseRatio =
      monthlyTotalIncome > 0 ? (fixedExpense / monthlyTotalIncome) * 100 : 0;

    const savingRate =
      monthlyTotalIncome > 0
        ? (Math.max(available, 0) / monthlyTotalIncome) * 100
        : 0;

    const cashRunwayMonths =
      necessaryExpense > 0 ? currentCash / necessaryExpense : 0;

    const sixMonthCashTarget = necessaryExpense * 6;
    const cashGapToSixMonths = Math.max(sixMonthCashTarget - currentCash, 0);

    const suggestedMonthlyCashTopUp =
      cashGapToSixMonths > 0 ? cashGapToSixMonths / 12 : 0;

    const cashProgress =
      sixMonthCashTarget > 0 ? (currentCash / sixMonthCashTarget) * 100 : 0;

    const customCashProgress =
      cashGoal > 0 ? (currentCash / cashGoal) * 100 : 0;

    const cashGapToCustomGoal = Math.max(cashGoal - currentCash, 0);

    const travelProgress =
      annualTravelBudget > 0 ? (currentTravelFund / annualTravelBudget) * 100 : 100;

    const remainingMonths = Math.max(12 - new Date().getMonth(), 1);

    const requiredMonthlyTravelSaving = Math.max(
      (annualTravelBudget - currentTravelFund) / remainingMonths,
      0
    );

    let cashAllocation = 0;
    let travelAllocation = 0;
    let investmentAllocation = 0;

    if (available > 0) {
      investmentAllocation = Math.min(minInvestment, available);
      let remaining = available - investmentAllocation;

      if (cashRunwayMonths < 6) {
        cashAllocation = remaining * 0.8;
        travelAllocation = remaining * 0.2;
      } else if (cashRunwayMonths <= 12) {
        cashAllocation = remaining * 0.3;
        travelAllocation = remaining * 0.3;
        investmentAllocation += remaining * 0.4;
      } else {
        cashAllocation = remaining * 0.1;
        travelAllocation = remaining * 0.2;
        investmentAllocation += remaining * 0.7;
      }

      if (currentTravelFund >= annualTravelBudget) {
        investmentAllocation += travelAllocation;
        travelAllocation = 0;
      }

      if (currentCash >= cashGoal && currentCash >= sixMonthCashTarget) {
        investmentAllocation += cashAllocation;
        cashAllocation = 0;
      }

      if (investmentAllocation > maxInvestment) {
        const excess = investmentAllocation - maxInvestment;
        investmentAllocation = maxInvestment;
        cashAllocation += excess;
      }
    }

    const allocationTotal = cashAllocation + travelAllocation + investmentAllocation;

    const cashAllocationRatio =
      allocationTotal > 0 ? (cashAllocation / allocationTotal) * 100 : 0;

    const travelAllocationRatio =
      allocationTotal > 0 ? (travelAllocation / allocationTotal) * 100 : 0;

    const investmentAllocationRatio =
      allocationTotal > 0 ? (investmentAllocation / allocationTotal) * 100 : 0;

    const mortgageTotalRemaining = mortgage * mortgageRemainingMonths;
    const personalLoanTotalRemaining = personalLoan * personalLoanRemainingMonths;
    const totalDebtPaymentRemaining = mortgageTotalRemaining + personalLoanTotalRemaining;

    const mortgageEndYears = mortgageRemainingMonths / 12;
    const personalLoanEndYears = personalLoanRemainingMonths / 12;

    let cashStatus = "健康";
    let advice = "目前現金水位穩定，可平衡配置投資與旅遊基金。";

    if (available < 0) {
      cashStatus = "入不敷出";
      advice =
        "目前每月固定支出已高於收入，建議優先檢視房貸、信貸、保險、生活費與其他支出，先讓現金流轉正。";
    } else if (cashRunwayMonths < 3) {
      cashStatus = "危險";
      advice =
        "現金水位低於 3 個月，建議暫緩增加風險性投資，優先補足緊急預備金。";
    } else if (cashRunwayMonths < 6) {
      cashStatus = "偏低";
      advice =
        "現金水位低於 6 個月，建議提高現金配置，先補足安全水位。";
    } else if (cashRunwayMonths > 12) {
      cashStatus = "偏高";
      advice = "現金水位超過 12 個月，可考慮提高長期投資比例。";
    }

    const monthlyReturnRate = annualReturnRate / 100 / 12;

    const projectedInvestment =
      monthlyReturnRate > 0
        ? currentInvestmentAsset * Math.pow(1 + monthlyReturnRate, 12) +
          investmentAllocation *
            ((Math.pow(1 + monthlyReturnRate, 12) - 1) / monthlyReturnRate)
        : currentInvestmentAsset + investmentAllocation * 12;

    const financialFreedomTarget = retirementMonthlyCashflow * 12 * 25;

    const financialFreedomGap = Math.max(
      financialFreedomTarget - currentInvestmentAsset,
      0
    );

    const financialFreedomProgress =
      financialFreedomTarget > 0
        ? (currentInvestmentAsset / financialFreedomTarget) * 100
        : 0;

    const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
    const monthsToRetirement = yearsToRetirement * 12;

    const projectedInvestmentAtRetirement =
      monthsToRetirement > 0
        ? monthlyReturnRate > 0
          ? currentInvestmentAsset *
              Math.pow(1 + monthlyReturnRate, monthsToRetirement) +
            investmentAllocation *
              ((Math.pow(1 + monthlyReturnRate, monthsToRetirement) - 1) /
                monthlyReturnRate)
          : currentInvestmentAsset + investmentAllocation * monthsToRetirement
        : currentInvestmentAsset;

    const retirementReadinessProgress =
      financialFreedomTarget > 0
        ? (projectedInvestmentAtRetirement / financialFreedomTarget) * 100
        : 0;

    const requiredMonthlyInvestmentToRetire =
      monthsToRetirement > 0
        ? monthlyReturnRate > 0
          ? Math.max(
              ((financialFreedomTarget -
                currentInvestmentAsset *
                  Math.pow(1 + monthlyReturnRate, monthsToRetirement)) *
                monthlyReturnRate) /
                (Math.pow(1 + monthlyReturnRate, monthsToRetirement) - 1),
              0
            )
          : Math.max(
              (financialFreedomTarget - currentInvestmentAsset) /
                monthsToRetirement,
              0
            )
        : financialFreedomGap;

    let investmentAdvice = "";

    if (available < 0) {
      investmentAdvice =
        "目前現金流為負，退休與財務自由規劃應先暫緩加碼，優先處理每月收支結構。";
    } else if (cashRunwayMonths < 6) {
      investmentAdvice =
        "目前建議以補強現金水位為優先，投資維持最低定期定額即可。";
    } else if (retirementReadinessProgress < 50) {
      investmentAdvice =
        "依目前年齡、目標退休年齡與投資金額推估，退休準備仍需要加速。可評估提高每月投資金額、延後退休年齡或降低退休後每月現金流需求。";
    } else if (retirementReadinessProgress < 100) {
      investmentAdvice =
        "目前退休進度已有基礎，但距離完整財務自由仍有缺口。建議維持核心投資，同時控制單一標的集中風險。";
    } else {
      investmentAdvice =
        "依目前假設推估，退休時投資資產有機會達成財務自由目標。建議後續逐步納入現金流型資產與防禦型配置。";
    }

    return {
      fixedExpense,
      monthlyBonusEquivalent,
      monthlyTotalIncome,
      available,
      expenseRatio,
      savingRate,
      cashRunwayMonths,
      sixMonthCashTarget,
      cashGapToSixMonths,
      suggestedMonthlyCashTopUp,
      cashProgress,
      customCashProgress,
      cashGapToCustomGoal,
      cashGoal,
      currentCash,
      travelProgress,
      requiredMonthlyTravelSaving,
      cashAllocation,
      travelAllocation,
      investmentAllocation,
      cashAllocationRatio,
      travelAllocationRatio,
      investmentAllocationRatio,
      allocationTotal,
      mortgageTotalRemaining,
      personalLoanTotalRemaining,
      totalDebtPaymentRemaining,
      mortgageEndYears,
      personalLoanEndYears,
      cashStatus,
      advice,
      projectedInvestment,
      financialFreedomTarget,
      financialFreedomGap,
      financialFreedomProgress,
      yearsToRetirement,
      projectedInvestmentAtRetirement,
      retirementReadinessProgress,
      requiredMonthlyInvestmentToRetire,
      investmentAdvice,
    };
  }, [submittedData]);

  if (path === "/about") {
    return <AboutPage />;
  }

  if (path === "/privacy-policy") {
    return <PrivacyPolicyPage />;
  }

  if (path === "/disclaimer") {
    return <DisclaimerPage />;
  }

  if (path === "/contact") {
    return <ContactPage />;
  }

  if (path === "/monthly-saving-rate") {
    return <MonthlySavingRatePage />;
  }

  if (path === "/blog") {
    return <BlogIndexPage />;
  }

  if (path.startsWith("/blog/")) {
    const slug = path.replace("/blog/", "");
    return <ArticlePage slug={slug} />;
  }

  return (
    <PageShell>
      <section className="hero">
        <div>
          {isDev && <GrowthAgent />}

          <p className="eyebrow">Personal FinOps Planner</p>

          <h1>個人財務管理工具｜用理財規劃做好現金流管理</h1>

          <div style={{ marginTop: "20px", marginBottom: "24px" }}>
            <a href="#calculator" className="cta-button">
              👉 開始試算我的財務狀況（免費）
            </a>
          </div>

          <p>
            想知道財務自由怎麼開始？FinOps Planner 是一個免費個人財務管理工具，
            幫助你用數據計算每月存錢比例、現金安全月數、投資配置與財務自由缺口。
            它不是單純記帳，而是協助你理解每一筆收入進來後，應該如何分配到生活費、
            現金水位、旅遊基金、股票投資與退休準備。
          </p>

          <p>
            對多數上班族來說，理財最困難的地方不是不知道要存錢，而是不知道每月到底能存多少、
            該先補現金還是先投資、旅行預算是否會影響財務安全，以及負債會不會壓縮未來的選擇。
            Personal FinOps Planner 把這些問題整理成一個可視化儀表板，讓你用數字看懂自己的財務狀態。
          </p>

          <p>
            你可以輸入每月收入、年度獎金、房貸、信貸、保險、生活費、其他支出、
            目前現金、年度旅遊預算、投資金額、預期報酬率、目前年齡與目標退休年齡。
            系統會估算每月可分配金額、固定支出率、現金安全月數、6 個月現金目標、
            自訂現金目標達成率、旅遊基金達成率、建議投資金額與退休時可能累積的資產。
          </p>

          <p>
            這個工具特別適合月薪族、ETF 投資者、有房貸或信貸的人、正在建立旅遊基金的人，
            以及想開始規劃財務自由的人。透過個人 FinOps 的方式，你可以把理財從模糊感覺變成清楚流程：
            先確保現金流安全，再安排生活品質，最後逐步累積長期資產。
          </p>
        </div>
      </section>

      <section className="seo-content">
        <h2>免費個人財務管理工具：從現金流管理開始</h2>
        <p>
          多數人以為理財規劃的第一步是投資，但真正穩定的個人財務管理，
          應該先從現金流管理開始。你需要知道每個月收入扣除房貸、信貸、
          保險、生活費與固定支出後，還剩下多少可分配金額。
        </p>
        <p>
          FinOps Planner 會根據你的收入、年度獎金、固定支出、目前現金、
          旅遊預算與投資上限，自動計算每月資金分配建議，協助你建立更清楚的財務決策流程。
        </p>

        <h2>理財規劃不只記帳，而是做出更好的財務決策</h2>
        <p>
          傳統記帳工具通常只能告訴你錢花去哪裡，但完整的理財規劃應該回答：
          現金安全水位是否足夠？每月存錢比例是否合理？投資比例是否過高？
          距離財務自由還差多少？貸款剩餘期數會如何影響未來現金流？
        </p>
        <p>
          這個工具將個人財務管理拆解成現金、旅遊基金、股票投資、貸款期數與退休現金流目標，
          讓你可以用一個簡單的儀表板追蹤整體財務狀況。
        </p>
      </section>

      <section id="calculator" className="section calculator-section">
        <div className="section-header">
          <p className="eyebrow-dark">Step 1｜輸入資料</p>
          <h2>輸入你的財務資料</h2>
          <p>
            輸入後請按下「更新試算結果」，系統會在本機瀏覽器記住你前一次輸入的資料。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-section">
              <h2>收入設定</h2>
              <InputCard
                label="每月收入"
                value={formData.monthlyIncome}
                onChange={(value) => updateField("monthlyIncome", value)}
              />
              <InputCard
                label="每年獎金收入"
                value={formData.annualBonus}
                onChange={(value) => updateField("annualBonus", value)}
              />
            </div>

            <div className="form-section">
              <h2>固定支出</h2>
              <InputCard
                label="房貸每月金額"
                value={formData.mortgage}
                onChange={(value) => updateField("mortgage", value)}
              />
              <InputCard
                label="房貸剩餘期數"
                value={formData.mortgageRemainingMonths}
                onChange={(value) => updateField("mortgageRemainingMonths", value)}
                suffix="期"
              />
              <InputCard
                label="信貸每月金額"
                value={formData.personalLoan}
                onChange={(value) => updateField("personalLoan", value)}
              />
              <InputCard
                label="信貸剩餘期數"
                value={formData.personalLoanRemainingMonths}
                onChange={(value) => updateField("personalLoanRemainingMonths", value)}
                suffix="期"
              />
              <InputCard
                label="保險"
                value={formData.insurance}
                onChange={(value) => updateField("insurance", value)}
              />
              <InputCard
                label="生活費"
                value={formData.livingExpense}
                onChange={(value) => updateField("livingExpense", value)}
              />
              <InputCard
                label="其他支出"
                value={formData.otherExpense}
                onChange={(value) => updateField("otherExpense", value)}
              />
            </div>

            <div className="form-section">
              <h2>旅遊與現金水位</h2>
              <InputCard
                label="目前現金"
                value={formData.currentCash}
                onChange={(value) => updateField("currentCash", value)}
              />
              <InputCard
                label="自訂現金目標"
                value={formData.cashGoal}
                onChange={(value) => updateField("cashGoal", value)}
              />
              <InputCard
                label="年度旅遊預算"
                value={formData.annualTravelBudget}
                onChange={(value) => updateField("annualTravelBudget", value)}
              />
              <InputCard
                label="目前旅遊基金"
                value={formData.currentTravelFund}
                onChange={(value) => updateField("currentTravelFund", value)}
              />
            </div>

            <div className="form-section">
              <h2>投資與退休設定</h2>
              <InputCard
                label="目前投資資產"
                value={formData.currentInvestmentAsset}
                onChange={(value) =>
                  updateField("currentInvestmentAsset", value)
                }
              />
              <InputCard
                label="每月最低投資金額"
                value={formData.minInvestment}
                onChange={(value) => updateField("minInvestment", value)}
              />
              <InputCard
                label="每月最高投資金額"
                value={formData.maxInvestment}
                onChange={(value) => updateField("maxInvestment", value)}
              />
              <InputCard
                label="預期年化報酬率"
                value={formData.annualReturnRate}
                onChange={(value) => updateField("annualReturnRate", value)}
                suffix="%"
              />
              <InputCard
                label="退休後每月期待現金流"
                value={formData.retirementMonthlyCashflow}
                onChange={(value) =>
                  updateField("retirementMonthlyCashflow", value)
                }
              />
              <InputCard
                label="目前年齡"
                value={formData.currentAge}
                onChange={(value) => updateField("currentAge", value)}
                suffix="歲"
              />
              <InputCard
                label="目標退休年齡"
                value={formData.retirementAge}
                onChange={(value) => updateField("retirementAge", value)}
                suffix="歲"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              更新試算結果
            </button>
            <button type="button" className="secondary-button" onClick={resetInputs}>
              重設預設值
            </button>
          </div>
        </form>
      </section>

      <section id="dashboard" className="dashboard">
        <MetricCard
          title="每月總收入"
          value={formatNTD(result.monthlyTotalIncome)}
          note={`含獎金月均 ${formatNTD(result.monthlyBonusEquivalent)}`}
        />
        <MetricCard
          title="每月可分配金額"
          value={formatNTD(result.available)}
          note={`存錢率 ${clamp(result.savingRate).toFixed(1)}%`}
        />
        <MetricCard
          title="固定支出合計"
          value={formatNTD(result.fixedExpense)}
          note={`支出率 ${clamp(result.expenseRatio).toFixed(1)}%`}
        />
        <MetricCard
          title="現金安全月數"
          value={`${result.cashRunwayMonths.toFixed(1)} 個月`}
          note={result.cashStatus}
        />
      </section>

      <section className="dashboard">
        <MetricCard
          title="房貸剩餘期數"
          value={`${submittedData.mortgageRemainingMonths} 期`}
          note={`約 ${result.mortgageEndYears.toFixed(1)} 年`}
        />
        <MetricCard
          title="房貸剩餘月付總額"
          value={formatNTD(result.mortgageTotalRemaining)}
          note="以目前月付金額估算"
        />
        <MetricCard
          title="信貸剩餘期數"
          value={`${submittedData.personalLoanRemainingMonths} 期`}
          note={`約 ${result.personalLoanEndYears.toFixed(1)} 年`}
        />
        <MetricCard
          title="信貸剩餘月付總額"
          value={formatNTD(result.personalLoanTotalRemaining)}
          note="以目前月付金額估算"
        />
      </section>

      <section className="section visual-section">
        <div className="section-header">
          <p className="eyebrow-dark">Step 2｜財務儀表板</p>
          <h2>可視化財務追蹤</h2>
          <p>一次檢視現金安全水位、自訂現金目標、旅遊基金與財務自由進度。</p>
        </div>

        <div className="visual-grid">
          <div className="visual-card">
            <h3>現金安全水位追蹤</h3>
            <ProgressBar value={result.cashProgress} />
            <p className="progress-text">
              6 個月現金目標達成率：{clamp(result.cashProgress).toFixed(1)}%
            </p>
            <p className="progress-text">
              目標現金水位：{formatNTD(result.sixMonthCashTarget)}
            </p>
            <p className="progress-text">
              距離 6 個月水位還差：{formatNTD(result.cashGapToSixMonths)}
            </p>
          </div>

          <div className="visual-card">
            <h3>自訂現金目標追蹤</h3>
            <ProgressBar value={result.customCashProgress} />
            <p className="progress-text">
              自訂目標達成率：{clamp(result.customCashProgress).toFixed(1)}%
            </p>
            <p className="progress-text">
              自訂現金目標：{formatNTD(result.cashGoal)}
            </p>
            <p className="progress-text">
              距離自訂目標還差：{formatNTD(result.cashGapToCustomGoal)}
            </p>
          </div>

          <div className="visual-card">
            <h3>旅遊預算追蹤</h3>
            <ProgressBar value={result.travelProgress} />
            <p className="progress-text">
              旅遊預算達成率：{clamp(result.travelProgress).toFixed(1)}%
            </p>
            <p className="progress-text">
              建議每月旅遊沉澱：{formatNTD(result.requiredMonthlyTravelSaving)}
            </p>
          </div>

          <div className="visual-card">
            <h3>財務自由進度</h3>
            <ProgressBar value={result.financialFreedomProgress} />
            <p className="progress-text">
              目前資產達成率：
              {clamp(result.financialFreedomProgress).toFixed(1)}%
            </p>
            <p className="progress-text">
              財務自由目標資產：{formatNTD(result.financialFreedomTarget)}
            </p>
            <p className="progress-text">
              目前還差：{formatNTD(result.financialFreedomGap)}
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>本月建議分配</h2>

        <div className="allocation-grid">
          <AllocationCard
            title="建議補現金"
            amount={result.cashAllocation}
            note={`分配占比 ${clamp(result.cashAllocationRatio).toFixed(1)}%`}
          />
          <AllocationCard
            title="建議旅遊基金"
            amount={result.travelAllocation}
            note={`分配占比 ${clamp(result.travelAllocationRatio).toFixed(1)}%`}
          />
          <AllocationCard
            title="建議股票投資"
            amount={result.investmentAllocation}
            note={`分配占比 ${clamp(result.investmentAllocationRatio).toFixed(1)}%`}
          />
        </div>

        <div className="stacked-bar">
          <div
            className="stacked-segment cash"
            style={{ width: `${clamp(result.cashAllocationRatio)}%` }}
          />
          <div
            className="stacked-segment travel"
            style={{ width: `${clamp(result.travelAllocationRatio)}%` }}
          />
          <div
            className="stacked-segment investment"
            style={{ width: `${clamp(result.investmentAllocationRatio)}%` }}
          />
        </div>

        <div className="legend">
          <span>
            <i className="legend-dot cash" />
            補現金
          </span>
          <span>
            <i className="legend-dot travel" />
            旅遊基金
          </span>
          <span>
            <i className="legend-dot investment" />
            股票投資
          </span>
        </div>

        <div className="advice-box">{result.advice}</div>
      </section>

      <section className="section">
        <h2>退休現金流與財務自由推估</h2>

        <div className="dashboard compact-dashboard">
          <MetricCard title="目前年齡" value={`${submittedData.currentAge} 歲`} />
          <MetricCard
            title="目標退休年齡"
            value={`${submittedData.retirementAge} 歲`}
          />
          <MetricCard
            title="距離退休"
            value={`${result.yearsToRetirement} 年`}
          />
          <MetricCard
            title="退休達成率"
            value={`${clamp(result.retirementReadinessProgress).toFixed(1)}%`}
          />
        </div>

        <div className="allocation-grid">
          <AllocationCard
            title="財務自由目標資產"
            amount={result.financialFreedomTarget}
            note="以 25 倍退休年支出估算"
          />
          <AllocationCard
            title="12 個月後投資資產預估"
            amount={result.projectedInvestment}
            note="依目前每月投資與年化報酬率估算"
          />
          <AllocationCard
            title="退休時預估投資資產"
            amount={result.projectedInvestmentAtRetirement}
            note="依目前年齡、退休年齡與每月投資估算"
          />
        </div>

        <div className="retirement-progress">
          <h3>退休目標達成率</h3>
          <ProgressBar value={result.retirementReadinessProgress} />
          <p className="progress-text">
            若要在 {submittedData.retirementAge} 歲退休，依目前假設推估，每月建議投資：
            <strong> {formatNTD(result.requiredMonthlyInvestmentToRetire)}</strong>
          </p>
        </div>

        <div className="advice-box">{result.investmentAdvice}</div>
      </section>

      <SharePanel result={result} />

      <section className="seo-content">
        <h2>這個個人財務管理工具適合誰？</h2>
        <p>
          FinOps Planner 適合想開始理財規劃的新手，也適合已經有投資習慣、
          但想更精準管理現金流與每月存錢比例的人。若你常常覺得收入不低，
          但月底卻沒有留下多少錢，這個工具可以協助你重新檢視資金分配。
        </p>

        <h2>為什麼現金流管理比單純記帳更重要？</h2>
        <p>
          記帳是回頭看過去的支出，現金流管理則是幫你安排未來的資金。
          當你知道每月可分配金額、現金安全月數與財務自由缺口後，
          就能更理性地決定該存錢、投資、還債，或安排旅遊基金。
        </p>

        <h2>延伸閱讀</h2>
        <div className="inline-links">
          {articles.slice(0, 4).map((article) => (
            <a key={article.slug} href={`/blog/${article.slug}`}>
              {article.title}
            </a>
          ))}
        </div>
      </section>

      <section className="seo-content">
        <h2>個人財務管理常見問題 FAQ</h2>

        <h3>個人財務管理應該從哪裡開始？</h3>
        <p>
          建議先從現金流管理開始，了解每月收入與固定支出，確保至少 3–6 個月的現金安全水位，
          再逐步建立投資與存錢比例。
        </p>

        <h3>理財規劃一定要記帳嗎？</h3>
        <p>
          記帳可以幫助了解支出，但更重要的是建立資金分配策略。
          本工具著重在「如何分配錢」，而不只是記錄花費。
        </p>

        <h3>每月存錢比例應該多少？</h3>
        <p>
          一般建議至少 20%，若希望加速累積資產可以提高到 30%–40%。
          但最佳比例應依個人收入與支出結構調整。
        </p>

        <h3>財務自由怎麼開始？</h3>
        <p>
          財務自由的第一步是建立穩定現金流與儲蓄習慣，
          接著透過長期投資累積資產，最終讓資產產生的現金流覆蓋生活支出。
        </p>

        <h3>這個工具適合新手嗎？</h3>
        <p>
          非常適合。本工具將個人財務管理拆解為簡單步驟，
          即使沒有理財經驗也可以快速上手。
        </p>
      </section>
    </PageShell>
  );
}
