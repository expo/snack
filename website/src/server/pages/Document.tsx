import jsesc from 'jsesc';
import React from 'react';

import resources from '../../../resources.json';
import { getPageMetadata } from '../../client/components/PageMetadata';
import { DEFAULT_DESCRIPTION } from '../../client/configs/defaults';
import type { RouterData, QueryParams } from '../../client/types';
import Amplitude from '../components/AmplitudeDocumentComponent';
import { AppetizeScript } from '../components/AppetizeScript';
import GoogleAnalytics from '../components/GoogleAnalytics';
import RudderStack from '../components/RudderStackDocumentComponent';

type Props = {
  id: string | undefined;
  isEmbedded: boolean;
  isAuthenticated: boolean;
  splitTestSettings: object;
  data: RouterData;
  queryParams: QueryParams;
  content: {
    html: string;
    css: {
      content: string;
      renderedClassNames: string[];
    };
  };
};

const css = String.raw;

export default function Document(props: Props) {
  const { id, data, content, isEmbedded, splitTestSettings, queryParams, isAuthenticated } = props;
  const { title, meta } = getPageMetadata({
    id,
    name:
      (data.type === 'success' ? data.snack?.manifest.name : undefined) ??
      queryParams.name ??
      data.defaults.name,
    description:
      (data.type === 'success' ? data.snack?.manifest.description : undefined) ??
      DEFAULT_DESCRIPTION,
  });
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />

        <title>{title}</title>

        {meta.map((metaProps, index) => (
          <meta key={index} {...metaProps} />
        ))}

        <meta
          name="google-site-verification"
          content="Fh25fNM-buRYptb-TO6MVgOjXGzdhmAnRgIC7sdrmbw"
        />

        <link rel="shortcut icon" href="/favicon.ico" />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,300,500,600"
        />
        <link rel="stylesheet" href={resources.normalize} />

        <style
          type="text/css"
          dangerouslySetInnerHTML={{
            __html: css`
              :root {
                --font-normal: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                --font-monospace: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New',
                  monospace;
              }

              html {
                box-sizing: border-box;
              }

              *,
              *:before,
              *:after {
                box-sizing: inherit;
              }

              *:focus {
                outline: none;
              }

              *:focus-visible {
                outline: auto;
              }

              html,
              body {
                height: 100%;
                width: 100%;
                overflow: hidden;
              }

              body {
                font-family: var(--font-normal);
                font-size: 14px;
                line-height: 1.42857143;
                overscroll-behavior: none;
              }

              div {
                scrollbar-width: thin;
                scrollbar-color: var(--color-disabled) var(--color-background);
              }

              @media (hover) {
                ::-webkit-scrollbar {
                  width: 12px;
                  height: 12px;
                  background: var(--color-background);
                }
                ::-webkit-scrollbar-thumb {
                  background: var(--color-disabled);
                  border-radius: 10px;
                  border: 3px var(--color-background) solid;
                }
              }

              button,
              input,
              select,
              textarea {
                font: inherit;
                color: inherit;
                line-height: inherit;
              }

              button {
                cursor: pointer;
              }

              button[disabled] {
                cursor: default;
              }

              #root {
                height: 100vh;
              }

              a {
                color: #4099ff;
              }
            `,
          }}
        />

        <style
          type="text/css"
          data-aphrodite
          dangerouslySetInnerHTML={{ __html: content.css.content }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
               if (window.location.search.indexOf('hideQueryParams=true') >= 0) {
                 history.replaceState(null, document.title, window.location.pathname);
               }
               window.__INITIAL_DATA__ = ${jsesc(
                 {
                   data,
                   splitTestSettings,
                   queryParams,
                   // TODO: Remove `postData` in the summer of 2021. `postData` was replaced
                   // by `queryParams` (which unifies post- and query data). This variable was
                   // re-added to support older cached clients, which have not yet been updated
                   postData: queryParams,
                 },
                 {
                   quotes: 'double',
                   isScriptContext: true,
                 }
               )} `,
          }}
        />
      </head>

      <body>
        <div id="root" dangerouslySetInnerHTML={{ __html: content.html }} />
        {isEmbedded || !isAuthenticated ? (
          <Amplitude />
        ) : (
          <RudderStack splitTestSettings={splitTestSettings} />
        )}
        <GoogleAnalytics propertyId="UA-53647600-5" />
        <AppetizeScript />
        <script src={resources['babel-polyfill']} />
        <script src="/dist/app.bundle.js" />
      </body>
    </html>
  );
}
