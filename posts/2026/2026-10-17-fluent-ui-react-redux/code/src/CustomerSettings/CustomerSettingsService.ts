import * as React from 'react'
import * as Model from './CustomerSettingsModel'
import { errorMessage, saveCustomerSettings } from '../DemoApi/DemoApi'

export function useCustomerSettingsSave(model: Model.CustomerSettingsOperation, dispatch: React.Dispatch<Model.CustomerSettingsAction>) {
    React.useEffect(
        () => {
            if (model.state !== 'Running') return
            const controller = new AbortController()
            saveCustomerSettings(model.id, model.settings, controller.signal)
                .then(value => dispatch(new Model.ActionSaveSucceeded(value)))
                .catch((error: unknown) => {
                    if (!controller.signal.aborted) dispatch(new Model.ActionSaveFailed(errorMessage(error)))
                })
            return () => controller.abort()
        },
        [model, dispatch]
    )
}
