export const Config = {
  VERSION: process.env.VERSION,

  TITLE: 'UI Toolkit',
  DESCRIPTION: 'UI Toolkit',
  URL: 'https://uitoolkit.vercel.app',

  NODE_ENV: process.env.NODE_ENV as 'development' | 'production',
  ENV: process.env.ENV as 'local' | 'develop' | 'staging' | 'production',
  VERCEL_URL: process.env.VERCEL_URL as string,
  VERCEL_GIT_COMMIT_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || '').substr(0, 7),
};
