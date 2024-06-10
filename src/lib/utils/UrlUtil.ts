/**
 * convert map to query string
 */
export const mapToQuery = (map: {
  [key: string]: string | number | boolean;
}): string => {
  return Object.keys(map)
    .map((key) => key + "=" + encodeURIComponent(map[key]))
    .join("&");
};

/**
 * parse query string
 */
export const parseQuery = (query: string): { [key: string]: string } => {
  const parameters: { [key: string]: string } = {};

  query = query.replace(/^\?/, "");
  if (query === "") return parameters;
  const params = query.split("&");
  for (const i in params) {
    if (!params[i]) continue;
    const param = params[i].split("=");
    const key = param[0];
    const value = decodeURIComponent(param[1]);
    parameters[key] = value;
  }

  return parameters;
};

/**
 * parse
 * @param url
 */
export const parseURL = (url: string) => {
  const href = url;
  let protocol = "";
  let host = "";
  let hostname = "";
  let port = "";
  let pathname = "";
  let search = "";
  let hash = "";
  let query: { [key: string]: string } = {};

  let matches = url.match(/^(https?:)\/\/([^/]+)/i);
  if (matches) {
    protocol = matches[1];
    host = matches[2];
    [hostname, port] = host.split(":");
    port = port || "80";
    url = url.substr(matches[0].length);
  }

  matches = url.match(/^([^?]+)/);
  if (matches) {
    pathname = matches[1];
    url = url.substr(matches[0].length);
  }

  matches = url.match(/^(\?[^#]+)/);
  if (matches) {
    search = matches[1];
    url = url.substr(matches[0].length);
    query = parseQuery(search.substr(1));
  }
  if (url.match(/^#/)) {
    hash = url;
  }

  const domain = `${protocol}//${hostname}${
    port !== "" && port !== "80" ? `:${port}` : ""
  }`;

  return {
    href,
    protocol,
    host,
    hostname,
    port,
    pathname,
    search,
    query,
    hash,
    domain,
  };
};

/**
 * get query parameters
 */
export const getQuery = (): { [key: string]: string } => {
  return typeof window !== "undefined" ? parseQuery(location.search) : {};
};

/**
 * get root URL
 */
export const getRootURL = (): string => {
  if (location.origin) return location.origin;
  return (
    location.protocol +
    "//" +
    location.hostname +
    (location.port !== "80" ? ":" + location.port : "")
  );
};

/**
 * get lang
 */
export const getLang = (): string => {
  const htmlElem =
    document.documentElement || document.getElementsByTagName("html")[0];
  const lang = (htmlElem && htmlElem.getAttribute("lang")) || "ja";
  return lang;
};

/**
 * get canonical URL
 */
export const getCanonicalURL = (): string => {
  let url = location.href;
  const canonicalElem = document.querySelector<HTMLElement>(
    'link[rel="canonical"]'
  );
  if (canonicalElem) {
    url = canonicalElem.getAttribute("href") || url;
  }
  return url;
};

/**
 * remove query parameter
 */
export const removeQueryParameters = (...removeParameters: string[]) => {
  const parameters = getQuery();
  for (const key of removeParameters) {
    delete parameters[key];
  }

  const otherParams: string[] = [];
  for (const key in parameters)
    otherParams.push(key + "=" + encodeURIComponent(parameters[key]));
  let otherParamsString = otherParams.join("&");
  if (otherParamsString) {
    otherParamsString = "?" + otherParamsString;
  }

  const path = location.pathname + otherParamsString;

  // replace URL
  try {
    window.history.replaceState(null, "", path);
  } catch (e) {
    try {
      location.href = path;
    } catch (error) {
      console.error(error);
    }
  }
};
