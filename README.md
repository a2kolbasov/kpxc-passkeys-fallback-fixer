# KeePassXC-Browser - Passkeys fallback fixer

A proxy add-on that resolves WebAuthn (passkeys) authentication fallback failures with KeePassXC by holding API calls until the page regains focus.

## Issue description

<https://github.com/keepassxreboot/keepassxc-browser/issues/2493>

When using KeePassXC to select a passkey, the current browser tab always loses focus. The problem arises due to the behavior of different operating system window managers: the response from KeePassXC may be returned **before** the browser tab regains focus.

In such cases, Firefox blocks calls to the native Web Authentication API methods (`navigator.credentials.create` and `navigator.credentials.get`), as these calls originate from a page that is (still) considered out of focus by the browser. This leads to authentication failures using an external security token - such as a YubiKey or similar hardware key.

## Current status & workaround

I have developed and submitted a patch to address this issue. The KeePassXC project maintainers have reviewed the patch, but have not accepted it and have not proposed any alternative solutions.

To bridge this gap, I've created this browser add-on as a temporary solution. It will remain useful until either:
* my patch is accepted and released in the official KeePassXC-Browser builds
* or somebody implements an alternative fix for this problem.

## How this add-on works

This add-on functions as a proxy layer between the browser’s native WebAuthn API and KeePassXC-Browser plugin. Its operation can be broken down into the following steps:

1. The add-on hooks into the native `navigator.credentials` methods before the KeePassXC-Browser plugin initializes and performs its own interception.
2. Once KeePassXC-Browser starts up, it detects and overrides the `navigator.credentials` interface. However, it now interacts with the methods intercepted and managed by this add-on, unaware of the intermediate layer.
3. If the user proceeds with the authentication flow (e.g., creates a new credential or signs the request successfully), this add-on remains completely inactive. It has no knowledge of or involvement in the successful authentication process - the flow continues directly between KeePassXC-Browser and the website requesting authentication.
4. The add-on becomes active only in the fallback scenario: when the user explicitly declines the authentication request. In this case, KeePassXC returns control to the browser, and this add-on waits for the page to regain focus before allowing the native API call to proceed, compensating for the focus-related timing issue.
