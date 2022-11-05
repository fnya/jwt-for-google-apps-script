import { GasUtilities } from './GasUtilities';

/**
 * Google Apps Scriptを使用するためのラッパークラス
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
      return Utilities.base64EncodeWebSafe(data);
    } else {
      return Utilities.base64EncodeWebSafe(data);
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
}
