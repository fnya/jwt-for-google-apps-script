/** メッセージ */
export class Message {
  public static ACCESS_TOKEN_ERROR = 'JWTアクセストークンが不正です';
  public static REQUIRED_ALGORITHM_ERROR = '署名アルゴリズムは必須です';
  public static NO_SUPPORT_ALGORITHM_ERROR = 'サポート外のアルゴリズムです';
  public static ACCESS_TOKEN_EXPIRED_ERROR =
    'JWTアクセストークンの期限が切れています';
}
