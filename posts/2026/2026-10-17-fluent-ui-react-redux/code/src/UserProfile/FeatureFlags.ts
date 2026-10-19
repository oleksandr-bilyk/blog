export type FeatureFlags = { portalVNextEnabled: boolean }
export class ActionPortalVNextToggle { }

export function updateFeatureFlags(model: FeatureFlags, action: object): FeatureFlags {
    if (action instanceof ActionPortalVNextToggle) return { portalVNextEnabled: !model.portalVNextEnabled }
    else return model
}
