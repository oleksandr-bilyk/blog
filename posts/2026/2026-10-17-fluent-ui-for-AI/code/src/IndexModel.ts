import {
    ApplicationAction,
    ApplicationStateModel,
    getStateInitial,
    updateApplicationStateModel,
} from './ApplicationStateModel'
import { ActionCustomersLoaded } from './CustomerSettings/CustomerSettingsModel'
import { InitializationData } from './DemoApi/DemoApi'
import { ActionRecordsLoaded } from './RequestRecords/RequestRecordsModel'

export type IndexInitialization =
    | { state: 'Initializing', version: number }
    | { state: 'Initialized', version: number }
    | { state: 'Failed', version: number, errorMessage: string }

export type IndexModel = {
    initializable: IndexInitialization,
    application: ApplicationStateModel,
    lastAction: string,
}

export class ActionIndexInitializationRequested { }
export class ActionIndexInitialized { constructor(public readonly value: InitializationData) { } }
export class ActionIndexInitializationFailed { constructor(public readonly errorMessage: string) { } }
export type IndexAction =
    | ApplicationAction | ActionIndexInitializationRequested | ActionIndexInitialized | ActionIndexInitializationFailed

export function getIndexModelInitial(): IndexModel {
    return {
        initializable: { state: 'Initializing', version: 0 },
        application: getStateInitial(),
        lastAction: 'Initializing',
    }
}

export function updateIndexModel(model: IndexModel, action: IndexAction): IndexModel {
    const lastAction = action.constructor.name
    if (action instanceof ActionIndexInitializationRequested) {
        if (model.initializable.state === 'Initializing' ||
            model.application.screens.home.operation.state === 'Running' ||
            model.application.screens.customerSettings.operation.state === 'Running') return model
        return {
            ...model,
            initializable: { state: 'Initializing', version: model.initializable.version + 1 },
            lastAction,
        }
    }
    else if (action instanceof ActionIndexInitialized) {
        const requestsUpdated = updateApplicationStateModel(model.application, new ActionRecordsLoaded(action.value.requests))
        return {
            initializable: { state: 'Initialized', version: model.initializable.version },
            application: updateApplicationStateModel(requestsUpdated, new ActionCustomersLoaded(action.value.customers)),
            lastAction,
        }
    }
    else if (action instanceof ActionIndexInitializationFailed) {
        return {
            ...model,
            initializable: { state: 'Failed', version: model.initializable.version, errorMessage: action.errorMessage },
            lastAction,
        }
    }
    else return { ...model, application: updateApplicationStateModel(model.application, action), lastAction }
}
