import { Resolution, WorkshopRequest } from '../../shared/contracts'
import { CustomersFilterModel, includesCustomer } from '../CustomersFilter/CustomersFilterModel'
import { combineReducers } from '../ModelBlocks/Redux'

export type RequestState = 'OrdersPending' | 'DeliveriesPending' | 'Completed'
export type RequestOperation =
    | { state: 'Idle' }
    | { state: 'Running', value: Resolution }
    | { state: 'Succeeded', count: number, outcome: Resolution['outcome'] }
    | { state: 'Failed', errorMessage: string }

export type RequestRecordsModel = {
    items: WorkshopRequest[],
    requestState: RequestState,
    searchFilter: string,
    itemsSelected: string[],
    detailsId: string | null,
    operation: RequestOperation,
}

export function getInitialModel(): RequestRecordsModel {
    return {
        items: [],
        requestState: 'OrdersPending',
        searchFilter: '',
        itemsSelected: [],
        detailsId: null,
        operation: { state: 'Idle' },
    }
}

export class ActionRecordsLoaded { constructor(public readonly items: WorkshopRequest[]) { } }
export class ActionSelectRequestState { constructor(public readonly value: RequestState) { } }
export class ActionSearchRequested { constructor(public readonly value: string) { } }
export class ActionItemsSelected { constructor(public readonly ids: string[]) { } }
export class ActionClearSelection { }
export class ActionDetailsOpen { constructor(public readonly id: string) { } }
export class ActionDetailsDismiss { }
export class ActionResolveRequested { constructor(public readonly value: Resolution) { } }
export class ActionResolveSucceeded {
    constructor(public readonly items: WorkshopRequest[], public readonly outcome: Resolution['outcome']) { }
}
export class ActionResolveFailed { constructor(public readonly errorMessage: string) { } }

export type RequestRecordsAction =
    | ActionRecordsLoaded | ActionSelectRequestState | ActionSearchRequested | ActionItemsSelected
    | ActionClearSelection | ActionDetailsOpen | ActionDetailsDismiss | ActionResolveRequested
    | ActionResolveSucceeded | ActionResolveFailed

function updateRecords(model: RequestRecordsModel, action: object): RequestRecordsModel {
    if (action instanceof ActionRecordsLoaded) return { ...model, items: action.items, itemsSelected: [] }
    else if (action instanceof ActionSelectRequestState) {
        return { ...model, requestState: action.value, itemsSelected: [] }
    }
    else if (action instanceof ActionSearchRequested) {
        return { ...model, searchFilter: action.value, itemsSelected: [] }
    }
    else if (action instanceof ActionItemsSelected) {
        if (model.itemsSelected.length === action.ids.length &&
            model.itemsSelected.every((id, index) => id === action.ids[index])) return model
        return { ...model, itemsSelected: action.ids }
    }
    else if (action instanceof ActionClearSelection) return { ...model, itemsSelected: [] }
    else if (action instanceof ActionDetailsOpen && model.operation.state !== 'Running') {
        return { ...model, detailsId: action.id, operation: { state: 'Idle' } }
    }
    else if (action instanceof ActionDetailsDismiss && model.operation.state !== 'Running') {
        return { ...model, detailsId: null }
    }
    else return model
}

function updateOperation(model: RequestRecordsModel, action: object): RequestRecordsModel {
    if (action instanceof ActionResolveRequested && model.operation.state !== 'Running') {
        return { ...model, operation: { state: 'Running', value: action.value } }
    }
    else if (action instanceof ActionResolveSucceeded) {
        return {
            ...model,
            items: model.items.map(item => action.items.find(updated => updated.id === item.id) ?? item),
            itemsSelected: [],
            operation: { state: 'Succeeded', count: action.items.length, outcome: action.outcome },
        }
    }
    else if (action instanceof ActionResolveFailed) {
        return { ...model, operation: { state: 'Failed', errorMessage: action.errorMessage } }
    }
    else return model
}

export function updateModel(model: RequestRecordsModel, action: object): RequestRecordsModel {
    return combineReducers([updateRecords, updateOperation], model, action)
}

export function getRecordsForState(model: RequestRecordsModel, filter: CustomersFilterModel, state: RequestState) {
    return model.items.filter(item =>
        includesCustomer(filter, item.customer) &&
        (state === 'Completed' ? item.status !== 'Pending' :
            item.status === 'Pending' && item.kind === (state === 'OrdersPending' ? 'Order' : 'Delivery')))
}

export function getVisibleRecords(model: RequestRecordsModel, filter: CustomersFilterModel) {
    const query = model.searchFilter.trim().toLowerCase()
    return getRecordsForState(model, filter, model.requestState).filter(item =>
        `${item.id} ${item.title} ${item.owner}`.toLowerCase().includes(query))
}
