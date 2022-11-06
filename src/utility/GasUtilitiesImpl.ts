import { GasUtilities } from './GasUtilities';

/**
 * Google Apps Script の Utilities を使用するためのラッパークラス
 */
export class GasUtilitiesImpl implements GasUtilities {
  /**
   * 署名を作成する
   *
   * @param text 署名対象テキスト
   * @param key 秘密鍵
   * @returns 署名
   */
  public computeHmacSha256Signature(text: string, key: string): number[] {
    return Utilities.computeHmacSha256Signature(text, key);
  }

  /**
   * Base64 Web Safe エンコードを行う
   *
   * @param data 対象データ
   * @returns エンコードされたデータ
   */
  public base64EncodeWebSafe(data: number[] | string): string {
    if (typeof data === 'string') {
      return Utilities.base64EncodeWebSafe(data).replace(/=+$/, '');
    } else {
      return Utilities.base64EncodeWebSafe(data).replace(/=+$/, '');
    }
  }

  /**
   * Base64 Web Safe デコードとオブジェクト化を行う
   *
   * @param data 対象データ
   * @returns オブジェクト
   */
  public base64DecodeWebSafeAndToObject(data: string): any {
    const decodedData = Utilities.base64DecodeWebSafe(data);
    const json = Utilities.newBlob(decodedData).getDataAsString();

    return JSON.parse(json);
  }

  /**
   * Sha512のハッシュ値を取得する
   *
   * @param data 対象データ
   * @returns Sha512のハッシュ値
   */
  public sha512(data: string): number[] {
    return Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_512,
      data,
      Utilities.Charset.UTF_8
    );
  }

  /**
   * Base64 エンコードを行う
   *
   * @param data 対象データ
   * @returns エンコードされたデータ
   */
  public base64Encode(data: number[]): string {
    return Utilities.base64Encode(data);
  }
}
