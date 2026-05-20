/*
  KeePassXC-Browser - Passkeys fallback fixer

  Copyright © 2026 Aleksandr Kolbasov

  SPDX-License-Identifier: GPL-3.0-only

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, version 3.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

"use strict";

/**
 * @returns {Promise<void>}
 */
function waitForFocus() {
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#promise_cloning
  return new window.Promise((resolve) => {
    if (document.hasFocus()) {
      return resolve();
    }
    console.debug("Waiting for focus");
    let resolved = false;

    function onFocus() {
      if (resolved) return;
      resolved = true;

      console.debug("Wait ended");
      resolve();
    }

    document.addEventListener(
      "focus",
      onFocus,
      { capture: true, passive: true, once: true }
    );

    // if the user is not going to return soon (has switched to another tab)
    setTimeout(onFocus, 15_000);
  });
}

const originalFunctions = {
  create: wrappedJSObject.navigator.credentials.create.bind(wrappedJSObject.navigator.credentials),
  get: wrappedJSObject.navigator.credentials.get.bind(wrappedJSObject.navigator.credentials),
};

/**
 * @param {keyof typeof originalFunctions} property
 */
function handler(property) {
  return exportFunction(
    (...args) => {
      return waitForFocus().then(() => {
        return originalFunctions[property]?.(...args);
      });
    },
    window,
  );
}

wrappedJSObject.navigator.credentials.create = handler("create");
wrappedJSObject.navigator.credentials.get = handler("get");
