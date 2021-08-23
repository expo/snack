import React from 'react';

type Props = {
  splitTestSettings: object;
};

export default class RudderStackDocumentComponent extends React.Component<Props> {
  render() {
    const rudderStackWriteKey: string = process.env.RUDDERSTACK_WRITE_KEY ?? '';
    const rudderStackDataPlaneURL: string = process.env.RUDDERSTACK_DATA_PLANE_URL ?? '';

    if (process.env.NODE_ENV === 'production' || (rudderStackWriteKey && rudderStackDataPlaneURL)) {
      const rudderStackMarkup = {
        __html: this.getRudderStackScript(rudderStackWriteKey, rudderStackDataPlaneURL),
      };
      return <script dangerouslySetInnerHTML={rudderStackMarkup} />;
    } else {
      return null;
    }
  }

  private getRudderStackScript(
    rudderStackWriteKey: string,
    rudderStackDataPlaneURL: string
  ): string {
    return `
!function(){var e=window.rudderanalytics=window.rudderanalytics||[];e.methods=["load","page","track","identify","alias","group","ready","reset","getAnonymousId","setAnonymousId"],e.factory=function(t){return function(){var r=Array.prototype.slice.call(arguments);return r.unshift(t),e.push(r),e}};for(var t=0;t<e.methods.length;t++){var r=e.methods[t];e[r]=e.factory(r)}e.loadJS=function(e,t){var r=document.createElement("script");r.type="text/javascript",r.async=!0,r.src="https://cdn.rudderlabs.com/v1/rudder-analytics.min.js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a)},e.loadJS(),
e.load('${rudderStackWriteKey}','${rudderStackDataPlaneURL}');
e.page();
e.identify({
  user_properties: ${JSON.stringify(this.props.splitTestSettings || {})}
});}(); 
      `.replace(/\n/g, '');
  }
}
