/* eslint-disable no-undef */
import { Algorithm } from './constant/Algorithm';
import { GasUtilities } from './utility/GasUtilities';
import { JwtType } from './constant/JwtType';
import { Message } from './constant/Message';
import { PayloadClaim } from './constant/PayloadClaim';

/** JWT ライブラリ */
export class Jwt {
  private gasUtilities: GasUtilities;
  private algorithms: Algorithm[];
  private requiredPayloadClaims: PayloadClaim[];

  /**
   * Jwtのコンストラクタ
   *
   * @param gasUtilities GasUtilities
   * @param algorithms 署名アルゴリズム配列
   * @param requiredPayloadClaims 必須ペイロードクレーム配列
   */
  constructor(
    gasUtilities: GasUtilities,
    algorithms: Algorithm[],
    requiredPayloadClaims: PayloadClaim[]
  ) {
    this.gasUtilities = gasUtilities;
    this.algorithms = algorithms;
    this.requiredPayloadClaims = requiredPayloadClaims;
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
      throw new Error('署名アルゴリズムは必須です');
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
  public createHeaderClaim(
    algorithm: Algorithm,
    jwtType: JwtType = JwtType.UNKOWN
  ): any {
    if (jwtType === JwtType.UNKOWN) {
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
    if (algorithm === Algorithm.HS256) {
      const signature = this.gasUtilities.computeHmacSha256Signature(
        target,
        privateKey
      );

      return this.gasUtilities.base64EncodeWebSafe(signature);
    }

    throw new Error('サポート外のアルゴリズムです');
  }

  /**
   * アクセストークン検証を行う
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
   * Base64 Web Safe でデコードしてオブジェクトを生成する(個別クレーム検証用)
   *
   * @param data 対象データ
   * @returns オブジェクト
   */
  public decode(data: string): string {
    return this.gasUtilities.base64DecodeWebSafeAndToObject(data);
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
