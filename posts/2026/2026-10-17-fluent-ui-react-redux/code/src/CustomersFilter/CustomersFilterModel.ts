import { Customer } from '../../shared/contracts'

export type CustomersFilterModel = {
    panelIsOpened: boolean,
    allCustomersSelected: boolean,
    selectedItems: Customer[],
    searchFilter: string,
}

export function getInitialModel(): CustomersFilterModel {
    return {
        panelIsOpened: false,
        allCustomersSelected: true,
        selectedItems: [],
        searchFilter: '',
    }
}

export class ActionPanelOpen { }
export class ActionPanelDismiss { }
export class ActionAllCustomersSelectedToggleChanged { constructor(public readonly enabled: boolean) { } }
export class ActionAddCustomer { constructor(public readonly item: Customer) { } }
export class ActionRemoveCustomer { constructor(public readonly item: Customer) { } }
export class ActionCustomerSearchRequested { constructor(public readonly value: string) { } }

export type CustomersFilterAction =
    | ActionPanelOpen | ActionPanelDismiss | ActionAllCustomersSelectedToggleChanged
    | ActionAddCustomer | ActionRemoveCustomer | ActionCustomerSearchRequested

export function selectionChanged(action: object): boolean {
    return action instanceof ActionAllCustomersSelectedToggleChanged ||
        action instanceof ActionAddCustomer ||
        action instanceof ActionRemoveCustomer
}

export function updateModel(model: CustomersFilterModel, action: object): CustomersFilterModel {
    if (action instanceof ActionPanelOpen) return { ...model, panelIsOpened: true }
    else if (action instanceof ActionPanelDismiss) return { ...model, panelIsOpened: false }
    else if (action instanceof ActionAllCustomersSelectedToggleChanged) {
        return { ...model, allCustomersSelected: action.enabled }
    }
    else if (action instanceof ActionAddCustomer) {
        if (model.selectedItems.some(item => item.id === action.item.id)) return model
        return {
            ...model,
            selectedItems: [...model.selectedItems, action.item].sort((a, b) => a.name.localeCompare(b.name)),
        }
    }
    else if (action instanceof ActionRemoveCustomer) {
        return { ...model, selectedItems: model.selectedItems.filter(item => item.id !== action.item.id) }
    }
    else if (action instanceof ActionCustomerSearchRequested) return { ...model, searchFilter: action.value }
    else return model
}

export function includesCustomer(model: CustomersFilterModel, customerName: string): boolean {
    return model.allCustomersSelected || model.selectedItems.some(item => item.name === customerName)
}
