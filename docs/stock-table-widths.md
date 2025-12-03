# 在庫管理テーブルの列幅指定メモ

在庫管理テーブル（種別／状況／メーカー／機種名／枠色／倉庫／購入金額／売却金額／外れ店／操作）の横幅を、想定文字数ベースで `ch` 単位に固定するためのサンプルです。`min-width` を指定しつつ、セルの内容が長い場合は可変で広がる前提のスタイルになっています。

## CSS クラス例
```css
/* テーブル自体にディスプレイ指定がある前提 (例: display: grid / table) */
.table-inventory .type { min-width: 3ch; }
.table-inventory .status { min-width: 3ch; }
.table-inventory .maker { min-width: 8ch; /* 想定8文字: メーカー名が長ければ自動で広がる */ }
.table-inventory .model { min-width: 12ch; flex: 1 1 auto; /* 機種名は可変幅 */ }
.table-inventory .panel { min-width: 5ch; }
.table-inventory .warehouse { min-width: 5ch; }
.table-inventory .buy-price { min-width: 6ch; text-align: right; }
.table-inventory .sell-price { min-width: 6ch; text-align: right; }
.table-inventory .store { min-width: 6ch; }
.table-inventory .action { min-width: 3ch; text-align: center; }
```

- 日本語が詰まりやすい場合は、それぞれ +0.5〜1ch で微調整して `min-width: 3.5ch;` のようにしてください。
- `maker` と `model` の想定文字数は明示されていないため、8ch/12ch を初期値にしています。必要に応じて調整してください。

## Tailwind ユーティリティ版
ヘッダーやセルそれぞれに、以下のユーティリティを付与してください。

- 種別: `min-w-[3ch]`
- 状況: `min-w-[3ch]`
- メーカー: `min-w-[8ch]`
- 機種名: `min-w-[12ch] flex-1`
- 枠色: `min-w-[5ch]`
- 倉庫: `min-w-[5ch]`
- 購入金額: `min-w-[6ch] text-right`
- 売却金額: `min-w-[6ch] text-right`
- 外れ店: `min-w-[6ch]`
- 操作: `min-w-[3ch] text-center`

### 微調整案
- 日本語の縦横比で窮屈に見える場合は、`min-w-[3.5ch]` など 0.5〜1ch 広げてください。
- 行内ボタンが並ぶ場合は「操作」列を `min-w-[4ch]` にすると余裕が出ます。

### 機種名を可変幅にする場合
- CSS: `.table-inventory .model { flex: 1 1 auto; min-width: 12ch; }`
- Tailwind: `class="flex-1 min-w-[12ch]"`

上記のように `flex` レイアウト下で `flex-grow: 1` を付けると、機種名列が余白を受け持ち、他の列は `ch` ベースの最小幅を維持します。
