import * as React from 'react'
import { errorMessage, getInitializationData } from './DemoApi/DemoApi'
import { ActionIndexInitialized, ActionIndexInitializationFailed, IndexAction, IndexInitialization } from './IndexModel'

export function useIndexModelInitialization(model: IndexInitialization, dispatch: React.Dispatch<IndexAction>) {
    React.useEffect(
        () => {
            if (model.state !== 'Initializing') return
            const controller = new AbortController()
            getInitializationData(controller.signal)
                .then(value => dispatch(new ActionIndexInitialized(value)))
                .catch((error: unknown) => {
                    if (!controller.signal.aborted) dispatch(new ActionIndexInitializationFailed(errorMessage(error)))
                })
            return () => controller.abort()
        },
        [model.state, model.version, dispatch]
    )
}
