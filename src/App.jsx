// ─── 既存のコードに追加・修正 ──────────────────────────────────────────

function PostModal() {
  const { entries, setEntries, setShowPost, t } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  // AI店舗認識の擬似ロジック (将来的に外部APIと連携可能)
  const recognizeShopFromImage = async (file) => {
    // 本来はここでAI APIに画像を投げますが、今回はシミュレーション
    // ファイル名やランダムなデータで「認識した」という挙動を作ります
    return new Promise((resolve) => {
      setTimeout(() => {
        // デモ用：ファイル名に「二郎」が入っていたら店舗名を推測する等の例
        const mockShops = ["らぁ麺 飯田商店", "とみ田", "ラーメン二郎", "一蘭"];
        const detectedName = mockShops[Math.floor(Math.random() * mockShops.length)];
        resolve({
          shopName: detectedName,
          genre: "醤油",
          rating: 4
        });
      }, 1500);
    });
  };

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newEntries = [...entries];

    for (const file of files) {
      // 1. 画像をデータURLに変換
      const reader = new FileReader();
      const imageUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      // 2. AIで店舗を認識（シミュレーション）
      const aiResult = await recognizeShopFromImage(file);

      // 3. 既存の店舗があるかチェック
      const existingIndex = newEntries.findIndex(e => e.shopName === aiResult.shopName);

      if (existingIndex !== -1) {
        // 既存店なら画像配列に追加
        const updatedEntry = { ...newEntries[existingIndex] };
        updatedEntry.images = [...(updatedEntry.images || []), imageUrl];
        newEntries[existingIndex] = updatedEntry;
      } else {
        // 新規店なら新しく追加
        newEntries.push({
          id: Date.now() + Math.random(),
          shopName: aiResult.shopName,
          genre: aiResult.genre,
          rating: aiResult.rating,
          images: [imageUrl],
          comment: "AIにより自動登録されました",
          visitDate: new Date().toISOString().split('T')[0]
        });
      }
    }

    setEntries(newEntries);
    setIsProcessing(false);
    alert(`${files.length}枚の画像を取り込み、店舗を自動判別しました！`);
    setShowPost(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, padding:20, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:t.card, width:"100%", maxWidth:400, borderRadius:20, padding:25, maxHeight:"90vh", overflowY:"auto" }}>
        <h2 style={{ marginBottom:20, textAlign:"center" }}>ラーメン記録</h2>

        {/* 【新設】画像一括取込セクション */}
        <div style={{ marginBottom:25, padding:15, border:`2px dashed ${t.br}`, borderRadius:15, textAlign:"center" }}>
          <p style={{ fontSize:13, color:t.tx2, marginBottom:10 }}>AIが店舗を自動判別します</p>
          <label style={{ 
            background: t.acc, color:"white", padding:"10px 20px", borderRadius:25, cursor:"pointer", display:"inline-block", fontWeight:700 
          }}>
            {isProcessing ? "判別中..." : "📸 画像を一括取込"}
            <input type="file" multiple accept="image/*" onChange={handleBulkUpload} hidden disabled={isProcessing} />
          </label>
        </div>

        <div style={{ borderTop:`1px solid ${t.br}`, paddingTop:20 }}>
          <p style={{ textAlign:"center", fontSize:12, color:t.txm }}>または手動で入力</p>
          {/* 従来の手動入力フォームが続く... */}
        </div>

        <button onClick={() => setShowPost(false)} style={{ marginTop:20, width:"100%", padding:10, background:"none", border:"none", color:t.txm }}>キャンセル</button>
      </div>
    </div>
  );
}
