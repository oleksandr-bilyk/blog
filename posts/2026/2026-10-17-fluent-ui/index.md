# Fluent UI - user experience, design language, and functional programming

## Woodworking

My father a gifted craftsman, part of a generation of people who could do everything from building a house to tinkering with electronics. From a young age, he inspired me with his high-quality woodworking. My father taught me that craftsmanship becomes valuable through attention to detail. I remember opening a book about woodworking and finding that the first chapter was about keeping the workbench clean and tools sharp.

![Woodworking](./assets/woodworks.png)

Later, I found this wisdom echoed in the childhood experiences described in Walter Isaacson's biography of [Steve Jobs](https://www.goodreads.com/book/show/11084145-steve-jobs). 

![wpf](./assets/steve_jobs_walter_isaacson.png)

Jobs's love of aesthetics began with a lesson he learned in childhood, when his father explained why, when crafting a wooden wardrobe, it was important to polish even the hidden surfaces that people would not see. Polishing hidden parts is not about the fear that somebody will discover an unfinished surface, but a spiritual practice that becomes part of your identity: knowing that everything was done properly and that you can be proud of it no matter what.

## Desktop

My experience with serious, production UI development began when I was leading development at [Calxa](https://www.calxa.com/). Windows desktop apps had to look shiny, with Vista glass effects whose gradient calculations were extremely computationally expensive. It was a time when even cash flow and budget forecasting software had to look like a piece of art or an expensive luxury car with multiple layers of paint. I remember when my wife and I were young, lying in bed, selecting WPF pixel shader effects for GPU-accelerated animated transitions between financial data screens. As crazy as that may sound, it was a time when presenting financial results as animated car speedometers was considered impressive. We built our desktop software with Windows Presentation Foundation (WPF), using the [Model-View-ViewModel (MVVM)](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm) pattern.

![wpf](./assets/wpf.png)

Over a decade ago, I was enthusiastically studying the [User Experience Interaction Guidelines (Windows 7, Vista)](./assets/windows_user_experience_interaction_guidelines_windows_7_vista.pdf) to get Windows Logo certification for the software we were developing. I remember creating short memos for those who didn't have the patience to read 900 pages of guidelines. This deepened my understanding: the UI enthusiasts around me and I started to see not just a way to impress customers, but a methodical system grounded in deep expertise. Windows, layout, text, controls, links, tooltips, progress bars, prompts, notifications, keyboard and mouse interactions, dialog boxes, wizards, error and warning messages, icons, help - these things have been modernized, but design language and user experience patterns still serve the same goal. 
Many concepts from "User Experience Interaction Guidelines" are still relevant:

![iPad menu bar](./assets/windows_dialog_ok_cancel_yes_no.png)

 
I remember once having dinner with a guy who was a big fan of the MacBook, and he mentioned that Apple also has [Human Interface Guidelines for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos). Here, for example, is the [menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar), demonstrating the excellence of Jobs's legacy on the iPad.

![iPad menu bar](./assets/mac_menu_bar.png)
 
 
As the years passed, Windows Phone and Windows 8 introduced [Metro UI](https://en.wikipedia.org/wiki/Metro_(design_language)), which moved from Windows Vista's elaborate chrome to the opposite extreme: "content before chrome".
During Windows 8 Surface presentation, Steven Sinofsky [Windows 8 gadget was broken during presentation](https://www.youtube.com/watch?v=4QRWa68MtLc). My team bought one of first Windows 8 ThinkPad devices with 2GB of RAM that was impossible to use that was incredibly contrasting with incredibly smooth iPad with gradient UI components with 500 MB of RAM.
 
![](./assets/windows_8_calculator.png)
 
The Windows Phone content hub was a creative approach, but it simply wasn't as ergonomic as the iPhone or Android.
 
![](./assets/windows_phone_hub.png)

## Web

My journey into serious web development began in 2014, during the boom in JavaScript libraries and frameworks built on HTML5 and CSS3. When I [started thinking about redesigning our desktop software for the web](../../2017/2017-01-01-calxa-desktop-to-web/), we were choosing between Angular and React.

I pushed my team to use React because it felt leaner and more focused. At the time, I strongly believed in SOLID's Single Responsibility Principle, and React's focus on the UI appealed to me.

React also has roots in functional programming. Its creator, Jordan Walke, wrote an early prototype in OCaml, a language with a strong functional programming tradition, before porting it to JavaScript. In 2016, he created [ReasonML](https://en.wikipedia.org/wiki/Reason_(programming_language)), which gives OCaml a JavaScript-like syntax.

Elm took a different path: it is a purely functional language for building web frontends, not a React library. Its Model-View-Update pattern, known as The Elm Architecture, helped inspire Redux, a widely used state management library in the React ecosystem. After years of using MVVM with WPF and the [Universal Windows Platform](../../2017/2017-06-04-windows-application-block/), separating state and presentation already felt natural to me.

Today, I'm working on the transformation of Microsoft's largest CI/CD pipelines service. It supports 100,000 pipelines, runs 100,000 builds and 20,000 releases per day, and uses more than 800,000 VMs and container agents daily, serving 50,000 developers at Microsoft.

By 2026, I'm the main F# developer in Azure Release services, where I've authored hundreds of thousands of lines of F#. F# is a .NET language with roots in OCaml. It's amazing how expertise and design principles can connect across different domains.

You can find a demo web application built with React, Redux, and Fluent Web [on my GitHub](./code/).

### React and Redux

React is [the library for web and native user interfaces](https://react.dev/learn).
Originally, React components representing blocks of HTML were written as classes.
Modern React favors function components.

``` jsx

function MyButton() {
  return (
    <button>
      I'm a button
    </button>
  );
}

export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
    </div>
  );
}

```

In our demo app and production services, we extract state logic into a [reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer).

Components with many state updates spread across many event handlers can get overwhelming. For these cases, you can consolidate all the state update logic outside your component in a single function, called a reducer.

``` ts
export function updateIndexModel(model: IndexModel, action: IndexAction): IndexModel { 
    return model // TODO: use action to update model
}

```

We need to model state, and for this purpose, we'll use the methodology from [Domain Modeling Made Functional](https://www.amazon.com/dp/1680502549/?bestFormat=true&k=domain+modeling+made+functional).

![](./assets/domain_modeling_made_functional.png)

This functional approach to domain modeling uses algebraic data types, such as record types and discriminated unions.

Let's look at record types in TypeScript, F#, and Rust.

**TypeScript**
``` ts
type IndexModel = {
    initializable: IndexInitialization,
    application: ApplicationStateModel,
    lastAction: string,
}
```

**F#**
``` fsharp
type IndexModel = {
    initializable: IndexInitialization
    application: ApplicationStateModel
    lastAction: string
}
```

**Rust**
``` rust
type IndexModel = {
    initializable: IndexInitialization,
    application: ApplicationStateModel,
    lastAction: String
};
```

Let's look at discriminated union types in TypeScript, F#, and Rust.

**TypeScript**
``` ts
type IndexInitialization =
    | { state: 'Initializing', version: number }
    | { state: 'Initialized', version: number }
    | { state: 'Failed', version: number, errorMessage: string }
```

**F#**
``` fsharp
type IndexInitialization =
    | Initializing of version: number
    | Initialized of version: number
    | Failed of version: int * errorMessage: string
```

**Rust**
``` rust
enum IndexInitialization {
    Initializing { version: u32 },
    Initialized { version: u32 },
    Failed { version: u32, error_message: String },
}
```

Let's declare a type for the application state:
``` ts
type IndexModel = {
    initializable: IndexInitialization,
    application: ApplicationStateModel,
    lastAction: string,
}
```
and a function that constructs the initial state:
``` ts
function getIndexModelInitial(): IndexModel {
    return {
        initializable: { state: 'Initializing', version: 0 },
        application: getStateInitial(),
        lastAction: 'Initializing',
    }
}
```

As mentioned above, we use record types and discriminated unions to model state with a **functional** approach. These are common patterns across TypeScript, F#, and Rust.

However, for React Redux action types, we use TypeScript **classes**, which let us distinguish actions at runtime using `instanceof`.
``` ts
export class ActionIndexInitializationRequested { }
export class ActionIndexInitialized { constructor(public readonly value: InitializationData) { } }
export class ActionIndexInitializationFailed { constructor(public readonly errorMessage: string) { } }
export type IndexAction =
    | ApplicationAction 
    | ActionIndexInitializationRequested 
    | ActionIndexInitialized 
    | ActionIndexInitializationFailed
```

Putting this together, here's the reducer function from the demo's [IndexModel.ts](./code/src/IndexModel.ts):
``` ts
export function updateIndexModel(model: IndexModel, action: IndexAction): IndexModel {
    const lastAction = action.constructor.name
    if (action instanceof ActionIndexInitializationRequested) {
        if (model.initializable.state === 'Initializing' ||
            model.application.screens.home.operation.state === 'Running' ||
            model.application.screens.customerSettings.operation.state === 'Running') return model
        return {
            ...model,
            initializable: { state: 'Initializing', version: model.initializable.version + 1 },
            lastAction,
        }
    }
    else if (action instanceof ActionIndexInitialized) {
    ...
}
```

Using reducers, we can build fairly complex UIs, like the one in our demo:

![](./assets/main_screen_dark.png)

### Microsoft Fluent Web

Microsoft's `Office` organization (internally known as `M365` or just `Copilot` since 2026) is a fast-moving, dynamic organization that has standardized web development around [Fluent Web](https://developer.microsoft.com/en-us/fluentui#/) and the newer [Fluent Web 2](https://fluent2.microsoft.design/).

Using a design language is important because, like a human language, it has nouns (components), verbs (interaction patterns), and adjectives (styles and typography). Now, with AI, we can create web UIs for our backend services in minutes. Being able to give them a professional look and feel is a powerful capability.

### Fluent Web v8
Microsoft's Office organization open-sourced the Fluent Web framework it used to build its own UIs.
I started using Fluent UI in 2019, and as I write this article, v8 is on the [path to deprecation](https://developer.microsoft.com/en-us/fluentui#/controls/web).
As I mentioned earlier, I approached Fluent Web with a background in Windows UI development. I was looking for patterns that would help me build a modern, polished, consistent, and accessible web portal for my service. It was a great way to get started with React, typography, theming, styling (CSS in TypeScript), and a rich set of components.

It was good to see that the component documentation included best practices and source code demonstrating different configuration options.
For example, the [Search Box](https://developer.microsoft.com/en-us/fluentui#/controls/web/searchbox) component page includes best practices and examples:
* Layout: `Don't build a custom search control based on the default text box or any other control.`
* Content: `Use placeholder text in the search box to describe what people can search for. For example, "Search", "Search files", or "Search contacts list".`
* Samples: `Web: Search a web index. Results include pages, entities, and answers.`
* Theme: see how the component looks in dark and light themes.
* Show code: TypeScript source code you could copy and paste into your app before AI tools became available.

![](./assets/fluent_web_v8_search.png)

### Fluent v2 (Fluent Web v9)

All modern Office products use Fluent Web v9, which is also open source.
Fluent Web v9 is slimmer, faster, and generally better organized.
* https://fluent2.microsoft.design/ - a portal that introduces key concepts and inspires you to start creating.
* https://github.com/microsoft/fluentui - source materials and training videos.
* https://storybooks.fluentui.dev/react/ - a component catalog that includes best practices.

## Conclusion

Building UIs, like building anything people interact with, begins with curiosity. Even when AI can generate so much, we still need to learn and care about the fundamentals to build complex things.

"Design is not just what it looks like and feels like. Design is how it works." (Steve Jobs)