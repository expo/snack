const { S3 } = require('aws-sdk');

async function privatizeGitImportCache(s3, bucket, apply = false, report = console.log) {
  let keyMarker;
  let versionIdMarker;
  let count = 0;
  while (true) {
    const page = await s3
      .listObjectVersions({
        Bucket: bucket,
        KeyMarker: keyMarker,
        VersionIdMarker: versionIdMarker,
      })
      .promise();
    for (const { Key, VersionId } of page.Versions || []) {
      if (!Key || !VersionId)
        throw new Error('S3 returned an object version without a key or version ID.');
      report(
        `${apply ? 'Resetting' : 'Would reset'} ACL for ${JSON.stringify({ Key, VersionId })}`,
      );
      if (apply) {
        await s3.putObjectAcl({ Bucket: bucket, Key, VersionId, ACL: 'private' }).promise();
      }
      count++;
    }
    if (!page.IsTruncated) return count;
    keyMarker = page.NextKeyMarker;
    versionIdMarker = page.NextVersionIdMarker;
    if (!keyMarker || !versionIdMarker) {
      throw new Error(
        'S3 omitted version-list pagination markers. Rerun after resolving the listing error.',
      );
    }
  }
}

module.exports = { privatizeGitImportCache };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== '--apply')) {
    console.error('Usage: node scripts/privatizeGitImportCache.js BUCKET [--apply]');
    process.exitCode = 1;
  } else {
    privatizeGitImportCache(new S3(), args[0], args[1] === '--apply')
      .then((count) => console.log(`${count} object versions ${args[1] ? 'updated' : 'listed'}.`))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
