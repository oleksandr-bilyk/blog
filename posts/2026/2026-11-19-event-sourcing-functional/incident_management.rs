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
