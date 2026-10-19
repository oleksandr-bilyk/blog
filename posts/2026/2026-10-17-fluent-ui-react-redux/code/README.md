# Fluent demo

A standalone, anonymous learning portal built with React 18, TypeScript, a
Redux-style model/update/view architecture, Fluent UI React v8 and a small
Node/Express mock backend. It needs no
account, credentials, database, cloud subscription or other application.

All customers, people, identifiers and requests are invented. The app contains
no real customer data, private APIs, company branding or authentication. Icons
are bundled locally from Fluent's public SVG package; there are no runtime CDN,
font, analytics or external API calls. This folder can be copied into its own
repository for a public article or workshop. Retain dependency license notices
and review the content under your normal publication process before publishing.

## Run

Use Node.js 20.18 or newer and npm. From this directory:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. One process serves both the API and Vite development
UI. To choose another port, use `$env:PORT=5180; npm run dev`.

For the built application:

```powershell
npm run build
npm start
```

The server binds to loopback only. This is a local teaching app, not a
production service or internet-facing backend. Stop it with Ctrl+C.

## Walkthrough

1. Opening and refreshing requests deliberately waits **five seconds** on the
   mock API so the Fluent progress bar is visible.
2. Open **Customers Filter**. Turn filtering on, search for invented customers,
   and add/remove them. With filtering off, all customers are included; with it
   on and none selected, no requests are shown.
3. Switch between **Orders Pending**, **Deliveries Pending** and **Completed**.
   The tabs use the ReleaseDefinition, Deploy and Archive Fluent icons.
4. Select pending rows using the checkboxes. **Complete selected** and
   **Reject selected** update all selected rows together. Both outcomes appear
   under Completed, with their individual statuses preserved.
5. Open a request ID to inspect its side panel, or complete/reject one request.
6. In the top-right profile menu, open **Customer settings**. Choose a fictional
   customer, edit fulfillment and demo notifications, then save. These are
   simulated preferences: no message, delivery or notification is ever sent.
7. The dark-theme toggle demonstrates UI state. **VNext Portal enabled** is
   retained as a sample profile preference; it does not change the current layout.

Request outcomes and saved customer settings survive browser refreshes, but
reset when the Node process restarts. Filters, navigation, theme and selection
are session-only application state. Changing a tab/filter/search clears row selection
so a bulk action cannot accidentally target hidden requests. The artificial
delay is configured by `createApp` in `server/app.ts`.

## Follow the state

```text
React event -> typed action -> pure composed reducer -> new model
           -> effect hook -> local HTTP API -> success/failure action
           -> pure composed reducer -> React render
```

| File | Purpose |
| --- | --- |
| `src/IndexView.tsx` / `IndexModel.ts` | Root React reducer, initialization and presentation |
| `src/ApplicationStateModel.ts` | Application state aggregation and reducer composition |
| `src/IndexInitializationService.ts` | Cancellable initialization effect |
| `src/ModelBlocks/Redux.ts` | Small, typed reducer-composition primitive |
| `src/HomeScreen/` | Three-tab screen composed from child views |
| `src/CustomersFilter/` | Customer selection model, actions, reducer and view |
| `src/RequestRecords/` | Request model, table, details panel and operation hook |
| `src/CustomerSettings/` | Settings model, screen and persistence hook |
| `src/PageHeaders/` / `src/UserProfile/` | Header, profile menu and feature flags |
| `src/PresentationBlocks/` | Fluent CSS-in-TypeScript, theme, spacing and SVG icons |
| `src/DemoApi/` | Same-origin fetch client and runtime response validation |
| `shared/contracts.ts` | Shared Zod contracts and TypeScript types |
| `server/app.ts` | Validated mock API, delay and error responses |
| `server/data.ts` | Invented sample data, recreated for each server instance |

The frontend deliberately uses `React.useReducer`, typed action classes and
immutable reducer functions, not Redux Toolkit or a separate Redux store.
Views receive `model` and `dispatch` explicitly. Each feature separates its
model/actions/update functions from presentation; asynchronous work belongs
in effect hooks. The root composes the child models.

Presentation uses Fluent's `mergeStyleSets`, `mergeStyles`, semantic colors,
font tokens and shared spacing constants. There is no standalone stylesheet
or CSS framework. The tab icons and other glyphs are Fluent SVGs.

Set a breakpoint in `updateIndexModel` to inspect typed actions and follow
state transitions. Data is not
optimistically changed: a successful server response updates the model.
Failures stay visible and can be retried without losing the original data.

## Mock API

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/requests` | Eight fictional requests, after the loading delay |
| GET | `/api/customers` | Three fictional customers and demo preferences |
| POST | `/api/requests/resolve` | Atomic update: `{ "ids": ["DEMO-101"], "outcome": "Completed" }` |
| PATCH | `/api/customers/customer-1` | `{ "deliveryMethod": "Delivery", "notificationsEnabled": true }` |

Resolution accepts `Completed` or `Rejected` and only pending requests. Invalid
input returns 400, unknown IDs return 404, and already-resolved items return 409.
An invalid bulk operation updates none of its rows.

## Checks

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit/integration tests cover the mock API, validation, atomic updates, composed
reducers, filters, async failures and settings. Browser tests run the built app on port
5187 and exercise loading, tabs, filters, panels, bulk outcomes, profile menu,
settings persistence, retry, mobile layout and absence of external requests.
Browser-test mutations are isolated in their own server process.
