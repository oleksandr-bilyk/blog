# Calxa - jorney from Desktop to Web Service

For 10 years I led the development team working with [Calxa Australia Pty Ltd](https://www.calxa.com/) on its budgeting and cash flow forecasting software. Moving that software from desktop to web was part of this work. My role was not just to contribute code, but to lead the team through the technical decisions and delivery work behind the transition.

Desktop applications had a substantial head start over web applications. As internet access became commonplace, web applications gained traction and became the dominant way to deliver many kinds of software.

A web application runs through a browser, with its server-side components and data hosted remotely. The browser requests data from the server and presents an interface that users can interact with. Unlike a mostly static website, a web application lets users work with data, change it, and complete tasks.

A desktop application is installed on a laptop or PC, whether downloaded or distributed through installation media. It runs locally and can support offline use without a browser or an internet connection.

## Why migrate from desktop to web?

For me, the reason to migrate has to be a practical benefit for the business and its users, not simply the opportunity to use newer technology. These are the main advantages behind the move to web applications.

**1. Accessibility any time from anywhere**

If your software and files are available only on an office computer, working from somewhere else becomes a problem. A web application makes those documents and tools accessible from wherever you have an internet connection, rather than tying access to a particular installation.

**2. No trouble with updating**

Automatic updates have made desktop software easier to maintain, but some applications still require manual upgrades. With a web application, the team deploys an update centrally instead of asking every user to install it. That saves users time and reduces the effort of distributing new versions.

**3. No special hardware or software needed**

Many businesses buy computers for everyday document processing, not demanding desktop software. A useful product should not be out of reach just because a customer's computer struggles to run it. Web applications move much of that workload to the server, reducing local hardware and installation requirements. Users still need a supported browser and an internet connection, although some applications can also accommodate unreliable connections.

**4. Increased cost-efficiency**

Traditional desktop licensing often meant a substantial upfront purchase. Creative software such as Photoshop is a familiar example of software that could represent a significant investment.

Web applications commonly offer recurring subscriptions, sometimes with short access periods such as a week. For a one-off task or a limited project, paying only for the period you need can be cheaper than buying an expensive desktop application you will rarely use.

## Beyond the "why": leading the technical migration

Moving an established desktop application to the web is not just an interface rewrite. As a technical lead, I look at the architecture, data, and infrastructure together. The team needs a coherent migration approach, not three unrelated workstreams.

### Data migration: protecting the core asset

The data is often more valuable than the application around it. Moving a desktop database, potentially shaped by decades of development, to a web-hosted database requires careful planning. PostgreSQL, MySQL, SQL Server, and NoSQL databases are possible targets, but choosing a database is only the beginning.

* **Schema mapping and transformation:** The old schema reflects the desktop application's history, not necessarily the needs of a scalable web application. The team must map the source and target schemas, identify transformations, clean the data, and decide where normalization is needed. Much of this work is painstaking and manual.
* **Extraction, transformation, and loading (ETL):** A reliable migration extracts the source data, transforms it into the target structure and format, and loads it into the new database. Validation and explicit error handling belong at every step.
* **Downtime strategy:** Business continuity matters as much as the mechanics of moving records. Options range from phased migration in manageable chunks to live migration with careful synchronization between the old and new systems.

### Architecture: making decisions the team can build on

Architecture determines how the application will scale, perform, and evolve. My responsibility as a lead is to help the team make those tradeoffs deliberately rather than carry desktop assumptions into a new environment.

* **Microservices vs. monolith:** A monolithic web application is simpler to start with. Microservices can provide more independent scaling and flexibility, but introduce additional complexity. The decision should follow the application's needs and expected growth.
* **API design and development:** Clean, secure, efficient RESTful APIs expose the functionality the web interface needs. This often means introducing a service layer between the frontend and the backend logic and data.
* **Framework selection:** Backend options include ASP.NET Core; frontend options include React when we tried to build UX remining early [Azure Portal Blades](https://hidekazu-konishi.com/entry/microsoft_azure_history_and_timeline.html). These are examples, not a list of technologies we used at Calxa. The choice affects delivery speed, performance, and the ability to find developers who can maintain the product.

### Infrastructure and deployment: preparing for the cloud

Moving to the web often also means moving to the cloud. That changes how the team provisions infrastructure, handles demand, and releases software.

* **Cloud provider selection:** My expertise was focused around Microsoft and I started using Azure since 2011 developing Calxa Licensing system. I far as I remember, my first book about Azure was from 2009, intoducing basic concepts as compute, storage, BLOB and message queues. Service that I used to host Calxa on was first version of Microsoft Azure .NET SaaS IIS hosting.
* **Scalability and elasticity:** Load balancers, automatic scaling, and managed database services help the application respond to changing demand. The application and its infrastructure must both support that model. We used Azure SQL Servers elastic pools because desktop Calxa was using SQL Server as well.
* **CI/CD pipelines:** Originally we were building Calxa Windows application manually and pushing Calxa Azure services manually as well. In 2013 I ordered [Pro Team Foundation Service](https://www.goodreads.com/book/show/17918999-pro-team-foundation-service). `Team Foundation Service` later was renamed to `Visual Studio Online` and later again become `Azure Dev Ops`. Continuous integration and continuous deployment make frequent, reliable releases possible. That is a significant change from distributing desktop updates and relying on users to install them.

## Preparing the migration

"Culture eats strategy for breakfast" (Peter Drucker / Mark Fields).
Migration didn't start over night but was continious refactoring of above 1.000.000 lines C# where I was author of majority of it.

A migration needs preparation before implementation. Leading this work means giving the team a clear understanding of what exists, what needs to move, and how the transition will be delivered. The biggest chellenge was that I and my team had to develop expertise in field conditions by practicing, discovering system problems and learn how to deal with them. I was buying books from Amazon and spending eventings and all weekends [reading books](https://www.goodreads.com/review/list/58286705-oleksandr-bilyk?ref=nav_mybooks&shelf=read) about programming, SOLID, system design and Service Oriented Architecture. There were nobody to ask an advice because there were no bigger and more challenging project around.

### Evaluating and auditing the legacy system

Start with an inventory of the existing hardware, software, and dependencies. Determine which applications can run in the cloud unchanged and which need modification. Some may contribute too little business value to justify migrating at all. Understanding the connections between systems is essential before changing any of them.

### Discovery

After the audit, examine how the new application will fit into the wider environment. Identify the internal and external integrations it must support. The goal is a durable solution, including compatibility across the browsers and platforms customers use, not simply a desktop interface reproduced in a browser.

### Defining the scope and choosing the technology stack

Define which data and processes belong in the migration, then break the work into manageable pieces. Decide how each piece will move and in what order. A useful plan combines a suitable technology stack, realistic goals, and an explicit assessment of the risks that could prevent delivery.

## Choosing the migration approach

### Moving to the cloud

The migration model should follow an assessment of the current hardware and software, the problems the business needs to solve, and the intended outcome.

Moving to the cloud does not automatically improve a business. A poorly chosen approach can waste money, fail to improve performance, and damage customer trust. For a technical lead, choosing the approach is a delivery and risk decision, not just an infrastructure preference.

### Rehosting

Rehosting, or "lift and shift," moves existing applications and databases from on-premises infrastructure to cloud servers with minimal changes. It is generally the least expensive and least disruptive starting point.

It can suit a business exploring the cloud or working against a tight deadline. Avoiding substantial code changes reduces development and testing effort, although compatibility testing is still necessary.

The limitation is equally important: moving an application does not make it cloud-native or turn it into a web application. Software and data structures that were not designed for cloud services may gain only some of the benefits.

### Replatforming

Replatforming changes selected parts of the code or architecture so the application can make better use of cloud services without a complete rewrite.

It often offers a useful balance between cost and benefit. Targeted changes to the application and its data stores can improve efficiency while keeping implementation time and engineering effort below those of a full rebuild.

### Code refactoring

Refactoring changes the internal structure of the code while preserving its behavior. It requires experienced developers and can take substantial time.

Adapting the application and its data layer for the cloud can provide a stronger long-term foundation: better performance, scalability, security, and room for new features. Those benefits still depend on the quality of the implementation, not the migration label.

## My perspective as a technical lead

I see these approaches as different commitments of engineering effort and risk. Leading a team through migration means making those differences clear.

* **Rehosting:** The code changes least, but the team still has to resolve compatibility, dependencies, and environment configuration. It is often a stepping stone rather than the final destination because it does not fully exploit web capabilities.
* **Replatforming:** Replacing a local reporting service with a cloud-based service or migrating a database requires more development work. The challenge is choosing the components that deliver the greatest benefit with the least disruption, without committing to a full rewrite.
* **Refactoring and rebuilding:** Refactoring can support a migration, but rebuilding an application for the web goes further. It offers the opportunity to improve architecture, performance, and user experience, while creating the largest commitment of time and cost. The team must manage complexity and preserve the capabilities users depend on.

The right choice comes from understanding the legacy architecture, code quality, dependencies, and business goals together.

## Anticipating and managing migration risks

My experience with desktop-to-web development reinforced the importance of addressing risks early. As a lead, I need to make room for this work in the plan rather than leave it until the release is approaching.

* **Legacy code and documentation debt:** A complex, poorly documented application takes time to understand. Prioritize code analysis and documentation before migration or rewriting, using automated analysis tools where they help.
* **Data integrity and consistency:** Validate and reconcile migrated data rigorously. Run multiple test migrations and compare the results with the source. Data corruption is not an acceptable migration tradeoff.
* **Performance bottlenecks:** Network latency, server response times, and database queries introduce different constraints from desktop execution. Design for them early, optimize queries, use caching where appropriate, and monitor performance.
* **Security vulnerabilities:** A web application faces threats that the desktop version may never have been designed to handle. Strong authentication and authorization, secure coding, regular security audits and penetration testing, and encryption in transit and at rest all need attention.
* **User adoption and training:** A technically successful migration still fails if users cannot work effectively with the new interface and workflows. Involve them in design and testing, provide documentation and training, and plan for ongoing support.

## After migration: continuing to lead development

I do not see the migration release as the finish line. The team's work shifts toward operating, maintaining, and improving the web application.

* **Performance monitoring and optimization:** Use application performance monitoring (APM) tools to identify bottlenecks as usage grows, then address them.
* **Security updates and patching:** Keep up with security updates, patches, and vulnerability assessments as threats evolve.
* **Iterative development and new features:** Use the web's faster release cycle to respond to user feedback and improve the product continuously.
* **Scalability management:** Monitor resource consumption and adjust infrastructure to maintain performance and availability as the customer base grows.

## My role in the Calxa migration

For Calxa, a leading provider of budgeting and cash flow forecasting software, accessibility was a central reason to move to the web. Desktop hardware and platform requirements limited who could use the product. The goal was to make its budgeting and forecasting tools available through a browser across customers' devices and platforms.

I worked closely with Calxa and led the development team delivering the web-based version. Under my technical leadership, the team refactored the code and prepared the system for cloud hosting. After the cloud migration, we tested compatibility with popular browsers and devices, added features, and redesigned the interface.

This was a team effort, and my contribution combined hands-on development with technical direction and team leadership. The responsibility was broader than delivering a new interface: it meant guiding the transition while protecting customer data and keeping existing services working.

That is how I approach desktop-to-web migration: lead the technical work, support the people doing it, and keep the customer's ability to use the product at the center of the transition.