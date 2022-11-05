import { Algorithm } from './constant/Algorithm';
import { GasUtilitiesImpl } from './utility/GasUtilitiesImpl';
import { Jwt } from './Jwt';
import { PayloadClaim } from './constant/PayloadClaim';

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
    const requiredPayloadClaims = [
      PayloadClaim.iss,
      PayloadClaim.sub,
      PayloadClaim.aud,
      PayloadClaim.exp,
    ];
    return new Jwt(new GasUtilitiesImpl(), algorithms, requiredPayloadClaims);
  }
}
