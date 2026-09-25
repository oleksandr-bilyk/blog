# x100 acceleration: extracting 10,000+ microservices out of a 100,000-line monolith on SOLID and Functional Core Architecture rails

## Thesis

In one PR, I extracted 10,000+ microservices out of a 100,000-line, business-critical, high-complexity monolith. The sub-service is already working in pre-production without bugs.
`x100` may sound like AI hype, but this post is really about [SOLID](https://simple.wikipedia.org/wiki/SOLID_(object-oriented_design)) and [Functional Core Architecture](https://functional-architecture.org/functional_core_imperative_shell/) in its radical form, on steroids. The sub-service/microservice extraction took just 1 day, but similar transformations of other services, even those with less complexity, took at least a few months (x100 longer). 

Instead of slicing the work into tens of PRs that would take months to review, I made one large pull request that would be impossible to review without special "equipment" to guide the reviewer through the code. 

The key ingredients that made it possible are:
1. The new service is a coherent architectural subgraph with the right boundaries and dependency direction.
2. The source monolith must be SOLID and use clean [Functional Core Architecture](https://functional-architecture.org/functional_core_imperative_shell/) without compromises.
3. Microsoft F# was enforcing directed acyclic graph dependencies between modules years before AI became mainstream. Now, it provides stable rails that don't allow AI to produce [AI slop](https://en.wikipedia.org/wiki/AI_slop). 
 
Combined with small modules, algebraic data types, interface-driven composition, pure model logic, 
and isolated side effects, the compiler and project structure make a clean
architecture easier to inspect rather than leaving it as an informal diagram.

The article demonstrates how an original graph, an extracted graph, and a
fixed-layout comparison equipped reviewers to understand the essence of a
10,000+ line change before reading the detailed diff.

## Interactive dependency graphs

Remark: for reasons, I have anonymized all class names but completely preserved the shape of the graph and types of dependencies between its nodes. This will help you understand the key idea without disclosing confidential project details.

### Original monolith subservice dependency graph

The original subservice snapshot retains the broad monolith shape before
unrelated capabilities are removed.

[Open the original Subservice dependency graph in a separate page.](./Subservice-original-tangled-tree.html)

<iframe
  src="./Subservice-original-tangled-tree.html"
  title="Interactive original Subservice dependency graph"
  loading="lazy"
  style="width: 100%; height: 1000px; border: 0;"
  sandbox="allow-scripts"
  allowfullscreen>
</iframe>

### Extracted Subservice dependency graph

The destination view recomputes the layout for the smaller, focused service and
shows its final architecture without the removed nodes.

[Open the extracted Subservice dependency graph in a separate page.](./Subservice-destination-tangled-tree.html)

<iframe
  src="./Subservice-destination-tangled-tree.html"
  title="Interactive extracted Subservice dependency graph"
  loading="lazy"
  style="width: 100%; height: 1000px; border: 0;"
  sandbox="allow-scripts"
  allowfullscreen>
</iframe>

### Fixed-layout extraction comparison

The comparison preserves the original node positions while hiding deleted
nodes, making the retained service visible as a literal architectural subgraph.

[Open the fixed-layout extraction comparison in a separate page.](./Subservice-dependency-comparison.html)

<iframe
  src="./Subservice-dependency-comparison.html"
  title="Interactive fixed-layout Subservice extraction comparison"
  loading="lazy"
  style="width: 100%; height: 1000px; border: 0;"
  sandbox="allow-scripts"
  allowfullscreen>
</iframe>

## 1. The review problem

### Opening

- Start with the experience of opening a pull request above 10,000 lines.
- Explain why line count alone creates cognitive overload.
- A serial diff mixes structural movement, deletion, adaptation, and genuine
  behavior changes.
- The reviewer needs a map before inspecting individual streets.

### Key claim

The first review question should be:

> Did we extract a coherent service boundary?

Only after answering that question should the review focus on:

- whether retained behavior is correct;
- whether deleted behavior is truly outside the new boundary;
- whether adaptations preserve contracts;
- whether the new service can operate independently.

## 2. Extraction is a graph problem

### Monolith and Subservice

- Represent each F# file as a node.
- Represent a compile-time use as a directed edge.
- The original Monolith graph shows all available capabilities.
- The original Subservice snapshot begins with the same broad shape.
- The extracted Subservice keeps the nodes required for one cohesive purpose
  and removes unrelated regions.

### Why file counts are insufficient

- A list of deleted files does not show whether a foundational module was
  removed accidentally.
- A directory diff does not show cross-layer coupling.
- A smaller project is not necessarily a coherent project.
- The retained nodes and edges must still form a valid ordered graph.

### Visual sequence

1. Show the Monolith graph.
2. Show the original Subservice graph before reduction.
3. Show the extracted Subservice graph with an independently computed layout.
4. Show the fixed-layout comparison where retained nodes stay in their
   original positions and removed nodes disappear.

The fourth view communicates the core idea most directly: the service was
extracted as a subgraph.

## 3. Why F# helps

### Ordered compilation

- F# files are compiled in project order.
- A later file may use an earlier file.
- An earlier file cannot silently depend on a later file.
- This gives the project an explicit dependency direction.
- Invalid direction is rejected by the compiler rather than discovered only
  through convention or review.

### The project file as an architectural artifact

- Compile order is more than build configuration.
- It is a machine-checkable statement of which modules are foundational and
  which modules compose them.
- Grouping related modules together makes architectural regions visible.
- A tangled or interleaved order is a signal that responsibilities may not be
  cohesive.

### Important qualification

F# does not automatically create good architecture. A team can still build
large modules, hide side effects, or choose poor abstractions. The advantage is
that disciplined design becomes structurally visible and compiler-constrained.

## 4. Clean architecture made visible

### Model

- Pure and deterministic rules.
- Algebraic data types that make states and outcomes explicit.
- Expected failures represented as data.
- No dependency injection, SDK clients, or hidden side effects.

### Services

- Stateless orchestration and business capabilities.
- Small interfaces and constructor composition.
- Dependencies point toward abstractions.
- Infrastructure SDKs remain outside the layer.

### Infrastructure

- Concrete implementations for storage, messaging, identity, and external
  systems.
- Mapping at the boundary between external representations and model types.
- Side effects isolated behind service contracts.

### WebApi

- Thin delivery and background-execution boundary.
- Request handling, hosting, and scheduling without embedded business rules.
- Composition connects abstractions to implementations.

### Architectural result

These layers are not merely boxes in a slide. They appear as ordered regions in
the graph, and cross-layer dependencies can be inspected directly.

## 5. “SOLID on steroids,” stated carefully

Use the phrase as an attention-grabbing summary, then make a precise claim:

- **Single responsibility:** small modules and focused service components make
  unrelated responsibilities visible.
- **Open/closed:** behavior can be extended through new modules and
  implementations without rewriting foundational model code.
- **Liskov substitution:** interface implementations must honor stable
  contracts.
- **Interface segregation:** narrow contracts limit unnecessary edges.
- **Dependency inversion:** service logic points toward abstractions while
  concrete side effects live later in the graph.

The “steroids” are not language magic. They are the combination of:

- explicit compile order;
- immutable and algebraic modeling;
- small composable modules;
- interface-driven side-effect boundaries;
- a compiler that enforces dependency direction;
- a visualization that exposes the resulting structure to reviewers.

## 6. Equipping the reviewer

### Before reading the diff

The reviewer can answer:

- Which architectural regions remain?
- Which regions were removed?
- Are retained modules still connected?
- Did the extracted service keep accidental capabilities?
- Are important abstractions still foundational?
- Did any layer become an isolated island?

### While reading the diff

Use the graph as an index:

1. Start with modified foundational nodes.
2. Follow their consumers.
3. Inspect boundary adaptations.
4. Review composition and hosting last.
5. Confirm that deletions correspond to intentionally removed graph regions.

### After reading the diff

- Compare the intended boundary with the final graph.
- Confirm that tests cover behavior inside the retained subgraph.
- Validate runtime configuration and operational behavior separately.

## 7. What the visualizations prove—and what they do not

### They help prove

- Compile-order validity.
- Structural coherence.
- Dependency direction.
- Relative reduction in scope.
- Which nodes and edges survived the extraction.
- Whether the destination is an actual subgraph of the original architecture.

### They do not prove

- Behavioral equivalence.
- Correct production configuration.
- Security properties.
- Performance characteristics.
- Operational readiness.
- Adequate test coverage.

The graph is a review accelerator, not a replacement for engineering evidence.

## 8. Publication and anonymization note

- The article uses the fictional names `Monolith` and `Subservice`.
- All lower-level folders and F# modules use deterministic fictional aliases.
- The four architecture layer names remain because they are essential to the
  teaching example.
- File IDs, edges, edge kinds, counts, and comparison states remain unchanged.
- The exact anonymized topology is intentionally preserved, so the diagrams
  still communicate the real extraction shape.
- Revision identity, repository paths, organization names, and product-specific
  terminology are removed.

## 9. Conclusion

A 10,000+ line pull request becomes reviewable when its architectural intent is
made explicit.

The most important artifact was not another prose description of the refactor.
It was a graph that let the reviewer see the claim: the new service is a
coherent subgraph extracted from a larger system.

F# compile order supplied the structural truth, clean architecture supplied the
boundaries, and visualization supplied the shared language between author and
reviewer.

## Suggested figures

1. **Monolith overview** — full anonymized dependency graph.
2. **Original Subservice** — broad pre-reduction graph.
3. **Extracted Subservice** — compact destination layout.
4. **Fixed-layout extraction comparison** — retained, modified, and removed
   nodes in original coordinates.
5. **Layer detail** — a cropped example showing Model, Services,
   Infrastructure, and WebApi dependency direction.

## Suggested pull quotes

> A large service extraction is a graph transformation disguised as a code
> diff.

> The reviewer did not need to infer the architecture from 10,000+ changed
> lines; the architecture was visible before the first detailed comment.

> F# does not guarantee SOLID, but it can make dependency direction impossible
> to ignore.
