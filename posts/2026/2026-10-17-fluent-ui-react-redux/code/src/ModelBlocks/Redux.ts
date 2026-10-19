export type Update<TState, TAction> = (state: TState, action: TAction) => TState

export function combineReducers<TState, TAction>(
    reducers: Update<TState, TAction>[],
    state: TState,
    action: TAction
): TState {
    return reducers.reduce((current, update) => update(current, action), state)
}
