# JWT for Google Apps Script

`JWT for Google Apps Script` は、TypeScript で作成された Google Apps Script 用の ライブラリです。

`MIT ライセンス` になります。

## 前提条件

このライブラリは、`TypeScript` で `Google Apps Script` のアプリケーション開発を行うための、
[Clasp](https://github.com/google/clasp) のプロジェクトで使用することを想定しています。

また、**Web アプリケーションで使用することを想定していません。**

理由は、Google Apps Script のプロジェクトはすべて同じドメインになり、ブラウザの Cookie や LocalStorage/SessionStorage では、トークンを安全に管理できないためです。

そのため、Windows や Mac、スマートフォンのアプリで使用することを想定しています。

## 主な機能

このライブラリは以下の機能があります。

- アクセストークン作成
- アクセストークン検証
- リフレッシュトークン作成
- クレームデコード機能

### アクセストークン作成

アクセストークンを作成します。

サポートしているアルゴリズムは、`HS256(HMAC-SHA256)` のみです。

ヘッダークレームとペイロードクレームを作成後、署名を付与したアクセストークンを作成できます。

ペイロードクレームには、システム固有のプライベートクレームを付与することが可能です。

また、ペイロード作成時に、`iat(issued at, 発行日時)` と `exp(expiration, 有効期限)` が自動で付与されます。

### アクセストークン検証

アクセストークンの検証内容は、以下の通りです。

- ヘッダークレーム
  - アルゴリズムが正しいか
- ペイロードクレーム
  - 署名を検証
  - 改ざんされてないか検証
  - exp(expiration, 有効期限) が有効期限内か検証
  - 必須クレームが存在しているか検証
    - 必須クレームは設定可能

### リフレッシュトークン作成

リフレッシュトークンは、アクセストークンの期限が切れた際にアクセストークンを再取得するために使用します。

このリフレッシュトークンと有効期限を作成することができます。

なお、一般的に、リフレッシュトークンと有効期限はサーバー側で保持します。

### クレームデコード機能

ヘッダークレームやペイロードクレームの中身を、システムで検証する場合に使用します。

クレームデコード機能により、ヘッダークレームやペイロードクレームを JavaScript の
オブジェクトに変換して中身を検証することができます。

## インストール方法

npm でインストールします。

```sh
$ npm install jwt-for-google-apps-script
```

## 使用方法

### 初期化

最初に、Jwt のインスタンスを取得します。

```typescript
const jwt = JwtFactory.crete();
```

### アクセストークンの作成

アクセストークンは、認証済みユーザーに発行するトークンです。

```typescript
// HMAC-SHA256 のシステムごとの秘密鍵を指定(32文字以上の文字列を推奨)
const privateKey = '<秘密鍵>';

// ヘッダークレームの作成
const headerClaim = jwt.createHeaderClaim('HS256', 'JWT');
// { "alg": "HS256", "typ": "JWT" }

// ペイロードクレームの作成(パブリッククレーム)
//   引数
//     issuer(発行者): JWT の発行者を一意に識別する文字列または URI
//     subject(主題): 発行者内で一意。もしくはグローバルで一意の文字列または URI。
//     audience(受信者): ユーザー固有情報(ex. メールアドレス)
//     有効期限: 数値で「分」を指定
//   自動作成クレーム
//     exp: 有効期限
//     iat: 作成日時
const payloadClaim = jwt.createPayloadClaim('iss', 'sub', 'aud', 30);
// { "iss": "iss ", "sub": "sub", "aud": "aud", "exp": 1667727398, "iat": 1667725598}

// システム固有のクレーム(プライベートクレーム)は以下のように指定する(adminの部分)
// const payloadClaim = jwt.createPayloadClaim('iss', 'sub', 'aud', 30, { admin: true });

// アクセストークンの作成
const accessToken = jwt.createAccessToken(
  headerClaim,
  payloadClaim,
  privateKey
);
// {
//   accessToken: "${Base64 Web Safeでエンコードした headerClaim}.${Base64 Web Safeでエンコードした payloadClaim}.${署名}",
//   expires: 1516239022
// }

// アクセストークンの取得
console.log(accessToken.accessToken); // アクセストークン
console.log(accessToken.expires); // アクセストークン有効期限 ex. 1516239022
```

#### アクセストークンの検証

アクセストークンの検証は以下のように行います。

```typescript
try {
  jwt.validate(privateKey, 'HS256', accessToken);
} catch (e) {
  if (e.message === 'JWTアクセストークンの期限が切れています') {
    console.log('アクセストークン期限切れ');
  } else {
    console.log(e.message); // JWTアクセストークンが不正です
  }
}
```

デフォルトでは、`'iss', 'sub', 'aud', 'exp'` が必須クレームですが、システム要件に応じて変更することが可能です。

```typescript
const claims = ['iss', 'sub', 'aud', 'exp', 'admin'];
jwt.setRequiredPayloadClaims(claims);
```

#### リフレッシュトークンの作成

リフレッシュトークンは、アクセストークンが期限切れになった際に、再度アクセストークンを取得するために使用します。

リフレッシュトークンは以下のように作成します。

```typescript
// ユーザー固有の値からリフレッシュトークンを作成する(引数と乱数を使用)
const refreshToken = jwt.createRefreshToken('user@example.com');
// SGARqzDV4CU/9yKTt0q82Jnpvw3PyZXH+GmAArypkyuguJSliWCK7tw61tIHKViq2T/euRLUDMwXkUwQHiugFA==

// リフレッシュトークンの有効期限を「日数」を指定して作成
const expiryTimeStamp = jwt.createRefreshTokenExpiryTimeStamp(90);
// 1675501598

// リフレッシュトークンの有効期限を文字列に変換
const expiryTimeStampString = jwt.timeStampToDateTime(expiryTimeStamp);
// 2023-02-04 18:06:38
```

### クレームデコード機能

ヘッダークレームやペイロードクレームをデコードして JavaScript のオブジェクトに変換し、中身を検証できるようにします。

```typescript
const headerClaim = 'ewoJImFsZyI6ICJIUzI1NiIsCgkidHlwIjogIkpXVCIKfQ';
const decodedHeaderClaim = jwt.decode(headerClaim);
// {
//   alg: "HS256",
//   typ: "JWT"
// }
```

## 謝辞

このライブラリは、[jwt.io](https://jwt.io/) から頂いた資料(要申請)やツールを元に作成しています。

特に、資料は有用で、JWT についてここまでまとまっている情報はなかったため、とても助かりました。
