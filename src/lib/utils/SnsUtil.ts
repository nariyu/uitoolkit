import { getCanonicalURL, getLang, mapToQuery } from './UrlUtil';

export const shareToLinkedIn = (url?: string) => {
  url = url || getCanonicalURL();
  const shareURL = `http://www.linkedin.com/shareArticle?mini=true&url=${url}`;
  window.open(
    shareURL,
    'ShareLinkedIn',
    'width=550,height=450,personalbar=0,toolbar=0,resizable=yes,scrollbars=yes',
  );
};

/**
 * Facebook シェア URL を生成
 */
export const getFacebookShareURL = (
  url?: string,
  hashtag?: string,
  quote?: string,
) => {
  if (!url) {
    const urlMetaElem = document.querySelector<HTMLElement>(
      'meta[property="og:url"]',
    );
    url = urlMetaElem ? urlMetaElem.getAttribute('content') || '' : '';
  }
  url = url || getCanonicalURL();

  const params: {
    href: string;
    hashtag?: string;
    quote?: string;
    app_id?: string | number;
  } = { href: url };
  if (hashtag) params.hashtag = hashtag;
  if (quote) params.quote = quote;

  const elem = document.querySelector
    ? document.querySelector('meta[property="fb:app_id"]')
    : undefined;
  const appID = elem
    ? parseInt(elem.getAttribute('content') as string, 10)
    : undefined;
  if (appID) {
    params.app_id = appID;
    return `https://www.facebook.com/dialog/share?${mapToQuery(params)}`;
  } else {
    return `http://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}`;
  }
};

/**
 * Facebook でシェア
 */
export const shareToFacebook = (
  url?: string,
  hashtag?: string,
  quote?: string,
) => {
  if (!url) {
    const elem = document.querySelector<HTMLElement>('meta[property="og:url"]');
    url = elem ? elem.getAttribute('content') || '' : '';
  }
  url = url || getCanonicalURL();

  if (window.FB && !!window.FB.ui) {
    window.FB.ui({
      method: 'share',
      href: url,
    });
    return;
  }

  const shareURL = getFacebookShareURL(url, hashtag, quote);
  window.open(
    shareURL,
    'ShareFacebook',
    'width=550,height=450,personalbar=0,toolbar=0,resizable=yes,scrollbars=yes',
  );
};

/**
 * Twitter シェア URL を生成
 */
export const getTwitterShareURL = (
  text?: string,
  hashtags?: string,
  url?: string,
) => {
  if (!url) {
    const elem = document.querySelector<HTMLElement>(
      'meta[name="twitter:url"]',
    );
    url = elem ? elem.getAttribute('content') || '' : '';
  }
  url = url || getCanonicalURL();

  if (typeof text === 'undefined') {
    const elem = document.querySelector<HTMLElement>(
      'meta[name="twitter:share:text"]',
    );
    text = elem ? elem.getAttribute('content') || '' : '';
  }
  if (typeof hashtags === 'undefined') {
    const elem = document.querySelector<HTMLElement>(
      'meta[name="twitter:share:hashtags"]',
    );
    hashtags = elem ? elem.getAttribute('content') || '' : '';
  }

  const encodedText = encodeURIComponent(text);
  const encodedHashtags = encodeURIComponent(hashtags || '');
  const encodedURL = encodeURIComponent(url);

  const shareURL = `https://twitter.com/intent/tweet?text=${encodedText}&hashtags=${encodedHashtags}&lang=${getLang()}&url=${encodedURL}`;

  return shareURL;
};

/**
 * Twitter でシェア
 */
export const shareToTwitter = (
  text?: string,
  hashtags?: string,
  url?: string,
) => {
  const shareURL = getTwitterShareURL(text, hashtags, url);
  window.open(
    shareURL,
    'ShareTwitter',
    'width=500,height=300,top=100,left=100,resizable=yes,scrollbars=yes',
  );
};

/**
 * LINE シェア URL を生成
 */
export const getLineShareURL = (text?: string, url?: string) => {
  if (typeof text === 'undefined') {
    const elem = document.querySelector<HTMLElement>(
      'meta[name="line:share:text"]',
    );
    text = elem ? elem.getAttribute('content') || '' : '';
  }

  if (!url) {
    const elem = document.querySelector<HTMLElement>('meta[property="og:url"]');
    url = elem ? elem.getAttribute('content') || '' : '';
  }
  url = url || getCanonicalURL();

  if (url) text += ' ' + url;
  return `http://line.me/R/msg/text/?${encodeURIComponent(text)}`;
};

/**
 * LINE でシェア
 */
export const shareToLINE = (text?: string, url?: string) => {
  window.open(getLineShareURL(text, url));
};
