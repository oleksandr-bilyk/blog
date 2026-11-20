# Event Sourcing Functional on F# and Rust

Pros and cons of Event Sourcing according to lerning materials listed below:
## Reasons to use Event Sourcing and CQRS
1. Smooth transition from DDD & Event Storming to implementation.
1. Audit, Debuging, Hostoric State, Alternative state
1. Reduce service coupling.
1. Break Read versus Write performance bottleneck.
1. Elevate concurrency barrier.
1. Simplify and harden messages. 
    1. No need to categorize messages by maybe-once, at-least-once, exactly-once.
    1. No care about idempotent logic.
    1. No need to care about transaction in event subscriber (e.g. message transfer from Kafka to database)
1. A key feature of an event store implementation should be that it offers a way to guarantee consistency between the events that it stores and the events that the bounded context publishes to other bounded contexts.
### Event Sourcing issues
* Unfamiliar. Event sourcing projects fail because of developer competence.
* Read models are eventually consistent.
* Complicated versioning.

# Event Sourcing and CQRS (patterns of event driven architecture).
In 2021 on one of premortem meetings [John Socha-Leialoha](https://www.linkedin.com/in/john-socha-leialoha-963150/) recommended to look at CQRS/Event Sourcing for better document model design. I had to make a research how Event Sourcing and CQRS may be combined with event driven architecture for business critical service tenant implementation in Azure.

## Conference Videos
1. [The Many Meanings of Event-Driven Architecture • Martin Fowler • GOTO 2017](https://www.youtube.com/watch?v=STKCRSUsyP0)
1. [GOTO 2014 • Event Sourcing • Greg Young](https://www.youtube.com/watch?v=8JKjvY4etTY)
1. [Why Event Sourced Systems Fail [eng] / Greg Young](https://www.youtube.com/watch?v=FKFu78ZEIi8)
1. [7 Reasons why your microservices should use Event Sourcing & CQRS - Hugh McKee](https://www.youtube.com/watch?v=wBvH7foXXUY)
1. [Event Sourcing   You are doing it wrong by David Schmitz](https://youtu.be/GzrZworHpIk)
## Books
1. ["Domain Modeling Made Functional" by Scott Wlaschin](https://learning.oreilly.com/library/view/domain-modeling-made/9781680505481/)
1. ["Exploring CQRS and Event Sourcing" (Microsoft patterns & practices)](https://www.amazon.com/Exploring-Sourcing-Microsoft-patterns-practices-ebook/dp/B00EUGIRQY/ref=sr_1_2?dchild=1&keywords=event+sourcing&qid=1626804788&s=books&sr=1-2)
1. ["Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions" by by Gregor Hohpe and Bobby Woolf](https://learning.oreilly.com/library/view/enterprise-integration-patterns/0321200683/)
2. [Designing Data-Intensive Applications](https://learning.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/)

To see sample of modelling [Incident Management system on F#](IncidentManagement.fsx).
``` fsharp
open System

module Semi =
    type IncidentSeverity =
        | Low
        | Medium
        | High
        | Critical

module Events =
    type EventCreatedDetails = {
        Title: string
        Description: string
        Severity: Semi.IncidentSeverity
    }

    type Event =
        | Created of EventCreatedDetails
        | Resolved of {| Comment: string |}
        | Mitigated of {| Comment: string |}
        | SeverityChanged of Semi.IncidentSeverity
        | Acknowledged of {| User: string |}
        | CommentAdded of {| User: string; DateTimeUtc: DateTime; Text: string |}

module State =
    
    type CommentItem = {
        User: string
        DateTimeUtc: DateTime
        Text: string
    }

    type Status =
        | Active
        | Mitigated
        | Resolved

    type IncidentView = {
        Title: string
        Description: string
        Severity: Semi.IncidentSeverity
        Status: Status
        AcknowledgedBy: string option
        Comments: CommentItem list
    }

    let newIndidentView (eventDetails: Events.EventCreatedDetails) =
        {
            Title = eventDetails.Title
            Description = eventDetails.Description
            Severity = eventDetails.Severity
            Status = Status.Active
            AcknowledgedBy = None
            Comments = []
        }

    let evolve(state: IncidentView option) (event: Events.Event): IncidentView option =
        match state, event with
        | Some state, event -> 
            let state =
                match event with
                | Events.Resolved detail -> 
                    { state with Status = Status.Resolved }
                | Events.Mitigated detail -> 
                    { state with Status = Status.Mitigated }
                | Events.SeverityChanged severity -> 
                    { state with Severity = severity }
                | Events.Acknowledged detail -> 
                    { state with AcknowledgedBy = Some detail.User }
                | Events.CommentAdded detail -> 
                    { state with Comments = { User = detail.User; DateTimeUtc = detail.DateTimeUtc; Text = detail.Text } ::state.Comments }
                | Events.Created _ -> state
            Some state
        | None, Events.Created details -> 
            Some (newIndidentView details)
        | None, _ -> failwith "Incident not created"

module Commands =

    type Command =
        | Create of {| Title: string; Description: string; Severity: Semi.IncidentSeverity |}
        | Resolve of {| Comment: string |}
        | Mitigate of {| Comment: string |}
        | ChangeSeverity of Semi.IncidentSeverity
        | Acknowledge of {| User: string |}
        | AddComment of {| User: string; Text: string |}

    let decide(command: Command) (state: State.IncidentView option): Events.Event list =
        match command, state with
        | Create details, None -> 
            [ 
                Events.Created {
                    Title = details.Title
                    Description = details.Description
                    Severity = details.Severity } 
            ]
        | command, Some state -> 
            match command with
            | Create _ -> [] // ignoring because incident is already created
            | Resolve details -> 
                [ Events.Resolved {| Comment = details.Comment |} ]
            | Mitigate details -> 
                [ Events.Mitigated {| Comment = details.Comment |} ]
            | ChangeSeverity severity -> 
                [ Events.SeverityChanged severity ]
            | Acknowledge details -> 
                [ Events.Acknowledged {| User = details.User |} ]
            | AddComment details -> 
                [ Events.CommentAdded {| User = details.User; DateTimeUtc = System.DateTime.UtcNow; Text = details.Text |} ]
        | command, None -> 
            [] // ignoring because incident does not exist

    
let ``incident created``() =
    let events = [
        Events.Created {
            Title = "Incident 1"
            Description = "Description of Incident 1"
            Severity = Semi.IncidentSeverity.High
        }
    ]
    let stateActual = events |> List.fold State.evolve None
    let stateExpected: State.IncidentView option = Some {
        Title = "Incident 1"
        Description = "Description of Incident 1"
        Severity = Semi.IncidentSeverity.High
        Status = State.Status.Active
        AcknowledgedBy = None
        Comments = []
    }

    assert (stateActual = stateExpected) 

let ``incident created and mitigated``() =
    let events = [
        Events.Created {
            Title = "Incident 1"
            Description = "Description of Incident 1"
            Severity = Semi.IncidentSeverity.High
        }
        Events.Mitigated {| Comment = "Mitigated" |}
    ]
    let stateActual = events |> List.fold State.evolve None
    let stateExpected: State.IncidentView option = Some {
        Title = "Incident 1"
        Description = "Description of Incident 1"
        Severity = Semi.IncidentSeverity.High
        Status = State.Status.Mitigated
        AcknowledgedBy = None
        Comments = []
    }

    assert (stateActual = stateExpected)  

let ``command to create incident``() =
    let command = Commands.Create {|
        Title = "Incident 1"
        Description = "Description of Incident 1"
        Severity = Semi.IncidentSeverity.High
    |}
    let stateOritinal = None
    let eventsActual = Commands.decide command stateOritinal
    let eventsExpected = [
        Events.Created {
            Title = "Incident 1"
            Description = "Description of Incident 1"
            Severity = Semi.IncidentSeverity.High
        }
    ]

    assert (eventsActual = eventsExpected)

``incident created``()
``incident created and mitigated``()
``command to create incident``()
```

To see sample of modelling [Incident Management system on Rust](incident_management.rs).

``` rust
pub mod semi {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum IncidentSeverity {
        Low,
        Medium,
        High,
        Critical,
    }
}

pub mod events {
    use super::semi::IncidentSeverity;
    use std::time::SystemTime;

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub enum Event {
        Created {
            title: String,
            description: String,
            severity: IncidentSeverity,
        },
        Resolved {
            comment: String,
        },
        Mitigated {
            comment: String,
        },
        SeverityChanged(IncidentSeverity),
        Acknowledged {
            user: String,
        },
        CommentAdded {
            user: String,
            date_time_utc: SystemTime,
            text: String,
        },
    }
}

pub mod state {
    use super::{events::Event, semi::IncidentSeverity};
    use std::time::SystemTime;

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct CommentItem {
        pub user: String,
        pub date_time_utc: SystemTime,
        pub text: String,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum Status {
        Active,
        Mitigated,
        Resolved,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct IncidentView {
        pub title: String,
        pub description: String,
        pub severity: IncidentSeverity,
        pub status: Status,
        pub acknowledged_by: Option<String>,
        pub comments: Vec<CommentItem>,
    }

    pub fn evolve(state: Option<IncidentView>, event: Event) -> Option<IncidentView> {
        match (state, event) {
            (Some(mut state), event) => {
                match event {
                    Event::Resolved { .. } => state.status = Status::Resolved,
                    Event::Mitigated { .. } => state.status = Status::Mitigated,
                    Event::SeverityChanged(severity) => state.severity = severity,
                    Event::Acknowledged { user } => state.acknowledged_by = Some(user),
                    Event::CommentAdded {
                        user,
                        date_time_utc,
                        text,
                    } => state.comments.insert(
                        0,
                        CommentItem {
                            user,
                            date_time_utc,
                            text,
                        },
                    ),
                    Event::Created { .. } => {}
                }
                Some(state)
            }
            (
                None,
                Event::Created {
                    title,
                    description,
                    severity,
                },
            ) => Some(IncidentView {
                title,
                description,
                severity,
                status: Status::Active,
                acknowledged_by: None,
                comments: Vec::new(),
            }),
            (None, _) => panic!("Incident not created"),
        }
    }
}

pub mod commands {
    use super::{events::Event, semi::IncidentSeverity, state::IncidentView};
    use std::time::SystemTime;

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub enum Command {
        Create {
            title: String,
            description: String,
            severity: IncidentSeverity,
        },
        Resolve {
            comment: String,
        },
        Mitigate {
            comment: String,
        },
        ChangeSeverity(IncidentSeverity),
        Acknowledge {
            user: String,
        },
        AddComment {
            user: String,
            text: String,
        },
    }

    pub fn decide(command: Command, state: Option<&IncidentView>) -> Vec<Event> {
        match (command, state) {
            (
                Command::Create {
                    title,
                    description,
                    severity,
                },
                None,
            ) => vec![Event::Created {
                title,
                description,
                severity,
            }],
            (command, Some(_)) => match command {
                Command::Create { .. } => Vec::new(),
                Command::Resolve { comment } => vec![Event::Resolved { comment }],
                Command::Mitigate { comment } => vec![Event::Mitigated { comment }],
                Command::ChangeSeverity(severity) => vec![Event::SeverityChanged(severity)],
                Command::Acknowledge { user } => vec![Event::Acknowledged { user }],
                Command::AddComment { user, text } => vec![Event::CommentAdded {
                    user,
                    date_time_utc: SystemTime::now(),
                    text,
                }],
            },
            (_, None) => Vec::new(),
        }
    }
}

mod tests {
    use super::{
        commands::{decide, Command},
        events::Event,
        semi::IncidentSeverity,
        state::{evolve, IncidentView, Status},
    };

    pub fn incident_created() {
        let events = vec![Event::Created {
            title: "Incident 1".into(),
            description: "Description of Incident 1".into(),
            severity: IncidentSeverity::High,
        }];
        let state_actual = events.into_iter().fold(None, evolve);
        let state_expected = Some(IncidentView {
            title: "Incident 1".into(),
            description: "Description of Incident 1".into(),
            severity: IncidentSeverity::High,
            status: Status::Active,
            acknowledged_by: None,
            comments: Vec::new(),
        });

        debug_assert!(state_actual == state_expected);
    }

    pub fn incident_created_and_mitigated() {
        let events = vec![
            Event::Created {
                title: "Incident 1".into(),
                description: "Description of Incident 1".into(),
                severity: IncidentSeverity::High,
            },
            Event::Mitigated {
                comment: "Mitigated".into(),
            },
        ];
        let state_actual = events.into_iter().fold(None, evolve);
        let state_expected = Some(IncidentView {
            title: "Incident 1".into(),
            description: "Description of Incident 1".into(),
            severity: IncidentSeverity::High,
            status: Status::Mitigated,
            acknowledged_by: None,
            comments: Vec::new(),
        });

        debug_assert!(state_actual == state_expected);
    }

    pub fn command_to_create_incident() {
        let command = Command::Create {
            title: "Incident 1".into(),
            description: "Description of Incident 1".into(),
            severity: IncidentSeverity::High,
        };
        let state_original = None;
        let events_actual = decide(command, state_original);
        let events_expected = vec![Event::Created {
            title: "Incident 1".into(),
            description: "Description of Incident 1".into(),
            severity: IncidentSeverity::High,
        }];

        debug_assert!(events_actual == events_expected);
    }
}

fn main() {
    tests::incident_created();
    tests::incident_created_and_mitigated();
    tests::command_to_create_incident();
}

```