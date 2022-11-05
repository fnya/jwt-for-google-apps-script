/** 署名アルゴリズム */
export const Algorithm = {
  HS256: 'HS256',
  UNKOWN: 'UNKOWN',
} as const;

// eslint-disable-next-line no-redeclare
export type Algorithm = typeof Algorithm[keyof typeof Algorithm];
