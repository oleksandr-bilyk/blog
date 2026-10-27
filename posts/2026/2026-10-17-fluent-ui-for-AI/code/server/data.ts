import { customers, type Customer, type WorkshopRequest } from "../shared/contracts";

export function createCustomers(): Customer[] {
    return customers.map((name, index) => ({
        id: `customer-${index + 1}`,
        name,
        description: "An invented customer used only to demonstrate local application state.",
        deliveryMethod: index === 1 ? "Delivery" : "Collection",
        notificationsEnabled: false
    }));
}

export function createRequests(): WorkshopRequest[] {
    return [
        {
            id: "DEMO-101", title: "Prepare a sketching kit", kind: "Order", customer: "Cedar Crafts",
            owner: "Sample maker", status: "Pending",
            description: "Put together pencils, paper and reusable stencils for a fictional drawing workshop.",
            createdAt: "2026-01-12T09:00:00Z", updatedAt: "2026-01-12T09:00:00Z"
        },
        {
            id: "DEMO-102", title: "Pack a model-making set", kind: "Order", customer: "Maple Studio",
            owner: "Demo host", status: "Pending",
            description: "Pack reusable tools for a fictional model-making workshop.",
            createdAt: "2026-01-12T10:15:00Z", updatedAt: "2026-01-12T10:15:00Z"
        },
        {
            id: "DEMO-103", title: "Deliver the tabletop camera", kind: "Delivery", customer: "Willow Works",
            owner: "Example builder", status: "Pending",
            description: "Test a pretend tabletop camera before the next model-making session.",
            createdAt: "2026-01-13T08:30:00Z", updatedAt: "2026-01-13T08:30:00Z"
        },
        {
            id: "DEMO-104", title: "Restock colorful card", kind: "Order", customer: "Cedar Crafts",
            owner: "Demo host", status: "Pending",
            description: "Add a selection of colored card to the imaginary workshop supplies.",
            createdAt: "2026-01-13T11:00:00Z", updatedAt: "2026-01-13T11:00:00Z"
        },
        {
            id: "DEMO-105", title: "Deliver the display stands", kind: "Delivery", customer: "Maple Studio",
            owner: "Sample maker", status: "Pending",
            description: "Make space for fictional paper models at the end of the learning session.",
            createdAt: "2026-01-14T09:00:00Z", updatedAt: "2026-01-14T09:00:00Z"
        },
        {
            id: "DEMO-106", title: "Label the tool trays", kind: "Order", customer: "Willow Works",
            owner: "Example builder", status: "Completed",
            description: "The sample tool trays now have easy-to-read labels.",
            createdAt: "2026-01-10T09:00:00Z", updatedAt: "2026-01-11T14:00:00Z"
        },
        {
            id: "DEMO-107", title: "Send a paper prototype", kind: "Delivery", customer: "Cedar Crafts",
            owner: "Sample maker", status: "Rejected",
            description: "A fictional paper prototype is ready for a walkthrough.",
            createdAt: "2026-01-10T11:00:00Z", updatedAt: "2026-01-12T15:00:00Z"
        },
        {
            id: "DEMO-108", title: "Deliver the reading kits", kind: "Delivery", customer: "Maple Studio",
            owner: "Demo host", status: "Completed",
            description: "The imaginary reading nook is ready for visitors.",
            createdAt: "2026-01-11T09:00:00Z", updatedAt: "2026-01-13T16:00:00Z"
        }
    ];
}
