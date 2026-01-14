# pdf-to-canva

ローカルPCで「文字選択できないPDF（スキャン/画像化スライド）」を、Canvaで編集可能なPPTXに変換するツールです。

- 各ページを背景画像として貼り付け
- OCRで抽出した文字をテキストボックスとして重ねる
- PPTXを書き出し

MVP優先のため、見た目の完全一致は保証しません（最終調整はCanvaで行ってください）。

## 仕組み

1. `pdftoppm` (poppler) でPDFをPNGに変換
2. `tesseract-ocr` でOCR（TSV出力）
3. 文字bboxを行単位でグルーピング
4. `PptxGenJS` でPPTXを生成

## セットアップ

### 1) Node.js

- Node.js 18+ をインストールしてください。

### 2) Tesseract (OCR)

#### Windows (例)

```powershell
choco install tesseract
# または
scoop install tesseract
```

#### macOS

```bash
brew install tesseract
```

#### Ubuntu/Debian

```bash
sudo apt-get install tesseract-ocr
```

日本語用の学習データが必要です。以下が入っているか確認してください。

- Windows: `C:\Program Files\Tesseract-OCR\tessdata\jpn.traineddata`
- macOS: `/opt/homebrew/share/tessdata/jpn.traineddata`
- Linux: `/usr/share/tesseract-ocr/4.00/tessdata/jpn.traineddata`

### 3) Poppler (pdftoppm)

#### Windows (例)

```powershell
choco install poppler
# または
scoop install poppler
```

#### macOS

```bash
brew install poppler
```

#### Ubuntu/Debian

```bash
sudo apt-get install poppler-utils
```

### 4) 依存ライブラリ

```bash
npm install
```

## 使い方

```bash
npm run build
node dist/index.js --input "slides.pdf" --out "output/output.pptx" --dpi 200 --lang jpn
```

### オプション

- `--dpi` (150/200/300) : 解像度。高いほど精度は上がるが処理が重くなります。
- `--lang` : `jpn`, `eng` など。デフォルト `jpn`。
- `--pages` : 例 `"1-3,7,10-12"`
- `--debug` : OCR結果TSV/JSON、bbox描画PNGを `output/debug` に保存

出力されるファイル:

- `output/output.pptx`
- `output/pages/page-001.png` など
- `output/debug/*.tsv`, `*.json`, `*.overlay.png` (debug時のみ)

## 制限事項 (MVP)

- 回転文字や縦書きは未対応
- 完全なレイアウト一致は保証しません
- `--pages` のページ指定が連続でない場合、内部的に全ページを画像化してから必要ページを抽出します

## トラブルシュート

### `tesseract` が見つからない

- `tesseract` がPATHにあるか確認してください。
- Windowsでは `C:\Program Files\Tesseract-OCR` をPATHに追加してください。

### `pdftoppm` が見つからない

- PopplerのインストールとPATH設定を確認してください。

### 文字化けする

- `--lang jpn` を指定
- `jpn.traineddata` が入っているか確認

## テスト

```bash
npm test
```
