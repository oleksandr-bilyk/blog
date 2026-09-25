# Alex Bilyk - Right Solutions for True Ideas

My name is Alex Bilyk, and this is my professional blog. Here, I write about programming, software development, and architecture.

My professional [book list at Goodreads](https://www.goodreads.com/review/list/58286705-oleksandr-bilyk?ref=nav_mybooks&shelf=read)

## Pinned Posts

* [From Service Fabric to App Service](./posts/2021/2021-06-30-from-service-fabric-to-app-service/index.md)
* [Make Your Own Neural Network with F#](./posts/2017/2017-12-14-make-your-own-neural-network-with-fsharp/index.md)
* [Windows Application Block](./posts/2017/2017-06-04-windows-application-block/index.md)

### 2026

* [x100 acceleration: extracting 10,000+ microservices out of a 100,000-line monolith](./posts/2026/2026-09-25-service-extraction-equipment/)
In one PR, I extracted 10,000+ microservices out of a 100,000-line, business-critical, high-complexity monolith. The sub-service is already working in pre-production without bugs.
`x100` may sound like AI hype, but this post is really about [SOLID](https://simple.wikipedia.org/wiki/SOLID_(object-oriented_design)) and [Functional Core Architecture](https://functional-architecture.org/functional_core_imperative_shell/) in its radical form, on steroids.

### 2022

* [Semantic Versioning](./posts/2022/2022-07-02-retry-policy/index.md)
The golden standard for retry logic according to "Service Reliability Engineering" (Google SRE) book made functional.

### 2021

* [Semantic Versioning](./posts/2021/2021-12-21-semantic-versioning/index.md)
Semantic Versioning is recommended as the default strategy for software product versioning in any software company. I have compiled a learning path for .NET developers.

* [Secret Arch](./posts/2021/2021-10-04-secret-arch/index.md)
Azure Key Vault is a service provided by Azure for securely storing secrets. Imagine a scenario where we need to remove secrets after expiration, a feature that Key Vault does not offer. Designing a Key Vault decorator service that supplements these missing features would be highly beneficial.

* [Explicit Contract Culture](./posts/2021/2021-10-02-explicit-contract-culture/index.md)
When integrating products and services, it is advantageous to have explicit data contracts rather than implicit ones. Dedicating time and effort to extract explicit data contracts is a worthwhile investment for maintainability.

* [F# Lazy Expiration](./posts/2021/2021-02-13-fsharp-lazy-expiration/index.md)
This article compares OOP and functional approaches to one resource-usage problem.

* [From Service Fabric to App Service](./posts/2021/2021-06-30-from-service-fabric-to-app-service/index.md)
Service Fabric is an incredibly powerful PaaS that, despite not being polished by the open-source community, offers a robust experience. The article narrates the journey of migrating several microservices from Service Fabric to App Service, highlighting the importance of the dependency inversion principle in creating platform-agnostic solutions.

* [Http Client Factory](./posts/2021/2021-02-14-http-client-factory/index.md)
This article describes HttpClientFactory best practices. Ignoring network connection allocation recommendations causes networking issues on Azure App Service and elsewhere.

### 2017
* [Make Your Own Neural Network with F#](./posts/2017/2017-12-14-make-your-own-neural-network-with-fsharp/index.md)
This article translates the neural network from Tariq Rashid's *Make Your Own Neural Network* into F#. It explores weight matrices, forward queries, recursive backpropagation, lazy MNIST processing, training epochs, image augmentation, recognition performance, and reverse queries that generate digit pareidolia.

* [Windows Application Block](./posts/2017/2017-06-04-windows-application-block/index.md)
My first open-source repository and article. In 2017, I was preparing for the MCSD Windows Application Builder certification and, after more than ten years of desktop development, was very excited about the Windows 10 UWP platform. The article provides an in-depth analysis of the application lifecycle, dependency injection, and navigation. It was an attempt to build a solid application block for advanced UWP MVVM scenarios, including dependency injection with .NET Native without using DI containers.