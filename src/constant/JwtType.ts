/** JWT メディアタイプ */
export const JwtType = {
  JWT: 'JWT',
  UNKOWN: 'UNKOWN',
} as const;

// eslint-disable-next-line no-redeclare
export type JwtType = typeof JwtType[keyof typeof JwtType];
