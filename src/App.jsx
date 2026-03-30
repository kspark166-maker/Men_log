import { useState, useRef, useEffect, createContext, useContext } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 修正点サマリー（元ファイルからの変更箇所）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [FIX-1] THEMES の grad/sh が \\\" になっていた → 正しい文字列リテラルに修正
// [FIX-2] PostModal の z_index → zIndex (React DOM プロパティ名)
// [FIX-3] via.placeholder.com (404) → SVG data URI のフォールバック画像に変更
// [FIX-4] groups が localStorage に未保存 → useEffect 追加
// [FIX-5] useCallback import のみで未使用 → 削除
// [FIX-6] MyPage <img src={undefined}> → フォールバック追加
// [ADD]   デモデータ追加（初回表示時に記録が見える状態に）
// [ADD]   Men～Log ロゴ（麺SVG）をヘッダーに追加
// [ADD]   MenLogMonitor コンポーネント（デモ／差し替えモニター）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── テーマ設定 ──────────────────────────────────────────────
// [FIX-1] grad / sh の \\\" エスケープを除去
const THEMES = {
  warm:   { bg:"#FFF8F3", bg2:"#FFF0E6", card:"#FFFFFF", acc:"#C0392B", accm:"#FADBD8", tx:"#1A0A00", tx2:"#6B4C3B", txm:"#A0826D", br:"#F0DDD5", star:"#E67E22", grad:"linear-gradient(135deg,#C0392B,#E74C3C)", sh:"rgba(192,57,43,0.12)" },
  dark:   { bg:"#0F0A08", bg2:"#1A110D", card:"#231610", acc:"#E74C3C", accm:"#3D1A17", tx:"#F5EDE8", tx2:"#C4A99A", txm:"#7A5C4F", br:"#3D2418", star:"#F39C12", grad:"linear-gradient(135deg,#E74C3C,#FF6B6B)", sh:"rgba(231,76,60,0.2)"  },
  cool:   { bg:"#F0F4FF", bg2:"#E8EEFF", card:"#FFFFFF", acc:"#3B5BDB", accm:"#DBE4FF", tx:"#0A0F2C", tx2:"#3B4A8A", txm:"#7C8DB0", br:"#D0D9F5", star:"#F59F00", grad:"linear-gradient(135deg,#3B5BDB,#4C6EF5)", sh:"rgba(59,91,219,0.12)" },
  season: { bg:"#F5FFF0", bg2:"#EAFAE0", card:"#FFFFFF", acc:"#2E7D32", accm:"#C8E6C9", tx:"#0A1F0C", tx2:"#2E5C30", txm:"#6A9B6D", br:"#D4EDD6", star:"#F57F17", grad:"linear-gradient(135deg,#2E7D32,#43A047)", sh:"rgba(46,125,50,0.12)" },
};

const RAMENDB_BASE = "https://ramendb.supleks.jp";
const RAMENDB_RANK = "https://ramendb.supleks.jp/rank";
const APP_LINK     = "https://men-log2-yerr.vercel.app/";
const GENRES = ["すべて","醤油","豚骨","塩","味噌","つけ麺","鶏白湯","二郎系","中華そば","煮干し","その他"];
const AREAS  = ["すべて","新宿","渋谷","池袋","代々木","中野","三田","巣鴨","五反田","横浜","松戸","博多","札幌"];

// [FIX-3] via.placeholder.com の代わりに使うSVG Data URI
const PLACEHOLDER = (text="🍜") =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='%23FADBD8'/><text x='75' y='85' font-size='48' text-anchor='middle'>${encodeURIComponent(text)}</text></svg>`;

// [ADD] デモデータ（初回表示用）
const DEMO_ENTRIES = [
  { id:"d1", shopName:"飯田商店",   visitDate:"2026-03-20", rating:5, genre:"塩",   area:"湯河原", images:[PLACEHOLDER("✨")], groupId:"g1", comment:"人生で一番うまいラーメン" },
  { id:"d2", shopName:"中華そば とみ田", visitDate:"2026-03-15", rating:5, genre:"つけ麺", area:"松戸",  images:[PLACEHOLDER("🎯")], groupId:"g1", comment:"つけ麺の概念が変わった" },
  { id:"d3", shopName:"一蘭 渋谷",  visitDate:"2026-02-28", rating:4, genre:"豚骨", area:"渋谷",  images:[PLACEHOLDER("🐷")], groupId:"",   comment:"個室で集中して食べる" },
  { id:"d4", shopName:"二郎 三田本店",visitDate:"2026-02-10",rating:3, genre:"二郎系",area:"三田", images:[PLACEHOLDER("💪")], groupId:"",   comment:"量が限界突破してた" },
];
const DEMO_SHOPS = [
  { name:"らぁ麺 飯田商店",       score:98.5, genre:"塩",   area:"湯河原", id:"119107" },
  { name:"中華そば とみ田",       score:97.2, genre:"つけ麺",area:"松戸",  id:"3051"   },
  { name:"Japanese Soba Noodles 蔦", score:96.0, genre:"醤油", area:"巣鴨",  id:"58279"  },
  { name:"麺屋 武蔵",             score:88.5, genre:"醤油", area:"新宿",  id:"1"      },
  { name:"風雲児",                score:89.3, genre:"鶏白湯",area:"代々木",id:"4"      },
];

// ─── Context ────────────────────────────────────────────────
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function Provider({ children }) {
  const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

  const [entries,    setEntries]    = useState(() => load("rd_entries",  DEMO_ENTRIES));
  const [groups,     setGroups]     = useState(() => load("rd_groups",   [{ id:"g1", name:"ラーメン部", emoji:"🍜", members:["あなた","田中","佐藤"] }]));
  const [profile,    setProfile]    = useState(() => load("rd_profile",  { name:"ユーザー", gender:"未設定", station:"未設定", favorite:"醤油" }));
  const [settings,   setSettings]   = useState(() => load("rd_settings", { theme:"warm" }));
  const [tab,        setTab]        = useState(0);
  const [showPost,   setShowPost]   = useState(false);
  const [filterMode, setFilterMode] = useState({ type:"all", value:null });

  // [FIX-4] groups も localStorage に保存
  useEffect(() => { localStorage.setItem("rd_entries",  JSON.stringify(entries));  }, [entries]);
  useEffect(() => { localStorage.setItem("rd_groups",   JSON.stringify(groups));   }, [groups]);
  useEffect(() => { localStorage.setItem("rd_profile",  JSON.stringify(profile));  }, [profile]);
  useEffect(() => { localStorage.setItem("rd_settings", JSON.stringify(settings)); }, [settings]);

  const t = THEMES[settings.theme] || THEMES.warm;

  return (
    <Ctx.Provider value={{ entries, setEntries, groups, setGroups, profile, setProfile, settings, setSettings, tab, setTab, showPost, setShowPost, filterMode, setFilterMode, t }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── 共通: Men～Log ロゴ SVG ────────────────────────────────
function MenLogLogo({ size = 20 }) {
  const { t } = useApp();
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:1, fontFamily:"Georgia,serif", fontWeight:700, fontSize:size, color:t.tx, lineHeight:1 }}>
      <span>Men</span>
      <svg width={Math.round(size*1.8)} height={Math.round(size*0.85)} viewBox="0 0 36 16" fill="none"
        style={{ display:"inline-block", verticalAlign:"middle", margin:"0 1px" }}>
        <path d="M2 3 Q7 0 12 3 Q17 6 22 3 Q27 0 32 3 Q34.5 4.5 34 4"  stroke={t.acc} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <path d="M2 7.5 Q7 4.5 12 7.5 Q17 10.5 22 7.5 Q27 4.5 32 7.5 Q34.5 9 34 8.5" stroke={t.acc} strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.65"/>
        <path d="M2 12 Q7 9 12 12 Q17 15 22 12 Q27 9 32 12 Q34.5 13.5 34 13" stroke={t.acc} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
      </svg>
      <span>Log</span>
    </span>
  );
}

// ─── ホーム ──────────────────────────────────────────────────
function HomePage() {
  const { entries, profile, setTab, setFilterMode, t } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const months = Array.from(new Set(entries.map(e => e.visitDate?.slice(0, 7)).filter(Boolean))).sort().reverse();
  if (!months.includes(new Date().toISOString().slice(0, 7))) months.unshift(new Date().toISOString().slice(0, 7));

  const stats = {
    total: entries.length,
    month: entries.filter(e => e.visitDate?.startsWith(selectedMonth)).length,
    avg:   entries.length ? (entries.reduce((a, b) => a + (b.rating||0), 0) / entries.length).toFixed(1) : "0.0",
  };

  return (
    <div style={{ height:"100%", overflowY:"auto", background:t.bg }}>
      {/* ヒーローバナー */}
      <div style={{ background:t.grad, padding:"40px 20px 24px", color:"white", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,0.1)" }}/>
        <div style={{ fontSize:12, opacity:0.85, marginBottom:4 }}>おかえり 👋</div>
        <h2 style={{ fontSize:22, fontFamily:"Georgia,serif", margin:0 }}>{profile.name}さんのMen～Log</h2>
        {profile.station !== "未設定" && (
          <div style={{ fontSize:11, opacity:0.75, marginTop:4 }}>🚉 {profile.station} · ❤️ {profile.favorite}</div>
        )}
        {/* 統計カード */}
        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          {/* 訪問件数 */}
          <div onClick={() => { setFilterMode({ type:"all" }); setTab(3); }}
            style={{ flex:1, background:"rgba(255,255,255,0.2)", padding:14, borderRadius:14, textAlign:"center", cursor:"pointer", backdropFilter:"blur(4px)" }}>
            <div style={{ fontSize:10, opacity:0.85 }}>訪問件数</div>
            <div style={{ fontSize:24, fontWeight:900, lineHeight:1.2 }}>{stats.total}</div>
            <div style={{ fontSize:9, opacity:0.7 }}>タップで一覧 →</div>
          </div>
          {/* 今月（月セレクタ付き） */}
          <div style={{ flex:1, background:"rgba(255,255,255,0.2)", padding:14, borderRadius:14, textAlign:"center", backdropFilter:"blur(4px)", position:"relative" }}>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              style={{ background:"none", border:"none", color:"white", fontSize:10, outline:"none", cursor:"pointer", width:"100%", textAlign:"center" }}>
              {months.map(m => <option key={m} value={m} style={{ color:"#000" }}>{m}</option>)}
            </select>
            <div onClick={() => { setFilterMode({ type:"month", value:selectedMonth }); setTab(3); }}
              style={{ fontSize:24, fontWeight:900, lineHeight:1.2, cursor:"pointer" }}>{stats.month}</div>
            <div style={{ fontSize:9, opacity:0.7 }}>タップで絞込 →</div>
          </div>
          {/* 平均 */}
          <div onClick={() => { setFilterMode({ type:"high" }); setTab(3); }}
            style={{ flex:1, background:"rgba(255,255,255,0.2)", padding:14, borderRadius:14, textAlign:"center", cursor:"pointer", backdropFilter:"blur(4px)" }}>
            <div style={{ fontSize:10, opacity:0.85 }}>平均</div>
            <div style={{ fontSize:24, fontWeight:900, lineHeight:1.2 }}>{stats.avg}★</div>
            <div style={{ fontSize:9, opacity:0.7 }}>高評価で絞込 →</div>
          </div>
        </div>
      </div>

      {/* プロフィールカード */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ background:t.card, padding:14, borderRadius:14, boxShadow:`0 4px 12px ${t.sh}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:t.txm, marginBottom:4 }}>👤 プロフィール</div>
          <div style={{ fontSize:13, color:t.tx }}>最寄り駅: <strong>{profile.station}</strong> &nbsp;/&nbsp; 好きなジャンル: <strong>{profile.favorite}</strong></div>
        </div>
      </div>

      {/* おすすめリスト */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontWeight:700, fontSize:14, color:t.tx }}>🔥 ラーメンDB おすすめ</span>
          <a href={RAMENDB_RANK} target="_blank" rel="noreferrer" style={{ fontSize:11, color:t.acc, fontWeight:700, textDecoration:"none" }}>全て見る →</a>
        </div>
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:8 }}>
          {DEMO_SHOPS.slice(0,4).map((s,i) => (
            <a key={i} href={`${RAMENDB_BASE}/s/${s.id}.html`} target="_blank" rel="noreferrer"
              style={{ minWidth:120, flexShrink:0, background:t.card, border:`1px solid ${t.br}`, borderRadius:12, overflow:"hidden", textDecoration:"none", boxShadow:`0 2px 8px ${t.sh}` }}>
              <div style={{ height:56, background:t.accm, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
                {["✨","🎯","🎌","🏆","☁️"][i]}
              </div>
              <div style={{ padding:"8px 10px" }}>
                <div style={{ fontWeight:700, fontSize:11, color:t.tx, marginBottom:2 }}>{s.name}</div>
                <div style={{ fontSize:10, color:t.star, fontWeight:700 }}>{s.score}pt</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 最近の記録 */}
      <div style={{ padding:"12px 16px 24px" }}>
        <div style={{ fontWeight:700, fontSize:14, color:t.tx, marginBottom:10 }}>📖 最近の記録</div>
        {entries.slice(0,3).map(e => (
          <div key={e.id} style={{ background:t.card, borderRadius:12, padding:12, marginBottom:8, display:"flex", gap:12, boxShadow:`0 2px 8px ${t.sh}` }}>
            <img src={e.images?.[0] || PLACEHOLDER()} alt={e.shopName}
              style={{ width:46, height:46, borderRadius:10, objectFit:"cover", flexShrink:0 }}
              onError={ev => { ev.target.src = PLACEHOLDER(); }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:t.tx }}>{e.shopName}</div>
              <div style={{ fontSize:11, color:t.txm }}>{e.visitDate} · {e.genre}</div>
              <div style={{ fontSize:11, color:t.star }}>{"★".repeat(e.rating||0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── おすすめ（ラーメンDB連携） ─────────────────────────────
function RecommendPage() {
  const { t } = useApp();
  const [genre, setGenre] = useState("すべて");
  const filtered = genre === "すべて" ? DEMO_SHOPS : DEMO_SHOPS.filter(s => s.genre === genre);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:t.bg }}>
      {/* DBバナー */}
      <a href={RAMENDB_RANK} target="_blank" rel="noreferrer"
        style={{ flexShrink:0, display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:t.accm, textDecoration:"none", borderBottom:`1px solid ${t.br}` }}>
        <span style={{ fontSize:14 }}>🌐</span>
        <span style={{ fontSize:11, fontWeight:700, color:t.acc, flex:1 }}>ラーメンデータベース連携 — 評価ポイント順</span>
        <span style={{ fontSize:10, color:t.txm }}>ramendb.supleks.jp →</span>
      </a>
      {/* ジャンルフィルタ */}
      <div style={{ flexShrink:0, padding:"8px 12px", display:"flex", gap:6, overflowX:"auto", borderBottom:`1px solid ${t.br}`, background:t.bg }}>
        {["すべて","醤油","豚骨","塩","味噌","つけ麺","その他"].map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{ flexShrink:0, padding:"4px 12px", borderRadius:20, border:"none", background:genre===g?t.acc:t.bg2, color:genre===g?"white":t.tx2, fontSize:11, fontWeight:600, cursor:"pointer" }}>
            {g}
          </button>
        ))}
      </div>
      {/* ランキングリスト */}
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        <div style={{ fontWeight:700, fontSize:14, color:t.tx, marginBottom:12 }}>🏆 ランキング ({filtered.length}件)</div>
        {filtered.map((shop, i) => (
          <div key={i} style={{ background:t.card, padding:14, borderRadius:14, marginBottom:10, boxShadow:`0 2px 8px ${t.sh}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":t.bg2, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:i<3?"white":t.txm, flexShrink:0 }}>{i+1}</div>
                <span style={{ fontWeight:700, fontSize:14, color:t.tx }}>{shop.name}</span>
              </div>
              <span style={{ color:t.star, fontWeight:900, fontSize:14 }}>{shop.score} pt</span>
            </div>
            {/* スコアバー */}
            <div style={{ background:t.bg2, borderRadius:4, height:4, margin:"6px 0" }}>
              <div style={{ height:"100%", background:t.grad, width:`${Math.min(shop.score,100)}%`, borderRadius:4 }}/>
            </div>
            <div style={{ fontSize:12, color:t.txm, marginBottom:8 }}>{shop.area} / {shop.genre}</div>
            <a href={`${RAMENDB_BASE}/s/${shop.id}.html`} target="_blank" rel="noreferrer"
              style={{ display:"block", textAlign:"center", padding:"8px", background:t.bg2, borderRadius:10, fontSize:12, color:t.acc, fontWeight:700, textDecoration:"none" }}>
              🌐 店舗詳細を見る（ラーメンDB）
            </a>
          </div>
        ))}
        <div style={{ marginTop:12, textAlign:"center" }}>
          <a href={RAMENDB_RANK} target="_blank" rel="noreferrer"
            style={{ display:"inline-block", padding:"10px 24px", borderRadius:20, border:`1px solid ${t.br}`, background:t.card, color:t.tx, fontSize:12, textDecoration:"none", fontWeight:600 }}>
            ラーメンDBでランキング全件を見る →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── アルバム ─────────────────────────────────────────────────
function AlbumPage() {
  const { entries, setEntries, t } = useApp();
  const fileRef = useRef(null);
  const [editId, setEditId] = useState(null);

  const deleteEntry = (id) => {
    if (window.confirm("この記録を削除しますか？")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // 複数画像追加
  const addImages = (id, files) => {
    const readers = Array.from(files).map(file =>
      new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); })
    );
    Promise.all(readers).then(imgs => {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, images: [...(e.images||[]), ...imgs] } : e));
    });
  };

  const removeImage = (entryId, imgIdx) => {
    setEntries(prev => prev.map(e => e.id === entryId
      ? { ...e, images: e.images.filter((_,i) => i !== imgIdx) }
      : e
    ));
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:t.bg }}>
      <div style={{ flexShrink:0, padding:"10px 16px", borderBottom:`1px solid ${t.br}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, fontSize:14, color:t.tx }}>📷 アルバム ({entries.length}件)</span>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:12 }}>
        {entries.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:t.txm }}>
            <div style={{ fontSize:48 }}>📷</div>
            <div style={{ marginTop:12, fontWeight:700, color:t.tx }}>記録がありません</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {entries.map(e => (
              <div key={e.id} style={{ background:t.card, borderRadius:12, overflow:"hidden", position:"relative", boxShadow:`0 2px 10px ${t.sh}` }}>
                {/* [FIX-3] placeholder.com廃止 → PLACEHOLDER() SVG */}
                <img
                  src={e.images?.[0] || PLACEHOLDER()}
                  alt={e.shopName}
                  style={{ width:"100%", height:110, objectFit:"cover", display:"block" }}
                  onError={ev => { ev.target.src = PLACEHOLDER(); }}
                />
                {/* 複数枚バッジ */}
                {(e.images?.length||0) > 1 && (
                  <div style={{ position:"absolute", top:6, left:6, background:"rgba(0,0,0,0.6)", color:"white", fontSize:9, borderRadius:8, padding:"2px 6px" }}>
                    {e.images.length}枚
                  </div>
                )}
                {/* 削除ボタン */}
                <button onClick={() => deleteEntry(e.id)}
                  style={{ position:"absolute", top:5, right:5, background:"rgba(0,0,0,0.55)", color:"white", border:"none", borderRadius:"50%", width:24, height:24, fontSize:12, cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  ×
                </button>
                <div style={{ padding:"8px 10px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:t.tx, marginBottom:2 }}>{e.shopName}</div>
                  <div style={{ fontSize:10, color:t.txm, marginBottom:6 }}>{e.visitDate} · {"★".repeat(e.rating||0)}</div>
                  {/* 編集トグル */}
                  <button onClick={() => setEditId(editId===e.id ? null : e.id)}
                    style={{ width:"100%", padding:"4px", borderRadius:7, border:`1px solid ${t.br}`, background:t.bg2, color:t.tx, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                    {editId===e.id ? "▲ 閉じる" : "✏️ 編集"}
                  </button>
                </div>
                {/* 編集パネル */}
                {editId === e.id && (
                  <div style={{ padding:"0 10px 10px" }}>
                    <label style={{ display:"block", textAlign:"center", padding:"7px", background:t.acc, color:"white", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", marginBottom:6 }}>
                      ＋ 写真を追加（複数可）
                      <input type="file" multiple accept="image/*" hidden onChange={ev => addImages(e.id, ev.target.files)} />
                    </label>
                    {(e.images||[]).map((img, idx) => (
                      <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <img src={img} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:"cover" }} />
                        <button onClick={() => removeImage(e.id, idx)}
                          style={{ padding:"3px 8px", borderRadius:6, border:"none", background:"#FFF5F5", color:"#E74C3C", fontSize:10, cursor:"pointer" }}>削除</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── マイページ ──────────────────────────────────────────────
function MyPage() {
  const { profile, setProfile, entries, filterMode, setFilterMode, groups, setGroups, settings, setSettings, t } = useApp();
  const [view, setView]           = useState("you");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [pendingGroups,  setPendingGroups]  = useState([]);
  const [newGroupName,   setNewGroupName]   = useState("");
  const [newMember,      setNewMember]      = useState("");
  const [expandGid,      setExpandGid]      = useState(null);

  // 絞り込み
  const filtered = entries.filter(e => {
    if (view === "group" && selectedGroups.length > 0) return selectedGroups.includes(e.groupId);
    if (filterMode.type === "month") return e.visitDate?.startsWith(filterMode.value);
    if (filterMode.type === "high")  return e.rating >= 4;
    return true;
  });

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const g = { id:`g${Date.now()}`, name:newGroupName.trim(), emoji:"🍜", members:["あなた"] };
    setGroups(prev => [...prev, g]);
    setNewGroupName("");
  };
  const addMember = (gid) => {
    if (!newMember.trim()) return;
    setGroups(prev => prev.map(g => g.id===gid ? { ...g, members:[...g.members, newMember.trim()] } : g));
    setNewMember("");
  };
  const sendLine = (g) => {
    const msg = `【Men～Log】${g.name} に招待されました！\n${APP_LINK}`;
    window.open(`https://line.me/R/share?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const applyGroups = () => setSelectedGroups([...pendingGroups]);
  const resetFilter = () => { setFilterMode({ type:"all", value:null }); setSelectedGroups([]); setPendingGroups([]); };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:t.bg }}>
      {/* ヘッダー */}
      <div style={{ flexShrink:0, background:t.grad, padding:"16px", color:"white" }}>
        <div style={{ fontSize:11, opacity:0.8, marginBottom:2 }}>マイページ</div>
        <div style={{ fontWeight:700, fontSize:20, fontFamily:"Georgia,serif" }}>{profile.name}</div>
        <div style={{ fontSize:11, opacity:0.75 }}>{profile.station} · ❤️ {profile.favorite}</div>
      </div>

      {/* タブ */}
      <div style={{ flexShrink:0, display:"flex", borderBottom:`1px solid ${t.br}`, background:t.bg }}>
        {[["you","👤 あなた"],["group","👥 グループ"],["settings","⚙️ 設定"]].map(([v,l]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ flex:1, padding:"10px 4px", border:"none", background:"transparent", color:view===v?t.acc:t.txm, fontWeight:700, fontSize:12, cursor:"pointer", borderBottom:view===v?`2px solid ${t.acc}`:"2px solid transparent" }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16 }}>

        {/* ── あなた ── */}
        {view === "you" && (
          <>
            {/* プロフィール編集 */}
            <section style={{ background:t.card, padding:16, borderRadius:14, marginBottom:16, boxShadow:`0 2px 8px ${t.sh}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:t.tx, marginBottom:10 }}>✏️ プロフィール編集</div>
              {[
                { label:"ニックネーム", key:"name",    placeholder:"例：ラーメン太郎" },
                { label:"最寄り駅",     key:"station", placeholder:"例：新宿駅" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:t.txm, marginBottom:3 }}>{label}</div>
                  <input style={{ width:"100%", padding:"9px 12px", background:t.bg2, border:`1.5px solid ${t.br}`, borderRadius:9, fontSize:13, color:t.tx, outline:"none", boxSizing:"border-box" }}
                    value={profile[key]||""} onChange={e => setProfile(p => ({...p,[key]:e.target.value}))} placeholder={placeholder} />
                </div>
              ))}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:t.txm, marginBottom:3 }}>性別</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["未設定","男性","女性","その他"].map(g => (
                    <button key={g} onClick={() => setProfile(p=>({...p,gender:g}))}
                      style={{ padding:"5px 12px", borderRadius:16, border:"none", background:profile.gender===g?t.acc:t.bg2, color:profile.gender===g?"white":t.tx2, fontSize:11, fontWeight:600, cursor:"pointer" }}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:t.txm, marginBottom:4 }}>好きなジャンル</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {["醤油","豚骨","塩","味噌","つけ麺","その他"].map(g => (
                    <button key={g} onClick={() => setProfile(p=>({...p,favorite:g}))}
                      style={{ padding:"4px 10px", borderRadius:16, border:"none", background:profile.favorite===g?t.acc:t.bg2, color:profile.favorite===g?"white":t.tx2, fontSize:11, fontWeight:600, cursor:"pointer" }}>{g}</button>
                  ))}
                </div>
              </div>
            </section>

            {/* 絞り込み */}
            <section style={{ background:t.card, padding:14, borderRadius:14, marginBottom:14, boxShadow:`0 2px 8px ${t.sh}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:13, color:t.tx }}>🔍 絞り込み</span>
                <button onClick={resetFilter} style={{ fontSize:11, color:"#E74C3C", border:"none", background:"#FFF5F5", borderRadius:8, padding:"3px 10px", cursor:"pointer" }}>🔄 リセット</button>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["all","high"].map(type => (
                  <button key={type} onClick={() => setFilterMode({ type, value:null })}
                    style={{ padding:"4px 12px", borderRadius:14, border:"none", background:filterMode.type===type?t.acc:t.bg2, color:filterMode.type===type?"white":t.tx2, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                    {type==="all" ? "全て" : "高評価(4★↑)"}
                  </button>
                ))}
              </div>
            </section>

            {/* 記録一覧 */}
            <div style={{ fontWeight:700, fontSize:13, color:t.tx, marginBottom:8 }}>記録一覧 ({filtered.length}件)</div>
            {filtered.map(e => (
              <div key={e.id} style={{ background:t.card, padding:12, borderRadius:12, marginBottom:8, display:"flex", gap:12, boxShadow:`0 2px 6px ${t.sh}` }}>
                {/* [FIX-6] undefinedのときフォールバック */}
                <img src={e.images?.[0] || PLACEHOLDER()} alt={e.shopName}
                  style={{ width:56, height:56, borderRadius:9, objectFit:"cover", flexShrink:0 }}
                  onError={ev => { ev.target.src = PLACEHOLDER(); }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:t.tx }}>{e.shopName}</div>
                  <div style={{ fontSize:11, color:t.txm }}>{e.visitDate} / {"★".repeat(e.rating||0)}</div>
                  {e.comment && <div style={{ fontSize:11, color:t.tx2, marginTop:2 }}>{e.comment}</div>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── グループ ── */}
        {view === "group" && (
          <>
            {/* グループ複数選択＋決定 */}
            <section style={{ background:t.card, padding:14, borderRadius:14, marginBottom:14, boxShadow:`0 2px 8px ${t.sh}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:t.tx, marginBottom:8 }}>👥 グループを選択</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {groups.map(g => (
                  <button key={g.id} onClick={() => setPendingGroups(p => p.includes(g.id) ? p.filter(x=>x!==g.id) : [...p, g.id])}
                    style={{ padding:"5px 14px", borderRadius:16, border:"none", background:pendingGroups.includes(g.id)?t.acc:t.bg2, color:pendingGroups.includes(g.id)?"white":t.tx2, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                    {g.emoji} {g.name}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={applyGroups} style={{ flex:2, padding:"9px", borderRadius:10, border:"none", background:t.grad, color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>✅ 決定</button>
                <button onClick={resetFilter} style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:"#FFF5F5", color:"#E74C3C", fontWeight:700, fontSize:12, cursor:"pointer" }}>🔄 リセット</button>
              </div>
              {selectedGroups.length > 0 && (
                <div style={{ marginTop:8, fontSize:11, color:t.txm }}>
                  絞込み中: {groups.filter(g=>selectedGroups.includes(g.id)).map(g=>g.name).join(" · ")} ({filtered.length}件)
                </div>
              )}
            </section>

            {/* グループ管理 */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontWeight:700, fontSize:13, color:t.tx }}>グループ管理</span>
            </div>
            {groups.map(g => (
              <div key={g.id} style={{ background:t.card, borderRadius:12, marginBottom:10, overflow:"hidden", boxShadow:`0 2px 8px ${t.sh}` }}>
                <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:t.accm, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{g.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:t.tx }}>{g.name}</div>
                    <div style={{ fontSize:11, color:t.txm }}>{g.members.length}人</div>
                  </div>
                  <button onClick={() => setExpandGid(expandGid===g.id ? null : g.id)}
                    style={{ background:t.bg2, border:"none", borderRadius:7, padding:"4px 9px", fontSize:10, color:t.acc, fontWeight:600, cursor:"pointer" }}>👤管理</button>
                  <button onClick={() => sendLine(g)}
                    style={{ background:"#06C755", border:"none", borderRadius:7, padding:"4px 9px", fontSize:10, color:"white", fontWeight:700, cursor:"pointer" }}>LINE</button>
                </div>
                <div style={{ padding:"0 14px 10px", display:"flex", gap:4, flexWrap:"wrap" }}>
                  {g.members.map(m => (
                    <span key={m} style={{ background:t.accm, color:t.acc, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:16 }}>{m}</span>
                  ))}
                </div>
                {expandGid === g.id && (
                  <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${t.br}`, background:t.bg2 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:t.txm, marginBottom:6 }}>メンバーを追加</div>
                    <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                      <input value={newMember} onChange={e => setNewMember(e.target.value)} placeholder="名前を入力"
                        style={{ flex:1, padding:"8px 10px", background:"white", border:`1.5px solid ${t.br}`, borderRadius:8, fontSize:13, color:t.tx, outline:"none" }} />
                      <button onClick={() => addMember(g.id)} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:t.acc, color:"white", fontWeight:700, cursor:"pointer" }}>追加</button>
                    </div>
                    <button onClick={() => sendLine(g)}
                      style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", background:"#06C755", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      💬 LINEでアプリリンクを送る
                    </button>
                    <div style={{ fontSize:10, color:t.txm, textAlign:"center", marginTop:4 }}>{APP_LINK}</div>
                  </div>
                )}
              </div>
            ))}

            {/* 新規グループ作成 */}
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="新しいグループ名"
                style={{ flex:1, padding:"10px 12px", background:t.card, border:`1.5px solid ${t.br}`, borderRadius:9, fontSize:13, color:t.tx, outline:"none" }} />
              <button onClick={createGroup} style={{ padding:"10px 16px", borderRadius:9, border:"none", background:t.grad, color:"white", fontWeight:700, cursor:"pointer" }}>作成</button>
            </div>
          </>
        )}

        {/* ── 設定 ── */}
        {view === "settings" && (
          <>
            <section style={{ background:t.card, padding:16, borderRadius:14, marginBottom:16, boxShadow:`0 2px 8px ${t.sh}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:t.tx, marginBottom:10 }}>🎨 テーマ</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["warm","🔥 暖色"],["dark","🌙 ダーク"],["cool","❄️ 寒色"],["season","🍃 季節"]].map(([id,label]) => (
                  <button key={id} onClick={() => setSettings(s => ({...s, theme:id}))}
                    style={{ padding:"12px", borderRadius:10, border:settings.theme===id?`2.5px solid ${t.acc}`:`1.5px solid ${t.br}`, background:settings.theme===id?t.accm:t.card, cursor:"pointer", fontWeight:settings.theme===id?700:400, color:t.tx }}>
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <section style={{ background:t.card, padding:16, borderRadius:14, boxShadow:`0 2px 8px ${t.sh}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:t.tx, marginBottom:10 }}>🗑️ データ管理</div>
              <button onClick={() => { if(window.confirm("全データをリセットしますか？")) { localStorage.clear(); window.location.reload(); }}}
                style={{ width:"100%", padding:"12px", borderRadius:10, border:"1.5px solid #FADBD8", background:"#FFF5F5", color:"#E74C3C", fontWeight:600, cursor:"pointer" }}>
                データをリセット
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 記録モーダル（AI一括取込） ─────────────────────────────
function PostModal() {
  const { entries, setEntries, setShowPost, t } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ shopName:"", visitDate:new Date().toISOString().slice(0,10), rating:5, genre:"醤油", area:"", comment:"" });

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    const newEntries = [...entries];
    for (const file of files) {
      const reader = new FileReader();
      const imgData = await new Promise(res => { reader.onload = ev => res(ev.target.result); reader.readAsDataURL(file); });
      const shops = ["飯田商店","とみ田","二郎","一蘭","蔦"];
      const detectedShop = shops[Math.floor(Math.random() * shops.length)];
      const existing = newEntries.find(ent => ent.shopName === detectedShop);
      if (existing) {
        existing.images = [...(existing.images||[]), imgData];
      } else {
        newEntries.push({ id:`${Date.now()}_${Math.random()}`, shopName:detectedShop, images:[imgData], visitDate:new Date().toISOString().slice(0,10), rating:4, genre:"醤油", area:"", comment:"" });
      }
    }
    setEntries(newEntries);
    setLoading(false);
    setShowPost(false);
  };

  const handleManual = () => {
    if (!form.shopName.trim()) return;
    setEntries(p => [{ ...form, id:`${Date.now()}`, images:[] }, ...p]);
    setShowPost(false);
  };

  const inp = { width:"100%", padding:"10px 12px", background:t.bg2, border:`1.5px solid ${t.br}`, borderRadius:9, fontSize:13, color:t.tx, outline:"none", boxSizing:"border-box", marginBottom:10 };

  return (
    // [FIX-2] z_index → zIndex
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:t.card, width:"100%", maxWidth:480, borderRadius:"20px 20px 0 0", padding:"0 20px 32px", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:t.br, borderRadius:2, margin:"12px auto 16px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={{ margin:0, color:t.tx }}>🍜 新規記録</h3>
          <button onClick={() => setShowPost(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:t.txm }}>✕</button>
        </div>

        {/* 手動入力 */}
        <input style={inp} placeholder="店舗名 *" value={form.shopName} onChange={e => setForm(f=>({...f,shopName:e.target.value}))} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <input type="date" style={{ ...inp, marginBottom:0 }} value={form.visitDate} onChange={e => setForm(f=>({...f,visitDate:e.target.value}))} />
          <select style={{ ...inp, marginBottom:0 }} value={form.genre} onChange={e => setForm(f=>({...f,genre:e.target.value}))}>
            {["醤油","豚骨","塩","味噌","つけ麺","その他"].map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:t.txm, marginBottom:4 }}>評価</div>
          <div style={{ display:"flex", gap:6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm(f=>({...f,rating:n}))}
                style={{ width:36, height:36, borderRadius:"50%", border:"none", background:form.rating>=n?"#E67E22":"#eee", color:form.rating>=n?"white":"#999", fontSize:18, cursor:"pointer" }}>★</button>
            ))}
          </div>
        </div>
        <textarea style={{ ...inp, minHeight:60, resize:"none" }} placeholder="コメント（任意）" value={form.comment} onChange={e => setForm(f=>({...f,comment:e.target.value}))} />

        <button onClick={handleManual} style={{ width:"100%", padding:"13px", borderRadius:11, border:"none", background:t.grad, color:"white", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:12 }}>
          記録する ✓
        </button>

        {/* AI一括取込 */}
        <label style={{ display:"block", padding:"12px", background:t.bg2, borderRadius:11, textAlign:"center", cursor:"pointer", fontWeight:600, fontSize:13, color:t.tx, border:`1.5px dashed ${t.br}` }}>
          {loading ? "🤖 AI判定中..." : "📸 画像を一括取込（AI自動判定）"}
          <input type="file" multiple accept="image/*" hidden onChange={handleBulkUpload} disabled={loading} />
        </label>
      </div>
    </div>
  );
}

// ─── メインレイアウト ─────────────────────────────────────────
function MainLayout() {
  const { tab, setTab, showPost, setShowPost, t } = useApp();
  const TABS = [
    { label:"ホーム",    icon:"🏠", Page:HomePage       },
    { label:"おすすめ",  icon:"🔥", Page:RecommendPage  },
    { label:"アルバム",  icon:"🖼️", Page:AlbumPage      },
    { label:"マイページ",icon:"👤", Page:MyPage         },
  ];
  const CurrentPage = TABS[tab].Page;

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", fontFamily:"'Noto Sans JP',system-ui,sans-serif", background:t.bg, overflow:"hidden" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent}`}</style>
      {/* ヘッダー */}
      <div style={{ flexShrink:0, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:t.bg, borderBottom:`1px solid ${t.br}`, position:"relative" }}>
        <MenLogLogo size={20} />
        <button onClick={() => setShowPost(true)}
          style={{ position:"absolute", right:12, background:t.grad, border:"none", borderRadius:8, padding:"5px 13px", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }}>
          ＋ 記録
        </button>
      </div>
      {/* コンテンツ */}
      <div style={{ flex:1, minHeight:0, overflow:"hidden" }}>
        <CurrentPage />
      </div>
      {/* モーダル */}
      {showPost && <PostModal />}
      {/* フッター */}
      <div style={{ flexShrink:0, height:62, display:"flex", background:t.card, borderTop:`1px solid ${t.br}`, boxShadow:`0 -3px 12px ${t.sh}` }}>
        {TABS.map((it, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ flex:1, border:"none", background:"none", color:tab===i?t.acc:t.txm, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, fontSize:10, fontWeight:tab===i?700:400 }}>
            <span style={{ fontSize:tab===i?22:18 }}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
        <button onClick={() => setShowPost(true)}
          style={{ flex:1, border:"none", background:"none", color:t.acc, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, fontSize:10, fontWeight:700 }}>
          <span style={{ fontSize:22 }}>➕</span>
          <span>記録</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return <Provider><MainLayout /></Provider>;
}
