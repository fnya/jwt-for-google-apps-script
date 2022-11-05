/**
 * Google Apps Scriptを使用するためのインターフェース
 */
export interface GasUtilities {
  base64DecodeWebSafeAndToObject(data: string): any;
  base64EncodeWebSafe(data: number[] | string): string;
  computeHmacSha256Signature(text: string, key: string): number[];
}
