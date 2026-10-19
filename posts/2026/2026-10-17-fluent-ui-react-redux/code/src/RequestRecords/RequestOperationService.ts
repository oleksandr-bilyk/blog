import * as React from 'react'
import * as Model from './RequestRecordsModel'
import { errorMessage, resolveRequests } from '../DemoApi/DemoApi'

export function useRequestOperation(model: Model.RequestOperation, dispatch: React.Dispatch<Model.RequestRecordsAction>) {
    React.useEffect(
        () => {
            if (model.state !== 'Running') return
            const controller = new AbortController()
            resolveRequests(model.value, controller.signal)
                .then(items => dispatch(new Model.ActionResolveSucceeded(items, model.value.outcome)))
                .catch((error: unknown) => {
                    if (!controller.signal.aborted) dispatch(new Model.ActionResolveFailed(errorMessage(error)))
                })
            return () => controller.abort()
        },
        [model, dispatch]
    )
}
