import * as React from 'react'
import { DefaultButton, Dropdown, MessageBar, MessageBarType, PrimaryButton, SearchBox, Toggle, useTheme } from '@fluentui/react'
import { ApplicationAction, SelectScreenAction } from '../ApplicationStateModel'
import { getPortalClassNames } from '../PresentationBlocks/PortalStyles'
import * as Model from './CustomerSettingsModel'

export function CustomerSettingsScreen(param: {
    model: Model.CustomerSettingsModel,
    loading: boolean,
    dispatch: React.Dispatch<ApplicationAction>,
}) {
    const classNames = getPortalClassNames(useTheme())
    const selected = param.model.customers.find(customer => customer.id === param.model.selectedId)
    const matches = param.model.customers.filter(customer =>
        customer.name.toLowerCase().includes(param.model.searchFilter.trim().toLowerCase()))
    const running = param.model.operation.state === 'Running'
    const busy = running || param.loading
    const draft = param.model.draft

    return <section className={classNames.requests} aria-label="Customer Settings">
        <div className={classNames.header}>
            <h1>Customer Settings</h1>
            <DefaultButton text="Back to requests" disabled={running}
                onClick={() => param.dispatch(new SelectScreenAction('Home'))} />
        </div>
        <MessageBar>Every customer is fictional. Settings live only in the local Node process and reset when it restarts.</MessageBar>
        {param.model.operation.state === 'Succeeded' && <MessageBar messageBarType={MessageBarType.success}>
            Settings saved for {param.model.operation.customerName}. No real notifications are sent.
        </MessageBar>}
        {param.model.operation.state === 'Failed' && <MessageBar messageBarType={MessageBarType.error}>
            {param.model.operation.errorMessage} Retry using Save customer settings.
        </MessageBar>}
        <div className={classNames.settingsLayout}>
            <div>
                <SearchBox ariaLabel="Find a customer" placeholder="Find a customer" value={param.model.searchFilter}
                    onChange={(_, value) => param.dispatch(new Model.ActionSearchRequested(value ?? ''))} />
                <div className={classNames.customerList} role="group" aria-label="Customers">
                    {matches.map(customer => <DefaultButton key={customer.id} text={customer.name} disabled={busy}
                        checked={customer.id === param.model.selectedId}
                        onClick={() => param.dispatch(new Model.ActionSelectCustomer(customer.id))} />)}
                    {matches.length === 0 && <p role="status">No customers found.</p>}
                </div>
            </div>
            {selected && draft && <form className={classNames.settingsForm} onSubmit={event => {
                event.preventDefault()
                param.dispatch(new Model.ActionSaveRequested())
            }}>
                <h2>{selected.name}</h2><p>{selected.description}</p>
                <Dropdown label="Preferred fulfillment" selectedKey={draft.deliveryMethod} disabled={busy}
                    options={[{ key: 'Collection', text: 'Collection' }, { key: 'Delivery', text: 'Delivery' }]}
                    onChange={(_, option) => {
                        if (option?.key === 'Collection' || option?.key === 'Delivery') {
                            param.dispatch(new Model.ActionSettingsChanged({ ...draft, deliveryMethod: option.key }))
                        }
                    }} />
                <Toggle label="Demo notifications" checked={draft.notificationsEnabled} onText="On" offText="Off" disabled={busy}
                    onChange={(_, checked) => param.dispatch(new Model.ActionSettingsChanged({
                        ...draft, notificationsEnabled: Boolean(checked),
                    }))} />
                <p>Learning-only preferences. No email, delivery, or notification is actually sent.</p>
                <PrimaryButton type="submit" text={running ? 'Saving...' : 'Save customer settings'} disabled={busy} />
            </form>}
        </div>
    </section>
}
