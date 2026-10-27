import { Customer, CustomerSettings } from '../../shared/contracts'

export type CustomerSettingsOperation =
    | { state: 'Idle' }
    | { state: 'Running', id: string, settings: CustomerSettings }
    | { state: 'Succeeded', customerName: string }
    | { state: 'Failed', errorMessage: string }

export type CustomerSettingsModel = {
    customers: Customer[],
    selectedId: string | null,
    searchFilter: string,
    draft: CustomerSettings | null,
    operation: CustomerSettingsOperation,
}

export function getInitialModel(): CustomerSettingsModel {
    return { customers: [], selectedId: null, searchFilter: '', draft: null, operation: { state: 'Idle' } }
}

export class ActionCustomersLoaded { constructor(public readonly items: Customer[]) { } }
export class ActionSelectCustomer { constructor(public readonly id: string) { } }
export class ActionSearchRequested { constructor(public readonly value: string) { } }
export class ActionSettingsChanged { constructor(public readonly value: CustomerSettings) { } }
export class ActionSaveRequested { }
export class ActionSaveSucceeded { constructor(public readonly value: Customer) { } }
export class ActionSaveFailed { constructor(public readonly errorMessage: string) { } }

export type CustomerSettingsAction =
    | ActionCustomersLoaded | ActionSelectCustomer | ActionSearchRequested | ActionSettingsChanged
    | ActionSaveRequested | ActionSaveSucceeded | ActionSaveFailed

function getSettings(customer: Customer): CustomerSettings {
    return { deliveryMethod: customer.deliveryMethod, notificationsEnabled: customer.notificationsEnabled }
}

export function updateModel(model: CustomerSettingsModel, action: object): CustomerSettingsModel {
    if (action instanceof ActionCustomersLoaded) {
        const selected = action.items.find(item => item.id === model.selectedId) ?? action.items[0]
        return {
            ...model,
            customers: action.items,
            selectedId: selected?.id ?? null,
            draft: selected ? getSettings(selected) : null,
        }
    }
    else if (action instanceof ActionSaveSucceeded) {
        return {
            ...model,
            customers: model.customers.map(item => item.id === action.value.id ? action.value : item),
            draft: getSettings(action.value),
            operation: { state: 'Succeeded', customerName: action.value.name },
        }
    }
    else if (action instanceof ActionSaveFailed) {
        return { ...model, operation: { state: 'Failed', errorMessage: action.errorMessage } }
    }
    else if (model.operation.state === 'Running') return model
    else if (action instanceof ActionSelectCustomer) {
        const selected = model.customers.find(item => item.id === action.id)
        if (!selected) throw new Error('The selected demo customer was not loaded.')
        return { ...model, selectedId: selected.id, draft: getSettings(selected), operation: { state: 'Idle' } }
    }
    else if (action instanceof ActionSearchRequested) return { ...model, searchFilter: action.value }
    else if (action instanceof ActionSettingsChanged) return { ...model, draft: action.value, operation: { state: 'Idle' } }
    else if (action instanceof ActionSaveRequested && model.selectedId && model.draft) {
        return { ...model, operation: { state: 'Running', id: model.selectedId, settings: model.draft } }
    }
    else return model
}
