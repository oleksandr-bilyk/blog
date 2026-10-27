import * as CustomerSettings from './CustomerSettings/CustomerSettingsModel'
import * as CustomersFilter from './CustomersFilter/CustomersFilterModel'
import * as RequestRecords from './RequestRecords/RequestRecordsModel'
import { combineReducers } from './ModelBlocks/Redux'
import { ActionPortalVNextToggle, FeatureFlags, updateFeatureFlags } from './UserProfile/FeatureFlags'

export type ScreenEnum = 'Home' | 'CustomerSettings'
export class SelectScreenAction { constructor(public readonly screenType: ScreenEnum) { } }
export class ActionToggleTheme { }

export type ApplicationAction =
    | SelectScreenAction | ActionToggleTheme | ActionPortalVNextToggle
    | CustomersFilter.CustomersFilterAction | RequestRecords.RequestRecordsAction
    | CustomerSettings.CustomerSettingsAction

export type ApplicationStateModel = {
    screenSelected: ScreenEnum,
    darkTheme: boolean,
    featureFlags: FeatureFlags,
    customersFilter: CustomersFilter.CustomersFilterModel,
    screens: {
        home: RequestRecords.RequestRecordsModel,
        customerSettings: CustomerSettings.CustomerSettingsModel,
    },
}

export function getStateInitial(): ApplicationStateModel {
    return {
        screenSelected: 'Home',
        darkTheme: false,
        featureFlags: { portalVNextEnabled: true },
        customersFilter: CustomersFilter.getInitialModel(),
        screens: {
            home: RequestRecords.getInitialModel(),
            customerSettings: CustomerSettings.getInitialModel(),
        },
    }
}

function updateScreens(model: ApplicationStateModel, action: object): ApplicationStateModel {
    return {
        ...model,
        screenSelected: action instanceof SelectScreenAction ? action.screenType : model.screenSelected,
        darkTheme: action instanceof ActionToggleTheme ? !model.darkTheme : model.darkTheme,
        featureFlags: updateFeatureFlags(model.featureFlags, action),
        customersFilter: CustomersFilter.updateModel(model.customersFilter, action),
        screens: {
            home: RequestRecords.updateModel(model.screens.home, action),
            customerSettings: CustomerSettings.updateModel(model.screens.customerSettings, action),
        },
    }
}

function updateSelection(model: ApplicationStateModel, action: object): ApplicationStateModel {
    if (CustomersFilter.selectionChanged(action) || action instanceof SelectScreenAction) {
        return {
            ...model,
            customersFilter: action instanceof SelectScreenAction
                ? CustomersFilter.updateModel(model.customersFilter, new CustomersFilter.ActionPanelDismiss())
                : model.customersFilter,
            screens: {
                ...model.screens,
                home: RequestRecords.updateModel(model.screens.home, new RequestRecords.ActionClearSelection()),
            },
        }
    }
    else return model
}

export function updateApplicationStateModel(model: ApplicationStateModel, action: object): ApplicationStateModel {
    return combineReducers([updateScreens, updateSelection], model, action)
}
