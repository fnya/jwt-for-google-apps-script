import { Algorithm } from './constant/Algorithm';
import { GasUtilitiesImpl } from './utility/GasUtilitiesImpl';
import { Jwt } from './Jwt';
import { GasPropertiesServiceImpl } from '../src/utility/GasPropertiesServiceImpl';

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
    const algorithms = [Algorithm.HS256];
    return new Jwt(
      new GasUtilitiesImpl(),
      new GasPropertiesServiceImpl(),
      algorithms
    );
  }
}
