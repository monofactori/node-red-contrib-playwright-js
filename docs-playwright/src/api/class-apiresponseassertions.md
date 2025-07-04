# class: APIResponseAssertions
* since: v1.18

The [APIResponseAssertions] class provides assertion methods that can be used to make assertions about the [APIResponse] in the tests.

```js
import { test, expect } from '@playwright/test';

test('navigates to login', async ({ page }) => {
  // ...
  const response = await page.request.get('https://playwright.dev');
  await expect(response).toBeOK();
});
```

## property: APIResponseAssertions.not
* since: v1.20
* langs: js
- returns: <[APIResponseAssertions]>

Makes the assertion check for the opposite condition. For example, this code tests that the response status is not successful:

```js
await expect(response).not.toBeOK();
```

## async method: APIResponseAssertions.toBeOK
* since: v1.18
* langs: js

Ensures the response status code is within `200..299` range.

**Usage**

```js
await expect(response).toBeOK();
```
