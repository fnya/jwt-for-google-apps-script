import { GasUtilitiesImpl } from './utility/GasUtilitiesImpl';
import { Jwt } from './Jwt';

/**
 * Jwtを生成するファクトリークラス
 */
export class JwtFactory {
  /**
   * Jwtのインスタンスを生成する
   *
   * @returns Jwt
   */
  public static create(): Jwt {
    return new Jwt(new GasUtilitiesImpl());
  }
}
