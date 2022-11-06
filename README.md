# JWT for Google Apps Script

`JWT for Google Apps Script` は、TypeScript で作成された Google Apps Script 用の ライブラリです。

MIT ライセンスになります。

## 前提条件

このライブラリは、TypeScript で Google Apps Script の開発を行える [Clasp](https://github.com/google/clasp) で使用することを想定しています。

また、**Web アプリケーションで使用することを想定していません。**

理由は、Google Apps Script のプロジェクトはすべて同じドメインになり、ブラウザの Cookie や LocalStorage/SessionStorage では、トークンを安全に管理できないためです。

Windows や Mac、スマートフォンのアプリなどで使用することを想定しています。

## 主な機能

このライブラリは以下の機能があります。

- アクセストークン作成
- アクセストークン検証
- リフレッシュトークン作成
- リフレッシュトークン期限作成

## インストール方法

npm で以下のようにインストールします。

```sh
$ npm install jwt-for-google-apps-script
```

## 使用方法

### 初期化

最初に、JWT のインスタンスを取得します。

```typescript
const jwt = JwtFactory.crete();
```

### アクセストークンの作成

アクセストークンは、認証済みユーザーに発行するトークンです。

```typescript
// HMAC-SHA256 のシステムごとの秘密鍵を指定(32文字以上の文字列を推奨)
const privateKey = '<秘密鍵>';

// ヘッダークレームの作成
// HS256, JWT 固定(Google Apps Script の実装によっては将来的に拡張するかも)
const headerClaim = jwt.createHeaderClaim('HS256', 'JWT');
// { "alg": "HS256", "typ": "JWT" }

// ペイロードクレームの作成(パブリッククレーム)
//   引数
//     issuer(発行者): JWT の発行者を一意に識別する文字列または URI
//     subject(主題): 発行者内で一意。もしくはグローバルで一意の文字列または URI。
//     audience(受信者): ユーザー固有情報(ex. メールアドレス)
//     有効期間: 数値で分を指定
//   自動作成クレーム
//     exp: 有効期限
//     iat: 作成日時
const payloadClaim = jwt.createPayloadClaim('iss', 'sub', 'aud', 30);
// { "iss": "iss ", "sub": "sub", "aud": "aud", "exp": 1667727398, "iat": 1667725598}

// システム固有のクレーム(プライベートクレーム)は以下のように指定する(adminの部分)
// const payloadClaim = jwt.createPayloadClaim('iss', 'sub', 'aud', 30, { admin: true });
// { "iss": "iss ", "sub": "sub", "aud": "aud", "exp": 1667727398, "iat": 1667725598, "admin": true }

// アクセストークンの作成
const accessToken = jwt.createAccessToken(
  headerClaim,
  payloadClaim,
  privateKey
);
// ewoJImFsZyI6ICJIUzI1NiIsCgkidHlwIjogIkpXVCIKfQ.ewoJImlzcyI6ICJpc3MiLAoJInN1YiI6ICJzdWIiLAoJImF1ZCI6ICJhdWQiLAoJImV4cCI6IDE2Njc3MjczOTgsCgkiaWF0IjogMTY2NzcyNTU5OCwKCSJhZG1pbiI6IHRydWUKfQ.PIN-kk5pPW3tItrinJoNAeeyevZy1AqXnm3Y5XbW4_A
```

#### アクセストークンの検証

アクセストークンの検証は以下のように行います。

```typescript
try {
  jwt.validate(privateKey, 'HS256', accessToken);
} catch (e) {
  console.log(e.message);
}
```

デフォルトでは、`'iss', 'sub', 'aud', 'exp'` が必須クレームですが、変更することも可能です。

```typescript
const claims = ['iss', 'sub', 'aud', 'exp', 'admin'];
jwt.setRequiredPayloadClaims(claims);
```

#### リフレッシュトークンの作成

リフレッシュトークンは、アクセストークンが期限切れになった際に、再度アクセストークンを取得するために使用します。

一般的に、サーバー側でリフレッシュトークンと有効期限を管理し、クライアント側ではリフレッシュトークンのみを管理します。

```typescript
// ユーザー固有の値からリフレッシュトークンの作成する
const refreshToken = jwt.createRefreshToken('user@example.com');
// SGARqzDV4CU/9yKTt0q82Jnpvw3PyZXH+GmAArypkyuguJSliWCK7tw61tIHKViq2T/euRLUDMwXkUwQHiugFA==

// リフレッシュトークンの有効期限を日数を指定して作成
const expiryTimeStamp = jwt.createRefreshTokenExpiryTimeStamp(90);
// 1675501598

// リフレッシュトークンの有効期限を文字列に変換
const expiryTimeStampString = jwt.timeStampToDateTime(expiryTimeStamp);
// 2023-02-04 18:06:38
```

## 謝辞

このライブラリは、[jwt.io](https://jwt.io/)から配布された資料(要申請)やツールを元に作成しています。

特に、資料は有用で、JWT についてここまでまとまっている情報はなかったため、とても助かりました。
