# Fluent UI, React, and Redux: a Practical Learning Path



*October 17, 2026 - article draft*

Building a web portal is not only about putting controls on a page. A table
needs filtering, selection, loading indicators, error handling, and actions
that keep the screen consistent with the server. Before long, the interesting
question becomes: **where does each responsibility belong?**

This article sketches a learning path through React, Microsoft's open-source
Fluent UI, and Redux-style state management. The companion project is a
small, anonymous workshop portal with fictional customers and requests.
It is large enough to demonstrate real interactions, but small enough to
follow a user action from a button click to the backend and back.

The complete demo lives in the adjacent [code folder](./code/).
Start with its [README](./code/README.md) for the runnable walkthrough.

## First, separate the technologies

[Fluent UI Web](https://github.com/microsoft/fluentui) is Microsoft's
open-source collection of React components, web components, and supporting
utilities. This article uses its React library, not the separate Web
Components implementation.

React provides the component and rendering model. Fluent UI supplies controls
and styling tools. Redux introduces a way to organize state transitions around
actions and reducers. They solve related, but different, problems.

The versions and architectural choices in the demo are explicit:

| Layer | What this project uses | Responsibility |
| --- | --- | --- |
| UI composition | React 18.3.1 and TypeScript | Components, props, events, hooks, and rendering |
| Controls and presentation | `@fluentui/react` 8.125.8 | Tables, panels, tabs, commands, themes, and styles |
| Application state | React `useReducer` and a small custom reducer-composition helper | Explicit, immutable state transitions |
| Local backend | Express with in-memory sample data | HTTP operations and validation |
| Contracts | Shared Zod schemas | Runtime validation and inferred TypeScript types |
| Tooling | Vite, Vitest, and Playwright | Development, builds, model/API tests, and browser tests |

**This is a Redux-style example, not an application using the Redux library.**
It does not install `redux`, `react-redux`, or Redux Toolkit. The
[`package.json`](./code/package.json) is the authoritative dependency list.

That distinction is useful for learning: actions and pure reducers can be
understood without introducing a separate store. If the goal is to learn
the Redux ecosystem itself, follow
[Redux Essentials](https://redux.js.org/tutorials/essentials/part-1-overview-concepts).
The Redux maintainers recommend Redux Toolkit for writing Redux applications;
the hand-written infrastructure here is not a replacement recommendation.

There is also an important Fluent version boundary. This demo intentionally
uses **v8**, with APIs such as `DetailsList`, `Pivot`, `ThemeProvider`, and
`mergeStyleSets`. The
[Fluent UI repository](https://github.com/microsoft/fluentui#readme) distinguishes
v8 (`@fluentui/react`) from v9 (`@fluentui/react-components`). Use the
[v8 control documentation](https://developer.microsoft.com/en-us/fluentui#/controls/web)
while reading this project, and explore the
[v9 documentation](https://react.fluentui.dev/) separately. Examples from the
two generations are not interchangeable.

## A learning path, not a list of random tutorials

My starting shortlist is the official React documentation. These are
recommended readings in a deliberate order, not a popularity ranking.
Each step has a small exercise in the demo so reading turns into practice.

| Step | Recommended reading | Apply it to this project |
| --- | --- | --- |
| 1. Learn the everyday syntax | [React Quick Start](https://react.dev/learn) | Recognize components, JSX, props, event handlers, and list rendering in `HomeScreenView.tsx`. |
| 2. Build something small first | [Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe) | Practice immutable updates and passing data and handlers before exploring the portal. |
| 3. Design the state | [Thinking in React](https://react.dev/learn/thinking-in-react) | Identify which values must be stored and which can be calculated from the requests and filters. |
| 4. Learn the types | [Using TypeScript](https://react.dev/learn/typescript) | Read the props and action unions; follow how an operation's `state` determines its available fields. |
| 5. Centralize transitions | [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) | Trace `ActionToggleTheme` through the root reducer without making a network request. |
| 6. Understand side effects | [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) and [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) | Compare initialization/API hooks with the pure filtering functions. |
| 7. Explore the controls | [Fluent UI v8 controls](https://developer.microsoft.com/en-us/fluentui#/controls/web) | Find the props used by `Pivot`, `Panel`, `DetailsList`, and `CommandBar`. |
| 8. Learn actual Redux | [Redux Essentials](https://redux.js.org/tutorials/essentials/part-1-overview-concepts) | Compare this demo with a Toolkit store, slices, React-Redux hooks, and RTK Query. |
| 9. Explore the newer Fluent generation | [Fluent UI React v9](https://react.fluentui.dev/) | Treat a v9 version of one screen as a separate exercise, rather than mixing v9 snippets into v8 code. |

Before step one, be comfortable with JavaScript functions, objects, arrays,
modules, and promises, plus basic HTML and CSS. JSX does not remove the need
to understand the browser; TypeScript does not remove the need to understand
JavaScript.

## Run the portal before reading all the code

The demo's package manifest requires Node.js 20.18 or newer and npm. This is
the sample's minimum engine constraint, not a recommendation to deploy that
particular Node release. From this article's `code` directory, run:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. One Node process serves the mock API and the Vite
development UI. No account, cloud subscription, database, or credentials
are needed.

Try this short tour:

1. Watch the loading indicator. The requests endpoint deliberately waits five
   seconds, making an otherwise fleeting state visible.
2. Open **Customers Filter**, enable filtering, and select Cedar Crafts.
   Switch among **Orders Pending**, **Deliveries Pending**, and **Completed**.
3. Select pending requests and choose **Complete selected** or
   **Reject selected**. Open a request ID to inspect its details panel.
4. Open **Customer settings** from the profile menu, edit the fictional
   preferences, and save. Try the dark-theme toggle as a purely local change.

Both completed and rejected requests appear under the Completed tab, but
retain their individual statuses. Saved request outcomes and customer
settings survive a page refresh because the Node process holds them in
memory. Restarting that process resets the data. Navigation, filters,
theme, and row selection are frontend session state.

This is a loopback-only teaching application, not an internet-facing service.
The notification preference is simulated; it sends nothing.

## Project structure: follow responsibilities

The code is organized by feature, with a small shared presentation layer:

```text
code/
  index.html
  package.json
  src/
    IndexView.tsx
    IndexModel.ts
    IndexInitializationService.ts
    ApplicationStateModel.ts
    ModelBlocks/
    HomeScreen/
    CustomersFilter/
    RequestRecords/
    CustomerSettings/
    PageHeaders/
    UserProfile/
    PresentationBlocks/
    DemoApi/
  shared/
    contracts.ts
  server/
    index.ts
    app.ts
    data.ts
  tests/
    models.test.ts
    client.test.ts
    api.test.ts
    e2e/
      portal.spec.ts
```

[`index.html`](./code/index.html) loads
[`IndexView.tsx`](./code/src/IndexView.tsx), which mounts React and owns the
root `useReducer`. [`IndexModel.ts`](./code/src/IndexModel.ts) adds
initialization state around the application model.
[`ApplicationStateModel.ts`](./code/src/ApplicationStateModel.ts) aggregates
the feature models and coordinates transitions that affect more than one
feature.

Within a feature, the naming tells you where to look:

| Example | Responsibility |
| --- | --- |
| [`RequestRecordsModel.ts`](./code/src/RequestRecords/RequestRecordsModel.ts) | Data, action types, reducers, and pure queries |
| [`RequestRecordsView.tsx`](./code/src/RequestRecords/RequestRecordsView.tsx) | Fluent controls, selection integration, and event dispatch |
| [`RequestOperationService.ts`](./code/src/RequestRecords/RequestOperationService.ts) | Effect hook that executes the requested HTTP operation |
| [`DemoApi.ts`](./code/src/DemoApi/DemoApi.ts) | Fetch calls, response validation, and API error translation |

Here, a file called `Service` contains a hook that talks to the mock API; it
is not another deployed microservice. Views receive `model` and `dispatch`
explicitly through props. There is no hidden Redux provider or global store
to find.

## The central idea: model, action, update, view

The application follows this loop:

```text
UI event
  -> dispatch action
  -> pure reducer produces next model
  -> React renders
  -> effect observes a pending operation
  -> HTTP response dispatches success or failure
  -> reducer produces next model
  -> React renders again
```

The root wiring in [`IndexView.tsx`](./code/src/IndexView.tsx) is small:

```tsx
const [model, dispatch] = React.useReducer(updateIndexModel, undefined, getIndexModelInitial)
```

A model describes state, an action describes an event or intent, and a
reducer decides the next state. A view translates state into controls.
For example, the customer filter's reducer returns a new object when its
panel opens:

```ts
if (action instanceof ActionPanelOpen) return { ...model, panelIsOpened: true }
```

The rest of the branch logic lives in
[`CustomersFilterModel.ts`](./code/src/CustomersFilter/CustomersFilterModel.ts),
not in the panel's rendering code. This makes behavior easier to inspect
without opening a browser.

### Reducer composition has a specific meaning here

[`ModelBlocks/Redux.ts`](./code/src/ModelBlocks/Redux.ts) contains a custom
helper named `combineReducers`. Its implementation is:

```ts
return reducers.reduce((current, update) => update(current, action), state)
```

It runs several update functions **in sequence over the same state shape**.
For example, `updateApplicationStateModel` first updates feature models and
then clears row selection when a customer filter or screen changes.

Do not confuse this helper with
[Redux's `combineReducers`](https://redux.js.org/api/combinereducers), which
combines reducers assigned to separate keys of a state object. The shared
name does not imply identical semantics.

The demo also uses class-based actions and `instanceof`. That is a local
teaching choice, not the usual Redux Toolkit action convention. The
[Redux style guide](https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions)
recommends serializable state and actions, avoiding class instances.
Moving this example to Redux Toolkit would mean revisiting the actions as
well as adding a store, not just installing another package.

## Walk one operation end to end

Consider **Complete selected**:

1. `RequestRecordsView` dispatches `ActionResolveRequested` with the selected
   request IDs and the outcome `Completed`.
2. `RequestRecordsModel.updateOperation` changes the operation to `Running`.
   The existing rows are not optimistically marked as completed.
3. `useRequestOperation` observes that operation and calls `resolveRequests`.
4. The fetch client posts to `/api/requests/resolve` and validates the
   returned records with the shared Zod schema.
5. On success, `ActionResolveSucceeded` replaces the matching rows and
   clears selection. On failure, `ActionResolveFailed` keeps the original
   records and exposes an error message.

The operation is a discriminated union:

```ts
export type RequestOperation =
    | { state: 'Idle' }
    | { state: 'Running', value: Resolution }
    | { state: 'Succeeded', count: number, outcome: Resolution['outcome'] }
    | { state: 'Failed', errorMessage: string }
```

The state carries the information needed for that stage. A running operation
has a request payload; a failed operation has an error message. This avoids
coordinating several unrelated booleans such as `isLoading`, `hasError`, and
`isComplete`.

The [operation hook](./code/src/RequestRecords/RequestOperationService.ts)
creates an `AbortController` and aborts its fetch during effect cleanup.
That helps manage frontend request lifetime; it does **not** guarantee that
an already-received server mutation is undone. A production system would
need its own concurrency and idempotency design.

### Calculate derived data instead of storing another copy

`getRecordsForState` calculates the records for each tab.
`getVisibleRecords` adds the request search filter. The view derives tab
counts and visible rows from those functions rather than maintaining
parallel arrays and counts in state.

This is a concrete application of
[Thinking in React](https://react.dev/learn/thinking-in-react) and
[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect):
if a value can be calculated from existing state, first consider calculating
it during rendering rather than synchronizing another state variable.

Selection is different: it represents user intent and is stored explicitly.
Changing a tab, request search, or customer selection clears it so a later
bulk action does not accidentally target hidden rows.

## What Fluent UI contributes

The demo does not hand-build a table widget, dialog system, or tab control.
[`HomeScreenView.tsx`](./code/src/HomeScreen/HomeScreenView.tsx) composes
`Pivot` and `PivotItem`;
[`RequestRecordsView.tsx`](./code/src/RequestRecords/RequestRecordsView.tsx)
uses `DetailsList` and `CommandBar`; the filter and request details use
`Panel`. `MessageBar`, `ProgressIndicator`, and `Spinner` make loading,
success, and failure visible.

The shared [`PresentationBlocks`](./code/src/PresentationBlocks/) folder
keeps visual decisions separate from request-handling logic:

| File | What to study |
| --- | --- |
| [`PortalTheme.ts`](./code/src/PresentationBlocks/PortalTheme.ts) | Light/dark themes created with `createTheme` |
| [`PortalStyles.ts`](./code/src/PresentationBlocks/PortalStyles.ts) | `mergeStyleSets`, theme colors, typography, focus styles, and responsive layout |
| [`GridLayout.ts`](./code/src/PresentationBlocks/GridLayout.ts) | Shared spacing and layout constants |
| [`FabricIcons.tsx`](./code/src/PresentationBlocks/FabricIcons.tsx) | Locally bundled SVG icons registered under names used by the controls |

The `ThemeProvider` at the root supplies the theme, and child views read it
with `useTheme`. The app has no standalone stylesheet, but it still uses CSS
concepts: flex and grid layout, media queries, selectors, spacing, and
focus treatment.

Using a component library is not proof of accessibility. This sample includes
a skip link, named controls, and selection labels. Keyboard navigation,
screen-reader behavior, contrast, and realistic table sizes still deserve
dedicated review in a production application.

## Keep the backend small, but keep the boundary real

[`shared/contracts.ts`](./code/shared/contracts.ts) defines Zod schemas and
derives TypeScript types from them. The backend validates mutation bodies,
and the frontend validates successful API responses. The distinction is
important: a TypeScript type alone does not validate JSON arriving over HTTP.

[`server/app.ts`](./code/server/app.ts) exposes four operations:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/requests` | Load eight fictional requests, with the artificial delay |
| GET | `/api/customers` | Load three fictional customers and their preferences |
| POST | `/api/requests/resolve` | Complete or reject a batch of pending requests |
| PATCH | `/api/customers/:id` | Save simulated customer preferences |

The bulk operation validates every requested ID before changing any record.
Invalid input returns 400, unknown IDs return 404, and already-resolved
requests return 409. An invalid batch changes no rows in this in-memory demo.
This is not a claim of database transactions or multi-process consistency.

Keeping the API local removes deployment distractions without pretending that
requests cannot fail. The model, client, API, and browser tests are all
included alongside the example.

## Suggested exercises after the walkthrough

Read the source in this order: `IndexView`, `IndexModel`,
`ApplicationStateModel`, one feature's model and view, its operation hook,
then `DemoApi` and `server/app.ts`. Follow one action before trying to
understand every control.

Then try a few bounded changes:

1. Add a derived pending-request count without adding state or an effect.
2. Add a model test proving that changing a customer filter clears selection.
3. Add a new validated preference, following it from the shared contract
   through the server, model, hook, and view.
4. Reimplement one feature with Redux Toolkit, comparing action creators,
   reducer composition, and data fetching with this explicit approach.
5. Rebuild one small view using Fluent UI v9 in a separate experiment.

For the existing checks, run these commands from `code`:

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The takeaway is not that every React application needs Redux or a custom
state framework. It is that a portal becomes easier to reason about when
presentation, state transitions, and external effects have explicit
boundaries. Learn those boundaries first; then choose the libraries that
make them easiest to maintain.
