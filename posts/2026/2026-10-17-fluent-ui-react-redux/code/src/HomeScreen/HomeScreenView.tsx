import * as React from 'react'
import { DefaultButton, MessageBar, MessageBarType, Pivot, PivotItem, ProgressIndicator, SearchBox, useTheme } from '@fluentui/react'
import { ApplicationAction, ApplicationStateModel } from '../ApplicationStateModel'
import { CustomersFilter } from '../CustomersFilter/CustomersFilterView'
import { ActionIndexInitializationRequested } from '../IndexModel'
import { getPortalClassNames } from '../PresentationBlocks/PortalStyles'
import * as Model from '../RequestRecords/RequestRecordsModel'
import { RequestRecordsView } from '../RequestRecords/RequestRecordsView'

export function HomeScreen(param: {
    model: ApplicationStateModel,
    loading: boolean,
    dispatch: React.Dispatch<ApplicationAction | ActionIndexInitializationRequested>,
}) {
    const theme = useTheme()
    const classNames = getPortalClassNames(theme)
    const model = param.model.screens.home
    const busy = param.loading || model.operation.state === 'Running'
    const tabs: { key: Model.RequestState, text: string, icon: string }[] = [
        { key: 'OrdersPending', text: 'Orders Pending', icon: 'ReleaseDefinition' },
        { key: 'DeliveriesPending', text: 'Deliveries Pending', icon: 'Deploy' },
        { key: 'Completed', text: 'Completed', icon: 'Archive' },
    ]

    function requestContent() {
        return <div>
            <div className={classNames.toolbar}>
                <SearchBox className={classNames.search} ariaLabel="Search requests" placeholder="Search title, ID or owner"
                    value={model.searchFilter}
                    onChange={(_, value) => param.dispatch(new Model.ActionSearchRequested(value ?? ''))} />
                <DefaultButton text="Refresh" iconProps={{ iconName: 'Refresh' }} disabled={busy}
                    onClick={() => param.dispatch(new ActionIndexInitializationRequested())} />
            </div>
            {model.operation.state === 'Running' && <ProgressIndicator label="Updating selected requests..." />}
            {model.operation.state === 'Succeeded' && <MessageBar messageBarType={MessageBarType.success}>
                {model.operation.count} request(s) {model.operation.outcome.toLowerCase()}.
            </MessageBar>}
            {model.operation.state === 'Failed' && !model.detailsId && <MessageBar messageBarType={MessageBarType.error}>
                {model.operation.errorMessage}
            </MessageBar>}
            <RequestRecordsView model={model} filter={param.model.customersFilter} loading={param.loading} dispatch={param.dispatch} />
        </div>
    }

    return <section className={classNames.requests} aria-label="Requests">
        <CustomersFilter model={param.model.customersFilter} customers={param.model.screens.customerSettings.customers}
            dispatch={param.dispatch} />
        <Pivot aria-label="Request tabs" selectedKey={model.requestState} linkSize="large"
            styles={{ root: classNames.tabs, icon: { color: theme.palette.yellowDark } }}
            onLinkClick={item => {
                const key = item?.props.itemKey
                if (key === 'OrdersPending' || key === 'DeliveriesPending' || key === 'Completed') {
                    param.dispatch(new Model.ActionSelectRequestState(key))
                }
            }}>
            {tabs.map(tab => <PivotItem key={tab.key} itemKey={tab.key} headerText={tab.text} itemIcon={tab.icon}
                itemCount={Model.getRecordsForState(model, param.model.customersFilter, tab.key).length}>
                {model.requestState === tab.key && requestContent()}
            </PivotItem>)}
        </Pivot>
    </section>
}
