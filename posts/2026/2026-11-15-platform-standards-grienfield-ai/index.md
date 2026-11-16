# A Platform and Standards for Your Greenfield Project

A platform mindset means building standard solutions to common problems. Every platform bears the imprint of its creators' principles and personalities. The challenge of building any opinionated platform is that there will always be someone who criticizes it and believes they know how to do things differently or better.
In this article, I will describe my vision and experience of building a platform and the different aspects it brings together.

I try to think proactively about the different aspects of the systems whose development I lead. With AI, we now have a great opportunity to bring more of these aspects together in a single platform.

This is the story of a platform with more than 10+ microservices hosted on [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/what-is-aks).

First, let's answer the question: why AKS rather than Azure Web Apps, Azure Functions, Azure Container Apps, or [Service Fabric](../../2021/2021-06-30-from-service-fabric-to-app-service/)?
Companies that choose Kubernetes usually have a couple of reasons:
1. Cloud portability: an application developed to run in one cloud can also be hosted in another.
2. Scalability: Kubernetes is the de facto standard for Linux container orchestration.

If you want to learn more about Kubernetes, read [Kubernetes: Up and Running: Dive into the Future of Infrastructure](https://www.amazon.com/Kubernetes-Running-Dive-Future-Infrastructure/dp/109811020X/ref=sr_1_1).

If contributing to software hosted on Kubernetes has left you with a few psychological scars, you may appreciate articles such as [The Tyranny of the Unnecessary: How Kubernetes Empowers the Incompetent](https://www.linkedin.com/pulse/tyranny-unnecessary-how-kubernetes-empowers-incompetent-gary-yang-aci7e/).

But a platform is not just PaaS. It reflects the technical leadership of those who build and contribute to it. In this article, I will describe the platform I build for Microsoft services at the core of Microsoft Azure. This article links only to public documentation.

We will briefly cover a few aspects:
1. A fleet of AKS clusters and GitOps.
2. Cell architecture for meeting high service-level objectives (SLOs).
3. Platform standards.

Solutions designed to deliver value quickly on a stable foundation can benefit from being hosted on the platform.

## Fleet and GitOps
The platform runs on a set of AKS clusters joined to a [fleet](https://learn.microsoft.com/en-us/azure/kubernetes-fleet/overview).
Microservices are deployed to these clusters using [GitOps with Flux v2](https://learn.microsoft.com/en-us/azure/azure-arc/kubernetes/tutorial-use-gitops-flux2?tabs=azure-cli).

A key outcome: AKS Fleet uses open-source [KubeFleet](https://kubefleet.dev/docs/) [staged update gates](https://kubefleet.dev/docs/concepts/staged-update/) to support first-party (1P) compliance and [Safe Deployment Practices (SDP)](https://azure.microsoft.com/en-us/blog/advancing-safe-deployment-practices/).

## Cell Architecture
Modern [SDP](https://azure.microsoft.com/en-us/blog/advancing-safe-deployment-practices/) requires a cellular architecture. A good example is described in [Slack’s Migration to a Cellular Architecture](https://slack.engineering/slacks-migration-to-a-cellular-architecture/).

Platform microservices must be built for a cellular architecture:
- They MUST NOT have singletons or single points of failure.
- They must avoid correlated failure modes across cells.
- Deployments must be staged, treating each cell as a unit of isolation.
- Secrets, certificates, keys, and similar resources MUST NOT be shared across cells.
- Each cell must have its own state and database. Cells MUST NOT share any state, to minimize the blast radius.
- Gateways that manage client-to-cell affinity MUST also support a cellular architecture and be able to update affinity through eventually consistent event sourcing (e.g., Azure Cosmos DB with multi-region writes for inserts and eventually consistent reads).

## Platform Standards

Standards are guardrails that allow us to move faster while protecting against low-quality work:
1. Backend languages are the first line of defense against developer mistakes and AI slop. Languages such as F# and Rust emphasize stability through strong type systems, catching bugs at compile time, preventing data corruption and concurrency issues, and enabling expressive, highly modular code.
2. Web frontend languages and frameworks: TypeScript, React, Redux, and Fluent UI React v9. All microservices may have a web UI for operational transparency, but they must use [Microsoft Fluent UI](https://fluent2.microsoft.design/).
3. The “no haunted graveyard” rule: all components must keep their package dependencies and frameworks up to date. This is taken from [Software Engineering at Google](https://www.amazon.com/Software-Engineering-Google-Lessons-Programming-ebook/dp/B0859PF5HB/ref=sr_1_1).
4. Backend service code composition: SOLID principles and Clean Architecture with a functional core. All services MUST follow this approach, which is essential for agile development.
5. SOA and microservice design principles MUST apply to all services: integration happens only through API contracts. Services may change their languages and frameworks while keeping their contracts stable.
6. Semantic versioning: all microservices MUST use [semantic versioning](../../2021/2021-12-21-semantic-versioning/index.md).
7. All services export telemetry using [OpenTelemetry](https://opentelemetry.io/). The telemetry infrastructure includes [Azure Monitor workspaces](https://learn.microsoft.com/en-us/azure/azure-monitor/metrics/azure-monitor-workspace-overview), data collection endpoints, and [data collection rules](https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/data-collection-rule-overview), with [Managed Prometheus](https://learn.microsoft.com/en-us/azure/azure-monitor/metrics/prometheus-metrics-overview), [Managed Grafana](https://azure.microsoft.com/en-us/products/managed-grafana/), and [Log Analytics](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-overview?tabs=simple). Each service MUST emit telemetry to the central endpoints.
8. A standard set of telemetry across microservices: client APIs, background jobs, and downstream dependencies. Each service MUST emit standard metrics for visualization on a shared dashboard and should avoid introducing custom metrics when operations can be represented by standard metrics.

If a platform is built well, hosting services on that opinionated platform is a privilege. AI can help maintain discipline and support the understanding and evolution of standards. When we introduce a standard, we apply it to every service on the platform. That is how the benefits are realized.
