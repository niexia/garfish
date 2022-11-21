import { validURL } from '@garfish/utils';
import { encode } from 'querystring';
import { RouterConfig, __GARFISH_ROUTER_UPDATE_FLAG__ } from '../config';

function createPopStateEvent(state: any, originalMethodName: string) {
  let evt;
  try {
    evt = new PopStateEvent('popstate', { state });
  } catch (err) {
    // IE 11 compatibility
    evt = document.createEvent('PopStateEvent');
    (evt as any).initPopStateEvent('popstate', false, false, state);
  }
  (evt as any).garfish = true;
  (evt as any).garfishTrigger = originalMethodName;
  return evt;
}

export const callCapturedEventListeners = (type: keyof History) => {
  const eventArguments = createPopStateEvent(window.history.state, type);
  window.dispatchEvent(eventArguments);
};

const encodeReserveRE = /[!'()*]/g;
const encodeReserveReplacer = c => '%' + c.charCodeAt(0).toString(16);
const commaRE = /%2C/g;

const encode = (str: string) => encodeURIComponent(str)
  .replace(encodeReserveRE, encodeReserveReplacer)
  .replace(commaRE, ',')

const stringifyQuery = function (query: { [key: string]: any }): string {
  const res = query 
    ? Object.keys(query).map(key => {
        const val = query[key];

        if (val === undefined) {
          return '';
        }

        if (val === null) {
          return encode(key)
        }
        if (Array.isArray(val)) {
          const result = [];
          val.forEach(v => {
            if (v === undefined) {
              return;
            }

            if (v === null) {
              result.push(encode(key));
              return;
            }

            result.push(`${encode(key)}=${encode(v)}`)
          })

          return result.join('&');
        }
      })
      .filter(item => item?.length)
      .join('&')
    : null;

    return res ? `?${res}` : '';
}

const handlerParams = function (
  path: string,
  query: { [key: string]: string },
  basename?: string,
): string {
  if (!path || typeof path !== 'string') return '';
  let url = path;
  if (url[0] !== '/') url = '/' + url;
  if (Object.prototype.toString.call(query) === '[object Object]') url = url + stringifyQuery(query);
  if (basename !== '/') url = basename + url;
  if (url[0] !== '/') url = '/' + url;
  return url;
};

export const push = ({
  path,
  query,
  basename,
}: {
  path: string;
  query?: { [key: string]: string };
  basename?: string;
}) => {
  if (!basename) basename = RouterConfig.basename || '/';

  let url: string | null = null;
  if (validURL(path)) {
    url = /(^https?:)|(^\/\/)/.test(path) ? path : `//${path}`;
  } else {
    url = handlerParams(path, query!, basename);
  }
  // 不保留之前history.state的状态会导致vue3依赖state的情况无法正常渲染页面
  history.pushState(
    { [__GARFISH_ROUTER_UPDATE_FLAG__]: true, ...history.state },
    '',
    url,
  );
};

export const replace = ({
  path,
  query,
  basename,
}: {
  path: string;
  query?: { [key: string]: string };
  basename?: string;
}) => {
  if (!basename) basename = RouterConfig.basename || '/';

  let url: string | null = null;
  if (validURL(path)) {
    url = /^(https?:)(\/\/)/.test(path) ? path : `//${path}`;
  } else {
    url = handlerParams(path, query!, basename);
  }
  history.replaceState(
    { [__GARFISH_ROUTER_UPDATE_FLAG__]: true, ...history.state },
    '',
    url,
  );
};
