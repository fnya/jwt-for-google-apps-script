/* eslint-disable no-undef */
import { describe, test, beforeEach, expect, afterEach } from '@jest/globals';
import { mock, instance, when, anything, verify } from 'ts-mockito';
import { Algorithm } from '../src/constant/Algorithm';
import { JwtType } from '../src/constant/JwtType';
import { PayloadClaim } from '../src/constant/PayloadClaim';
import { Jwt } from '../src/Jwt';
import { GasUtilities } from '../src/utility/GasUtilities';

describe('Jwt のテスト', () => {
  let jwt: Jwt;
  let gasUtilitiesMock: any;
  let gasUtilities: GasUtilities;

  beforeEach(() => {
    gasUtilitiesMock = mock<GasUtilities>();
    gasUtilities = instance(gasUtilitiesMock);
    const requiredPayloadClaims = [
      PayloadClaim.iss,
      PayloadClaim.sub,
      PayloadClaim.aud,
      PayloadClaim.exp,
    ];
    jwt = new Jwt(gasUtilities, [Algorithm.HS256], requiredPayloadClaims);
  });

  afterEach(() => {
    // Dateのモックを元に戻す
    jest.useRealTimers();
  });

  describe('createAccessToken のテスト', () => {
    test('アクセストークンを取得できること', () => {
      // 準備
      const sigunatureBytes = [1, 2];
      const headerClaim = { alg: Algorithm.HS256, typ: JwtType.JWT };
      const payloadClaim = {
        iss: 'iss',
        sub: 'sub',
        aud: 'aud',
        exp: 1516239022,
        iat: 1516239022,
      };
      const headerJson = '{\n\t"alg": "HS256",\n\t"typ": "JWT"\n}';
      const payloadJson =
        '{\n\t"iss": "iss",\n\t"sub": "sub",\n\t"aud": "aud",\n\t"exp": 1516239022,\n\t"iat": 1516239022\n}';
      const header = 'header';
      const payload = 'payload';
      const sigunature = 'sigunature';
      const expected = 'header.payload.sigunature';

      when(gasUtilitiesMock.base64EncodeWebSafe(headerJson)).thenReturn(header);
      when(gasUtilitiesMock.base64EncodeWebSafe(payloadJson)).thenReturn(
        payload
      );
      when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
        sigunature
      );
      when(
        gasUtilitiesMock.computeHmacSha256Signature(anything(), anything())
      ).thenReturn(sigunatureBytes);

      // 実行
      const actual = jwt.createAccessToken(headerClaim, payloadClaim, 'key');

      // 検証
      expect(actual).toEqual(expected);
    });

    test('署名アルゴリズムがない場合はエラーになること', () => {
      // 準備
      const headerClaim = { typ: JwtType.JWT };
      const payloadClaim = {};

      // 実行&検証
      expect(() => {
        jwt.createAccessToken(headerClaim, payloadClaim, 'key');
      }).toThrow('署名アルゴリズムは必須です');
    });
  });

  describe('createHeaderClaim のテスト', () => {
    test('ヘッダークレームを作成できること', () => {
      // 準備
      const expected = { alg: Algorithm.HS256, typ: JwtType.JWT };

      // 実行
      const actual = jwt.createHeaderClaim(Algorithm.HS256, JwtType.JWT);

      // 検証
      expect(actual).toEqual(expected);
    });

    test('JwtTypeがなくてもヘッダークレームを作成できること', () => {
      // 準備
      const expected = { alg: Algorithm.HS256 };

      // 実行
      const actual = jwt.createHeaderClaim(Algorithm.HS256);

      // 検証
      expect(actual).toEqual(expected);
    });
  });

  describe('createPayloadClaim のテスト', () => {
    test('ペイロードークレームを作成できること', () => {
      // 準備
      const mockDate = new Date(2022, 10, 5, 1, 2, 3, 1);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const expected = {
        iss: 'iss',
        sub: 'sub',
        aud: 'aud',
        exp: 1667579523,
        iat: 1667577723,
        admin: true,
        user: 'hoge@example.com',
      };

      // 実行
      const actual = jwt.createPayloadClaim('iss', 'sub', 'aud', 30, {
        admin: true,
        user: 'hoge@example.com',
      });

      // 検証
      expect(actual).toEqual(expected);
    });

    test('プライベートクレームがない場合も問題なくペイロードクレームが作成できること', () => {
      // 準備
      const mockDate = new Date(2022, 10, 5, 1, 2, 3, 1);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const expected = {
        iss: 'iss',
        sub: 'sub',
        aud: 'aud',
        exp: 1667579523,
        iat: 1667577723,
      };

      // 実行
      const actual = jwt.createPayloadClaim('iss', 'sub', 'aud', 30);

      // 検証
      expect(actual).toEqual(expected);
    });
  });

  describe('sign のテスト', () => {
    test('署名を作成できること', () => {
      // 準備
      const target = 'header.payload';
      const privateKey = 'privateKey';
      const sigunatureBytes = [1, 2];
      const sigunature = 'sigunature';
      const expected = 'sigunature';

      when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
        sigunature
      );
      when(
        gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
      ).thenReturn(sigunatureBytes);

      // 実行
      const actual = jwt.sign(target, privateKey, Algorithm.HS256);

      // 検証
      expect(actual).toEqual(expected);
    });

    test('対象外の署名アルゴリズムの場合はエラーになること', () => {
      // 準備
      const target = 'header.payload';
      const privateKey = 'privateKey';

      // 実行&検証
      expect(() => {
        jwt.sign(target, privateKey, Algorithm.UNKOWN);
      }).toThrow('サポート外のアルゴリズムです');
    });
  });

  describe('decode のテスト', () => {
    test('アクセストークン検証でエラーがない場合は例外が発生しないこと', () => {
      // 準備
      const target = 'header.payload';
      const expected = 'encoded';

      when(gasUtilitiesMock.base64DecodeWebSafeAndToObject(target)).thenReturn(
        expected
      );

      // 実行
      const actual = jwt.decode(target);

      // 検証
      expect(actual).toEqual(expected);
      verify(gasUtilitiesMock.base64DecodeWebSafeAndToObject(target)).once();
    });
  });

  describe('validate のテスト', () => {
    test('アクセストークン検証でエラーがない場合は例外が発生しないこと', () => {
      // 準備
      const target = 'header.payload';
      const privateKey = 'privateKey';
      const sigunatureBytes = [1, 2];
      const sigunature = 'sigunature';
      const expected = 'sigunature';

      when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
        sigunature
      );
      when(
        gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
      ).thenReturn(sigunatureBytes);

      // 実行
      const actual = jwt.sign(target, privateKey, Algorithm.HS256);

      // 検証
      expect(actual).toEqual(expected);
    });

    test('アクセストークンがない場合は例外が発生すること', () => {
      // 準備
      const privateKey = 'privateKey';

      // 実行&検証
      expect(() => {
        jwt.validate(privateKey, Algorithm.HS256, null);
      }).toThrow('アクセストークンが不正です');
    });

    test('アクセストークンの.の数が少ない場合は例外が発生すること', () => {
      // 準備
      const accessToken = 'header.payload';
      const privateKey = 'privateKey';

      // 実行&検証
      expect(() => {
        jwt.validate(privateKey, Algorithm.HS256, accessToken);
      }).toThrow('アクセストークンが不正です');
    });

    test('アクセストークンの.の数が多い場合は例外が発生すること', () => {
      // 準備
      const accessToken = 'header.payload.sigunature.';
      const privateKey = 'privateKey';

      // 実行&検証
      expect(() => {
        jwt.validate(privateKey, Algorithm.HS256, accessToken);
      }).toThrow('アクセストークンが不正です');
    });

    test('アクセストークンの署名検証に失敗した場合に例外が発生すること', () => {
      // 準備
      const accessToken = 'header.payload.sigunature1';
      const target = 'header.payload';
      const privateKey = 'privateKey';
      const sigunatureBytes = [1, 2];
      const sigunature = 'sigunature';

      when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
        sigunature
      );
      when(
        gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
      ).thenReturn(sigunatureBytes);

      // 実行&検証
      expect(() => {
        jwt.validate(privateKey, Algorithm.HS256, accessToken);
      }).toThrow('アクセストークンが不正です');
    });

    describe('ヘッダークレームのテスト', () => {
      test('ヘッダークレームの検証アルゴリズムがない場合は例外が発生すること', () => {
        // 準備
        const accessToken = 'header.payload.sigunature';
        const target = 'header.payload';
        const privateKey = 'privateKey';
        const sigunatureBytes = [1, 2];
        const sigunature = 'sigunature';
        const decodedHeader = {};

        when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
          sigunature
        );
        when(
          gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
        ).thenReturn(sigunatureBytes);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('header')
        ).thenReturn(decodedHeader);

        // 実行&検証
        expect(() => {
          jwt.validate(privateKey, Algorithm.HS256, accessToken);
        }).toThrow('アクセストークンが不正です');
      });

      test('ヘッダークレームの検証アルゴリズムが許可がない場合は例外が発生すること', () => {
        // 準備
        const accessToken = 'header.payload.sigunature';
        const target = 'header.payload';
        const privateKey = 'privateKey';
        const sigunatureBytes = [1, 2];
        const sigunature = 'sigunature';
        const decodedHeader = { alg: Algorithm.UNKOWN };

        when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
          sigunature
        );
        when(
          gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
        ).thenReturn(sigunatureBytes);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('header')
        ).thenReturn(decodedHeader);

        // 実行&検証
        expect(() => {
          jwt.validate(privateKey, Algorithm.HS256, accessToken);
        }).toThrow('アクセストークンが不正です');
      });
    });

    describe('ペイロードクレームのテスト', () => {
      test('ペイロードクレームの必須項目がないは例外が発生すること', () => {
        // 準備
        const accessToken = 'header.payload.sigunature';
        const target = 'header.payload';
        const privateKey = 'privateKey';
        const sigunatureBytes = [1, 2];
        const sigunature = 'sigunature';
        const decodedHeader = { alg: Algorithm.HS256, typ: JwtType.JWT };
        const decodedPayload = {};

        when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
          sigunature
        );
        when(
          gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
        ).thenReturn(sigunatureBytes);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('header')
        ).thenReturn(decodedHeader);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('payload')
        ).thenReturn(decodedPayload);

        // 実行&検証
        expect(() => {
          jwt.validate(privateKey, Algorithm.HS256, accessToken);
        }).toThrow('アクセストークンが不正です');
      });

      test('ペイロードクレームの必須項目が一部ないは例外が発生すること', () => {
        // 準備
        const accessToken = 'header.payload.sigunature';
        const target = 'header.payload';
        const privateKey = 'privateKey';
        const sigunatureBytes = [1, 2];
        const sigunature = 'sigunature';
        const decodedHeader = { alg: Algorithm.HS256, typ: JwtType.JWT };
        const decodedPayload = { iss: 'iss', sub: 'sub', aud: 'aud' };

        when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
          sigunature
        );
        when(
          gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
        ).thenReturn(sigunatureBytes);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('header')
        ).thenReturn(decodedHeader);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('payload')
        ).thenReturn(decodedPayload);

        // 実行&検証
        expect(() => {
          jwt.validate(privateKey, Algorithm.HS256, accessToken);
        }).toThrow('アクセストークンが不正です');
      });

      test('ペイロードクレームのexpが期限切れの場合は例外が発生すること', () => {
        // 準備
        const accessToken = 'header.payload.sigunature';
        const target = 'header.payload';
        const privateKey = 'privateKey';
        const sigunatureBytes = [1, 2];
        const sigunature = 'sigunature';
        const decodedHeader = { alg: Algorithm.HS256, typ: JwtType.JWT };
        const decodedPayload = {
          iss: 'iss',
          sub: 'sub',
          aud: 'aud',
          exp: 1667577722,
        }; // 1秒期限切れ

        const mockDate = new Date(2022, 10, 5, 1, 2, 3); /// 1667577723
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);

        when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
          sigunature
        );
        when(
          gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
        ).thenReturn(sigunatureBytes);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('header')
        ).thenReturn(decodedHeader);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('payload')
        ).thenReturn(decodedPayload);

        // 実行&検証
        expect(() => {
          jwt.validate(privateKey, Algorithm.HS256, accessToken);
        }).toThrow('アクセストークンが不正です');
      });

      test('ペイロードクレームに問題がない場合は例外が発生しないこと', () => {
        // 準備
        const accessToken = 'header.payload.sigunature';
        const target = 'header.payload';
        const privateKey = 'privateKey';
        const sigunatureBytes = [1, 2];
        const sigunature = 'sigunature';
        const decodedHeader = { alg: Algorithm.HS256, typ: JwtType.JWT };
        const decodedPayload = {
          iss: 'iss',
          sub: 'sub',
          aud: 'aud',
          exp: 1667577724,
        }; // 1秒期限あり

        const mockDate = new Date(2022, 10, 5, 1, 2, 3); /// 1667577723
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);

        when(gasUtilitiesMock.base64EncodeWebSafe(sigunatureBytes)).thenReturn(
          sigunature
        );
        when(
          gasUtilitiesMock.computeHmacSha256Signature(target, privateKey)
        ).thenReturn(sigunatureBytes);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('header')
        ).thenReturn(decodedHeader);
        when(
          gasUtilitiesMock.base64DecodeWebSafeAndToObject('payload')
        ).thenReturn(decodedPayload);

        // 実行&検証
        jwt.validate(privateKey, Algorithm.HS256, accessToken);
      });
    });
  });
});
