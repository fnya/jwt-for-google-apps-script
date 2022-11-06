/**
 * Google Apps Script の PropertiesService を使用するためのインターフェース
 */
export interface GasPropertiesService {
  getProperty(key: string): string;
}
