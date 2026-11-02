# Android release signing

`budgeter-release.keystore` is the key every APK from this repository is signed
with. It is committed on purpose: GitHub Actions builds the APK without any
signing secrets, and a stable key means new releases install over old ones
instead of failing with a signature mismatch.

The key is **public**. Anyone with access to this repository can sign an APK
that Android will accept as an update to Budgeter. That is acceptable for a
sideload-only app distributed from this repo's Releases page, which is how
Budgeter is shipped — it is not published on Google Play. Treat the keystore as
a build artifact, not as a secret.

- Keystore: `budgeter-release.keystore` (PKCS#12)
- Alias: `budgeter`
- Passwords: see `keystore.properties`
- Certificate SHA-256:
  `24:89:DB:F0:8D:31:47:AA:80:2B:C7:66:50:90:57:75:9F:4A:1C:0D:2B:EB:15:21:21:92:C9:8F:65:9F:8F:C6`

**Back this file up.** If it is lost, every installed copy must be uninstalled
before it can be replaced, and all local data goes with it. Losing the key does
not affect over-the-air updates, only new APK installs.

CI refuses to publish an APK that is unsigned or signed by any key other than
this one (`CN=Budgeter`).
