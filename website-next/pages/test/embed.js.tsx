export default function EmbedJSTest() {
  return (
    <>
      <style jsx>{`
        .embedjs {
          overflow: hidden;
          background: #fafafa;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 4px;
          height: 503px;
          width: 788px;
        }
      `}</style>
      <div
        className="embedjs"
        data-snack-code="export default function() { return null; };"
        data-snack-preview="false"
        data-snack-platform="web"
        data-snack-theme="light"
        data-snack-supportedPlatforms="web"
        data-snack-name="My Snack"
        data-snack-description="My Description"
        data-snack-sdkVersion="38.0.0"
        data-snack-loading="lazy"
      />
      <script async src="/embed.js"></script>
    </>
  );
}
