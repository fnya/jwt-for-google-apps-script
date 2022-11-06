import { GasPropertiesService } from './GasPropertiesService';

/**
 * Google Apps Script の PropertiesService を使用するためのラッパークラス
 */
export class GasPropertiesServiceImpl implements GasPropertiesService {
  public getProperty(key: string): string {
    const property = PropertiesService.getScriptProperties().getProperty(key);

    if (property) {
      return property;
    }

    throw new Error('PropertyType の値が不正です');
  }
}
