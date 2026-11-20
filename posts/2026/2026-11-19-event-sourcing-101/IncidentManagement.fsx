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

let ``command to create incident``() =
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

``incident created``()
``incident created and mitigated``()
``command to create incident``()