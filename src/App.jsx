import { useState, useRef, useEffect, createContext, useContext, useCallback } from "react";

// ─── テーマ設定 ──────────────────────────────────────────────
const THEMES = {
  warm:   { bg:"#FFF8F3",bg2:"#FFF0E6",card:"#FFFFFF",acc:"#C0392B",accm:"#FADBD8",tx:"#1A0A00",tx2:"#6B4C3B",txm:"#A0826D",br:"#F0DDD5",star:"#E67E22",grad:\"linear-gradient(135deg,#C0392B,#E74C3C)\",sh:\"rgba(192,57,43,0.12)\" },
  dark:   { bg:\"#0F0A08\",bg2:\"#1A110D\",card:\"#231610\",acc:\"#E74C3C\",accm:\"#3D1A17\",tx:\"#F5EDE8\",tx2:\"#C4A99A\",txm:\"#7A5C4F\",br:\"#3D2418\",star:\"#F39C12\",grad:\"linear-gradient(135deg,#E74C3C,#FF6B6B)\",sh:\"rgba(231,76,60,0.2)\" },
  cool:   { bg:\"#F0F4FF\",bg2:\"#E8EEFF\",card:\"#FFFFFF\",acc:\"#3B5BDB\",accm:\"#DBE4FF\",tx:\"#0A0F2C\",tx2:\"#3B4A8A\",txm:\"#7C8DB0\",br:\"#D0D9F5\",star:\"#F59F00\",grad:\"linear-gradient(135deg,#3B5BDB,#4C6EF5)\",sh:\"rgba(59,91,219,0.12)\" },
  season: { bg:\"#F5FFF0\",bg2:\"#EAFAE0\",card:\"#FFFFFF\",acc:\"#2E7D32\",accm:\"#C8E6C9\",tx:\"#0A1F0C\",tx2:\"#2E5C30\",txm:\"#6A9B6D\",br:\"#D4EDD6\",star:\"#F57F17\",grad:\"linear-gradient(135deg,#2E7D32,#43A047)\",sh:\"rgba(46,125,50,0.12)\" },
};

const RAMENDB_BASE = "https://ramendb.supleks.jp";
const GENRES = ["すべて","醤油","豚骨","塩","味噌","つけ麺","鶏白湯","二郎系","中華そば","煮干し","その他"];
const AREAS  = ["すべて","新宿","渋谷","池袋","代々木","中野","三田","巣鴨","五反田","横浜","松戸","博多","札幌"];

// ─── コンテキスト ──────────────────────────────────────────
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function Provider({ children }) {
  const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  
  const [entries, setEntries] = useState(() => load("rd_entries", []));
  const [groups, setGroups] = useState(() => load("rd_groups", [{ id: "g1", name: "ラーメン部", members: ["あなた", "田中"] }]));
  const [profile, setProfile] = useState(() => load("rd_profile", { name: "ユーザー", gender: "未設定", station: "未設定", favorite: "醤油" }));
  const [settings, setSettings] = useState(() => load("rd_settings", { theme: "warm" }));
  const [tab, setTab] = useState(0);
  const [showPost, setShowPost] = useState(false);
  const [filterMode, setFilterMode] = useState({ type: 'all', value: null });

  useEffect(() => { localStorage.setItem("rd_entries", JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem("rd_profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem("rd_settings", JSON.stringify(settings)); }, [settings]);

  const t = THEMES[settings.theme] || THEMES.warm;

  return (
    <Ctx.Provider value={{ entries, setEntries, groups, setGroups, profile, setProfile, settings, setSettings, tab, setTab, showPost, setShowPost, filterMode, setFilterMode, t }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── ホーム ─────────────────────────────────────────────────
function HomePage() {
  const { entries, profile, setTab, setFilterMode, t } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const months = Array.from(new Set(entries.map(e => e.visitDate?.slice(0, 7)))).sort().reverse();
  if (!months.includes(new Date().toISOString().slice(0, 7))) months.unshift(new Date().toISOString().slice(0, 7));

  const stats = {
    total: entries.length,
    month: entries.filter(e => e.visitDate?.startsWith(selectedMonth)).length,
    avg: entries.length ? (entries.reduce((a, b) => a + b.rating, 0) / entries.length).toFixed(1) : "0.0"
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: t.bg }}>
      <div style={{ background: t.grad, padding: "40px 20px 20px", color: "white" }}>
        <h2 style={{ fontSize: 24 }}>{profile.name}さんのMen～Log</h2>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <div onClick={() => { setFilterMode({ type: 'all' }); setTab(3); }} style={{ flex: 1, background: "rgba(255,255,255,0.2)", padding: 15, borderRadius: 15, textAlign: "center" }}>
            <div style={{ fontSize: 11 }}>訪問件数</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{stats.total}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", padding: 15, borderRadius: 15, textAlign: "center" }}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ background: "none", border: "none", color: "white", fontSize: 11, outline: "none", cursor: "pointer" }}>
              {months.map(m => <option key={m} value={m} style={{ color: "black" }}>{m}</option>)}
            </select>
            <div onClick={() => { setFilterMode({ type: 'month', value: selectedMonth }); setTab(3); }} style={{ fontSize: 22, fontWeight: 900, cursor: "pointer" }}>{stats.month}</div>
          </div>
          <div onClick={() => { setFilterMode({ type: 'high' }); setTab(3); }} style={{ flex: 1, background: "rgba(255,255,255,0.2)", padding: 15, borderRadius: 15, textAlign: "center" }}>
            <div style={{ fontSize: 11 }}>平均</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{stats.avg}★</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ background: t.card, padding: 15, borderRadius: 15, boxShadow: `0 4px 12px ${t.sh}` }}>
          <h4 style={{ color: t.tx2, marginBottom: 5 }}>プロフィール</h4>
          <p style={{ fontSize: 14 }}>最寄り駅: {profile.station} / 好きなジャンル: {profile.favorite}</p>
        </div>
      </div>
    </div>
  );
}

// ─── おすすめ ───────────────────────────────────────────────
function RecommendPage() {
  const { t } = useApp();
  const shops = [
    { name: "らぁ麺 飯田商店", score: 98.5, genre: "醤油", area: "湯河原", id: "119107" },
    { name: "中華そば とみ田", score: 97.2, genre: "つけ麺", area: "松戸", id: "3051" },
  ];

  return (
    <div style={{ padding: 20, background: t.bg, height: "100%", overflowY: "auto" }}>
      <h3 style={{ marginBottom: 15 }}>ラーメンデータベース ランキング</h3>
      {shops.map((shop, i) => (
        <div key={i} style={{ background: t.card, padding: 15, borderRadius: 15, marginBottom: 12, boxShadow: `0 2px 8px ${t.sh}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700 }}>{shop.name}</span>
            <span style={{ color: t.star, fontWeight: 900 }}>{shop.score} pt</span>
          </div>
          <p style={{ fontSize: 12, color: t.txm }}>{shop.area} / {shop.genre}</p>
          <a href={`${RAMENDB_BASE}/s/${shop.id}.html`} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10, textAlign: "center", padding: 8, background: t.bg2, borderRadius: 10, fontSize: 12, color: t.tx, textDecoration: "none" }}>店舗詳細を見る</a>
        </div>
      ))}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button style={{ padding: "10px 20px", borderRadius: 20, border: `1px solid ${t.br}`, background: t.card }}>その他カテゴリを表示</button>
      </div>
    </div>
  );
}

// ─── アルバム ───────────────────────────────────────────────
function AlbumPage() {
  const { entries, setEntries, t } = useApp();
  
  const deleteEntry = (id) => {
    if(window.confirm("この記録を削除しますか？")) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  return (
    <div style={{ padding: 20, background: t.bg, height: "100%", overflowY: "auto" }}>
      <h3>アルバム</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 15 }}>
        {entries.map(e => (
          <div key={e.id} style={{ background: t.card, borderRadius: 12, overflow: "hidden", position: "relative" }}>
            <img src={e.images?.[0] || "https://via.placeholder.com/150"} style={{ width: "100%", height: 120, objectFit: "cover" }} />
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{e.shopName}</div>
              <div style={{ fontSize: 10, color: t.txm }}>{e.visitDate}</div>
              <button onClick={() => deleteEntry(e.id)} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 24, height: 24, fontSize: 12 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── マイページ ─────────────────────────────────────────────
function MyPage() {
  const { profile, setProfile, entries, filterMode, setFilterMode, groups, t } = useApp();
  const [view, setView] = useState('you');
  const [selectedGroups, setSelectedGroups] = useState([]);

  const filtered = entries.filter(e => {
    if (view === 'group' && selectedGroups.length > 0) return selectedGroups.includes(e.groupId);
    if (filterMode.type === 'month') return e.visitDate?.startsWith(filterMode.value);
    if (filterMode.type === 'high') return e.rating >= 4;
    return true;
  });

  return (
    <div style={{ padding: 20, background: t.bg, height: "100%", overflowY: "auto" }}>
      <section style={{ background: t.card, padding: 20, borderRadius: 20, marginBottom: 20 }}>
        <h3>プロフィール設定</h3>
        <input style={{ width: "100%", padding: 10, marginTop: 10 }} value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="ニックネーム" />
        <input style={{ width: "100%", padding: 10, marginTop: 10 }} value={profile.station} onChange={e => setProfile({...profile, station: e.target.value})} placeholder="最寄り駅" />
        <select style={{ width: "100%", padding: 10, marginTop: 10 }} value={profile.favorite} onChange={e => setProfile({...profile, favorite: e.target.value})}>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </section>

      <section>
        <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
          <button onClick={() => setView('you')} style={{ flex: 1, padding: 10, borderRadius: 10, background: view==='you'?t.acc:t.card, color: view==='you'?"white":t.tx, border: "none" }}>あなた</button>
          <button onClick={() => setView('group')} style={{ flex: 1, padding: 10, borderRadius: 10, background: view==='group'?t.acc:t.card, color: view==='group'?"white":t.tx, border: "none" }}>グループ</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h4>記録一覧 ({filtered.length}件)</h4>
          <button onClick={() => setFilterMode({type:'all'})} style={{ fontSize: 12, color: t.acc, border: "none", background: "none" }}>リセット</button>
        </div>

        {filtered.map(e => (
          <div key={e.id} style={{ background: t.card, padding: 15, borderRadius: 15, marginBottom: 10, display: "flex", gap: 15 }}>
            <img src={e.images?.[0]} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover" }} />
            <div>
              <div style={{ fontWeight: 700 }}>{e.shopName}</div>
              <div style={{ fontSize: 12, color: t.txm }}>{e.visitDate} / {e.rating}★</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── 記録モーダル（AI一括取込） ─────────────────────────────
function PostModal() {
  const { entries, setEntries, setShowPost, t } = useApp();
  const [loading, setLoading] = useState(false);

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    const newEntries = [...entries];
    for (const file of files) {
      const reader = new FileReader();
      const imgData = await new Promise(res => { reader.onload = e => res(e.target.result); reader.readAsDataURL(file); });
      
      // AIシミュレーション判定
      const detectedShop = ["飯田商店", "とみ田", "二郎", "一蘭"][Math.floor(Math.random() * 4)];
      const existing = newEntries.find(ent => ent.shopName === detectedShop);

      if (existing) {
        existing.images = [...(existing.images || []), imgData];
      } else {
        newEntries.push({ id: Date.now()+Math.random(), shopName: detectedShop, images: [imgData], visitDate: new Date().toISOString().split('T')[0], rating: 4 });
      }
    }
    setEntries(newEntries);
    setLoading(false);
    setShowPost(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", z_index: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: t.card, width: "100%", maxWidth: 400, borderRadius: 25, padding: 30, textAlign: "center" }}>
        <h3>新規記録</h3>
        <label style={{ display: "block", background: t.grad, color: "white", padding: 15, borderRadius: 15, marginTop: 20, cursor: "pointer", fontWeight: 700 }}>
          {loading ? "AI判定中..." : "📸 画像を一括取込"}
          <input type="file" multiple accept="image/*" hidden onChange={handleBulkUpload} disabled={loading} />
        </label>
        <button onClick={() => setShowPost(false)} style={{ marginTop: 20, border: "none", background: "none", color: t.txm }}>キャンセル</button>
      </div>
    </div>
  );
}

// ─── メインレイアウト ──────────────────────────────────────────
export default function App() {
  return <Provider><MainLayout /></Provider>;
}

function MainLayout() {
  const { tab, setTab, showPost, setShowPost, t } = useApp();
  const TABS = [
    { label: "ホーム", icon: "🏠", Page: HomePage },
    { label: "おすすめ", icon: "🔥", Page: RecommendPage },
    { label: "アルバム", icon: "🖼️", Page: AlbumPage },
    { label: "マイページ", icon: "👤", Page: MyPage },
  ];
  const CurrentPage = TABS[tab].Page;

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      <div style={{ flex: 1, overflow: "hidden" }}><CurrentPage /></div>
      {showPost && <PostModal />}
      <div style={{ height: 70, display: "flex", background: t.card, borderTop: `1px solid ${t.br}`, paddingBottom: 10 }}>
        {TABS.map((it, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ flex: 1, border: "none", background: "none", color: tab===i?t.acc:t.txm }}>
            <div style={{ fontSize: 20 }}>{it.icon}</div>
            <div style={{ fontSize: 10 }}>{it.label}</div>
          </button>
        ))}
        <button onClick={() => setShowPost(true)} style={{ flex: 1, border: "none", background: "none", color: t.acc }}>
          <div style={{ fontSize: 20 }}>➕</div>
          <div style={{ fontSize: 10 }}>記録</div>
        </button>
      </div>
    </div>
  );
}
