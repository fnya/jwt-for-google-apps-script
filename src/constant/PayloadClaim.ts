/** パブリッククレーム一覧 */
export const PayloadClaim = {
  /** issuer(発行者) */
  iss: 'iss',
  /** subject(主題) */
  sub: 'sub',
  /** audience(受信者) */
  aud: 'aud',
  /** expiration (有効期限/POSIXで定義されているエポックからの経過秒数)  */
  exp: 'exp',
  /** not before (開始日時/POSIXで定義されているエポックからの経過秒数) */
  nbf: 'nbf',
  /** issued at (発行日時/POSIXで定義されているエポックからの経過秒数) */
  iat: 'iat',
  /** JWT ID  */
  jti: 'jti',
} as const;

// eslint-disable-next-line no-redeclare
export type PayloadClaim = typeof PayloadClaim[keyof typeof PayloadClaim];
