import { describe, test, expect } from '@jest/globals';
import { Jwt } from '../src/Jwt';
import { JwtFactory } from '../src/JwtFactory';

describe('JwtFactory のテスト', () => {
  test('Jwt を作成できること', () => {
    // 実行
    const actual = JwtFactory.create();

    // 検証
    expect(actual instanceof Jwt).toBe(true);
  });
});
