import crypto from 'crypto';
import nullthrows from 'nullthrows';

import { getSnackWebsiteURL } from '../client/utils/getWebsiteURL';

const url = nullthrows(getSnackWebsiteURL());

// options has fields:
//   id, platform, preview, sdkVersion, code, name, description
//   either id or code are required
export const script = `
(function() {
  if (window.ExpoSnack) {
    return;
  }

  var ExpoSnack = {
    append: function(container, options) {
      options = options || {};
      options.id = options.id || container.dataset.snackId || container.dataset.sketchId;
      options.platform = options.platform || container.dataset.snackPlatform || container.dataset.sketchPlatform;
      options.supportedPlatforms = options.supportedPlatforms || container.dataset.snackSupportedPlatforms || container.dataset.snackSupportedplatforms;
      options.preview = options.preview || container.dataset.snackPreview || container.dataset.sketchPreview || 'true';
      options.sdkVersion = options.sdkVersion || container.dataset.snackSdkVersion || container.dataset.snackSdkversion;
      options.name = options.name || container.dataset.snackName;
      options.description = options.description || container.dataset.snackDescription;
      options.theme = options.theme || container.dataset.snackTheme;
      options.appetizePayerCode = options.appetizePayerCode || container.dataset.snackAppetizePayerCode;
      options.loading = options.loading || container.dataset.snackLoading;
      options.deviceFrameAndroid = options.deviceFrameAndroid || container.dataset.deviceFrameAndroid;
      options.deviceFrameIos = options.deviceFrameIos || container.dataset.deviceFrameIos;

      if (!options.code && container.dataset.snackCode) {
        options.code = decodeURIComponent(container.dataset.snackCode);
      }

      if (!options.files && container.dataset.snackFiles) {
        options.files = decodeURIComponent(container.dataset.snackFiles);
      }

      if (!options.dependencies && container.dataset.snackDependencies){
        options.dependencies = container.dataset.snackDependencies;
      }

      if (container.querySelector('iframe[data-snack-iframe]')) {
        return;
      }

      if (!options.id && !(options.code || options.files)) {
        return;
      }

      var iframeId = Math.random().toString(36).substr(2, 10);
      var iframe = document.createElement('iframe');

      var iframeQueryParams = '?iframeId=' + iframeId;

      if (options.preview) {
        iframeQueryParams += '&preview=' + options.preview;
      }
      if (options.platform) {
        iframeQueryParams += '&platform=' + options.platform;
      }
      if (options.supportedPlatforms) {
        iframeQueryParams += '&supportedPlatforms=' + options.supportedPlatforms;
      }
      if (options.sdkVersion) {
        iframeQueryParams += '&sdkVersion=' + options.sdkVersion;
      }
      if (options.name) {
        iframeQueryParams += '&name=' + options.name;
      }
      if (options.description) {
        iframeQueryParams += '&description=' + options.description;
      }
      if (options.theme) {
        iframeQueryParams += '&theme=' + options.theme;
      }
      if (options.appetizePayerCode) {
        iframeQueryParams += '&appetizePayerCode=' + options.appetizePayerCode;
      }
      if (options.verbose) {
        iframeQueryParams += '&verbose=' + options.verbose;
      }
      if (options.deviceFrameAndroid) {
        iframeQueryParams += '&deviceFrameAndroid=' + options.deviceFrameAndroid;
      }
      if (options.deviceFrameIos) {
        iframeQueryParams += '&deviceFrameIos=' + options.deviceFrameIos;
      }
      if (options.loading) {
        iframe.loading = options.loading;
      }

      if (options.id) {
        iframe.src = '${url}/embedded/' + options.id + iframeQueryParams;
      } else {
        iframe.src = '${url}/embedded' + iframeQueryParams + '&waitForData=true';
      }
      iframe.style = 'display: block';
      iframe.height = '100%';
      iframe.width = '100%';
      iframe.frameBorder = '0';
      iframe.allowTransparency = true;
      iframe.dataset.snackIframe = true;

      container.appendChild(iframe);

      if (options.code || options.files || options.dependencies) {
        window.addEventListener('message', function(event) {
          var eventName = event.data[0];
          var data = event.data[1];
          if (eventName === 'expoFrameLoaded' && data.iframeId === iframeId) {
            iframe.contentWindow.postMessage(['expoDataEvent', {
              iframeId: iframeId,
              dependencies: options.dependencies,
              code: options.code,
              files: options.files,
            }], '*')
          }
        });
      }
    },

    remove: function(container) {
      var iframe = container.querySelector('iframe[data-snack-iframe]');

      if (iframe) {
        iframe.parentNode.removeChild(iframe);
      }
    },

    initialize: function() {
      document
        .querySelectorAll(
          "[data-sketch-id], [data-snack-id], [data-snack-code], [data-snack-files]"
        )
        .forEach(function (element) {
          ExpoSnack.append(element);
        });
    }
  }

  if (document.readyState === "complete") {
    ExpoSnack.initialize();
  } else {
    document.addEventListener('readystatechange', function() {
      if (document.readyState === "complete") {
        ExpoSnack.initialize();
      }
    });
  }

  window.ExpoSnack = ExpoSnack;
  window.ExpoSketch = ExpoSnack;
})();
`;

export const hash = crypto.createHash('sha256').update(script).digest('base64');
