/* eslint-disable no-undef */
import { GasUtilities } from './utility/GasUtilities';
import { Message } from './constant/Message';

/** JWT クラス */
export class Jwt {
  private gasUtilities: GasUtilities;
  private algorithms = ['HS256']; // サポートは HS256 のみ。拡張のため配列にしている。
  private requiredPayloadClaims = ['iss', 'sub', 'aud', 'exp']; // default

  /**
   * Jwtのコンストラクタ
   *
   * @param gasUtilities GasUtilities
   */
  constructor(gasUtilities: GasUtilities) {
    this.gasUtilities = gasUtilities;
  }

  /**
   * アクセストークンを作成する
   *
   * @param headerClaim ヘッダークレーム
   * @param payloadClaim ペイロードクレーム
   * @param privateKey 秘密鍵
   * @returns アクセストークン
   */
  public createAccessToken(
    headerClaim: any,
    payloadClaim: any,
    privateKey: string
  ): string {
    if (!headerClaim.alg) {
      throw new Error(Message.REQUIRED_ALGORITHM_ERROR);
    }

    const encodedHeader = this.gasUtilities.base64EncodeWebSafe(
      JSON.stringify(headerClaim, null, '\t')
    );
    const encodedPayload = this.gasUtilities.base64EncodeWebSafe(
      JSON.stringify(payloadClaim, null, '\t')
    );
    const signature = this.sign(
      encodedHeader + '.' + encodedPayload,
      privateKey,
      headerClaim.alg
    );

    return encodedHeader + '.' + encodedPayload + '.' + signature;
  }

  /**
   * ヘッダークレームを作成する
   *
   * @param algorithm 署名アルゴリズム
   * @param jwtType JWTのメディアタイプ
   * @returns ヘッダークレーム
   */
  public createHeaderClaim(algorithm: string, jwtType: string = 'UNKOWN'): any {
    if (jwtType === 'UNKOWN') {
      return { alg: algorithm };
    }

    return { alg: algorithm, typ: jwtType };
  }

  /**
   * ペイロードクレームを作成する(exp,iatは自動で追加)
   *
   * @param iss issuer(発行者)
   * @param sub subject(主題)
   * @param aud audience(受信者)
   * @param expireMinuts 有効期間(分)
   * @param privateClaim プライベートクレーム(オプション)
   */
  public createPayloadClaim(
    iss: string,
    sub: string,
    aud: string,
    expireMinuts: number,
    privateClaim: any = null
  ): any {
    const now = Date.now();
    const expires = new Date(now);
    expires.setMinutes(expires.getMinutes() + expireMinuts);

    const exp = Math.round(expires.getTime() / 1000);
    const iat = Math.round(now / 1000);

    const payload: any = { iss, sub, aud, exp, iat };

    if (privateClaim) {
      Object.keys(privateClaim).forEach(function (key) {
        payload[key] = privateClaim[key];
      });
    }

    return payload;
  }

  /**
   * 署名を作成する
   *
   * @param target 対象文字列
   * @param privateKey 秘密鍵
   * @param algorithm 署名アルゴリズム
   * @returns 署名
   */
  public sign(target: string, privateKey: string, algorithm: string): string {
    if (algorithm === 'HS256') {
      const signature = this.gasUtilities.computeHmacSha256Signature(
        target,
        privateKey
      );

      return this.gasUtilities.base64EncodeWebSafe(signature);
    }

    throw new Error(Message.NO_SUPPORT_ALGORITHM_ERROR);
  }

  /**
   * アクセストークンの検証を行う
   *
   * @param privateKey 秘密鍵
   * @param algorithm 署名アルゴリズム
   * @param accessToken アクセストークン
   */
  public validate(
    privateKey: string,
    algorithm: string,
    accessToken: string | undefined | null
  ): void {
    if (!accessToken) {
      throw new Error(Message.ACCESS_TOKEN_ERROR);
    }

    if (accessToken.split('.').length !== 3) {
      throw new Error(Message.ACCESS_TOKEN_ERROR);
    }

    const [header, payload, signature] = accessToken.split('.');
    const target = header + '.' + payload;

    const validSignature = this.sign(target, privateKey, algorithm);

    // 署名検証
    if (signature !== validSignature) {
      throw new Error(Message.ACCESS_TOKEN_ERROR);
    }

    // ヘッダークレーム検証
    const decodedHeader =
      this.gasUtilities.base64DecodeWebSafeAndToObject(header);
    this.validateHeaderClaim(decodedHeader);

    // ペイロードクレーム検証
    const decodedPayload =
      this.gasUtilities.base64DecodeWebSafeAndToObject(payload);
    this.validatePayloadClaim(decodedPayload);
  }

  /**
   * Base64 Web Safe でデコードしてオブジェクトを生成する
   *
   * @param data 対象データ
   * @returns オブジェクト
   */
  public decode(data: string): any {
    return this.gasUtilities.base64DecodeWebSafeAndToObject(data);
  }

  /**
   * リフレッシュトークンを作成する
   *
   * @param userSpecificValue ユーザー固有の値
   */
  public createRefreshToken(userSpecificValue: string): string {
    const rand = Math.random();
    const target = userSpecificValue + String(rand);
    const hash = this.gasUtilities.sha512(target);
    return this.gasUtilities.base64Encode(hash);
  }

  /**
   * リフレッシュトークンの有効期限のタイムスタンプを作成する
   *
   * @param effectiveDays 有効日数
   */
  public createRefreshTokenExpiryTimeStamp(effectiveDays: number): number {
    const date = new Date();
    date.setDate(date.getDate() + effectiveDays);

    return Math.round(date.getTime() / 1000);
  }

  /**
   * タイムスタンプを日付形式に変換する
   *
   * @param timeStamp タイムスタンプ
   * @returns 日付形式(yyyy-MM-dd HH:mm:ss)
   */
  public timeStampToDateTime(timeStamp: number): string {
    const date = new Date(timeStamp * 1000);
    return (
      date.getFullYear() +
      '-' +
      this.paddingZero(date.getMonth() + 1, 2) +
      '-' +
      this.paddingZero(date.getDate(), 2) +
      ' ' +
      this.paddingZero(date.getHours(), 2) +
      ':' +
      this.paddingZero(date.getMinutes(), 2) +
      ':' +
      this.paddingZero(date.getSeconds(), 2)
    );
  }

  /**
   * 必須ペイロードクレームを設定する
   *
   * @param requiredPayloadClaims 必須ペイロードクレームの配列
   */
  public setRequiredPayloadClaims(requiredPayloadClaims: string[]): void {
    this.requiredPayloadClaims = requiredPayloadClaims;
  }

  /**
   * 必須ペイロードクレームを設取得する
   */
  public getRequiredPayloadClaims(): string[] {
    return this.requiredPayloadClaims;
  }

  /**
   * 数値に前ゼロを付与する
   *
   * @param num 数値
   * @param paddingLength 前ゼロ桁数
   * @returns 前ゼロ付き数値(文字列)
   */
  private paddingZero(num: number, paddingLength: number): string {
    return ('0'.repeat(paddingLength) + num.toString()).slice(
      paddingLength * -1
    );
  }

  /**
   * ヘッダークレーム検証を行う
   *
   * @param headerClaim ヘッダークレーム
   */
  private validateHeaderClaim(headerClaim: any): void {
    if (!headerClaim.alg) {
      throw new Error(Message.ACCESS_TOKEN_ERROR);
    }

    // アルゴリズム検証
    const filtereAalgorithms = this.algorithms.filter(
      (algorithm) => algorithm === headerClaim.alg
    );

    if (filtereAalgorithms.length === 0) {
      throw new Error(Message.ACCESS_TOKEN_ERROR);
    }
  }

  /**
   * ペイロードクレーム検証を行う
   *
   * @param payloadClaim ペイロードクレーム
   */
  private validatePayloadClaim(payloadClaim: any): void {
    // 必須ペイロードクレームチェック
    this.requiredPayloadClaims.forEach((claim) => {
      if (!payloadClaim[claim]) {
        throw new Error(Message.ACCESS_TOKEN_ERROR);
      }
    });

    // 有効期限チェック
    const now = Date.now() / 1000;
    const exp = Number(payloadClaim.exp);
    if (exp < now) {
      throw new Error(Message.ACCESS_TOKEN_ERROR);
    }
  }
}
