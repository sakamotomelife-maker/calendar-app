# 年末年始につくったcalendar-app
![画面例](docs/screenshot2.png)

## 概要
Javascript初心者がCopilotをフル活用してつくったReact+Vercel+Supabaseのフルスタックアプリです。
時間帯指定などをせず、手帳に手書きをするような、手間がないシンプルなカレンダーアプリです。

## 主な機能
- 早出、遅出、公休のシンプルな構成で、その下にメモを残す仕様
  ![画面例](docs/screenshot3.png)
- 設定から時間シフト制（例：10-17）などの登録も可能
    ![画面例](docs/screenshot3.png)
- 祝日は自動で取得し、祝日名も表示

## 技術ポイント
- Reactによる軽快な操作性の実現
- Supabase+vercelの活用によってデータベースを保存
- ログイン画面の実装によって個人別の予定を表示
    ![画面例](docs/screenshot1.png)

## 今後のアップデート
- アレクサ連携で予定の通知
- LINEで予定の通知
