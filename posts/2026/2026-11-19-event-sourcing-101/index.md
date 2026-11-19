# Event Sourcing - Learning Materials and Domain Modeling Made Functional

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

    type EventResolvedDetails = {
        Comment: string
    }
    
    type EventMitigatedDetails = {
        Comment: string
    }
    
    type EventAcknowledgedDetails = {
        User: string
    }

    type EventCommentAddedDetails = {
        User: string
        Text: string
    }

    type EventCommendAddedDetails = {
        User: string
        DateTimeUtc: DateTime
        Text: string
    }

    type Event =
        | Created of EventCreatedDetails
        | Resolved of EventResolvedDetails
        | Mitigated of EventMitigatedDetails
        | SeverityChanged of Semi.IncidentSeverity
        | Acknowledged of EventAcknowledgedDetails
        | CommentAdded of EventCommendAddedDetails

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
    type CommandsCreateDetails = {
        Title: string
        Description: string
        Severity: Semi.IncidentSeverity
    }

    type CommandsResolveDetails = {
        Comment: string
    }
    
    type CommandsMitigateDetails = {
        Comment: string
    }
    
    type CommandsAcknowledgeDetails = {
        User: string
    }

    type CommandsAddCommentDetails = {
        User: string
        Text: string
    }

    type Command =
        | Create of CommandsCreateDetails
        | Resolve of CommandsResolveDetails
        | Mitigate of CommandsMitigateDetails
        | ChangeSeverity of Semi.IncidentSeverity
        | Acknowledge of CommandsAcknowledgeDetails
        | AddComment of CommandsAddCommentDetails

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
                [ Events.Resolved { Comment = details.Comment } ]
            | Mitigate details -> 
                [ Events.Mitigated { Comment = details.Comment } ]
            | ChangeSeverity severity -> 
                [ Events.SeverityChanged severity ]
            | Acknowledge details -> 
                [ Events.Acknowledged { User = details.User } ]
            | AddComment details -> 
                [ Events.CommentAdded { User = details.User; DateTimeUtc = System.DateTime.UtcNow; Text = details.Text } ]
        | command, None -> 
            [] // ignoring because incident does not exist

    

module Tests =
    type TestCase = {
        Name: string
        Test: unit -> unit
    }

    let testCases =
        [
            {
                Name = "incident created"
                Test = fun () ->
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
            }

            {
                Name = "incident created and mitigated"
                Test = fun () ->
                    let events = [
                        Events.Created {
                            Title = "Incident 1"
                            Description = "Description of Incident 1"
                            Severity = Semi.IncidentSeverity.High
                        }
                        Events.Mitigated {
                            Comment = "Mitigated"
                        }
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
            }

            {
                Name = "command to create incident"
                Test = fun () ->
                    let command = Commands.Create {
                        Title = "Incident 1"
                        Description = "Description of Incident 1"
                        Severity = Semi.IncidentSeverity.High
                    }
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
            }
        ]

// run tests
for testCase in Tests.testCases do
    printfn "Running test: %s" testCase.Name
    testCase.Test()

```