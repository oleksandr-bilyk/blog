import * as React from 'react'
import { ActionButton, DefaultButton, IconButton, Panel, PanelType, SearchBox, Toggle, useTheme } from '@fluentui/react'
import { Customer } from '../../shared/contracts'
import { getPortalClassNames } from '../PresentationBlocks/PortalStyles'
import * as Model from './CustomersFilterModel'

export function CustomersFilter(param: {
    model: Model.CustomersFilterModel,
    customers: Customer[],
    dispatch: React.Dispatch<Model.CustomersFilterAction>,
}) {
    const classNames = getPortalClassNames(useTheme())
    const countText = param.model.allCustomersSelected
        ? 'all customers selected'
        : `${param.model.selectedItems.length} customers selected`
    const search = param.model.searchFilter.trim().toLowerCase()
    const matches = param.customers.filter(customer => customer.name.toLowerCase().includes(search))

    return <div>
        <ActionButton text={`Customers Filter (${countText})`} iconProps={{ iconName: 'Filter' }}
            onClick={() => param.dispatch(new Model.ActionPanelOpen())} />
        <Panel headerText="Customers Filter" isOpen={param.model.panelIsOpened} type={PanelType.medium}
            closeButtonAriaLabel="Close customers filter" isLightDismiss
            onDismiss={() => param.dispatch(new Model.ActionPanelDismiss())}>
            <div className={classNames.panelContent}>
                <Toggle label="Filter customers" checked={!param.model.allCustomersSelected} onText="On" offText="Off"
                    onChange={(_, checked) => param.dispatch(new Model.ActionAllCustomersSelectedToggleChanged(!checked))} />
                {param.model.allCustomersSelected ? <p>All customers selected.</p> : <>
                    <h3>Selected Customers</h3>
                    {param.model.selectedItems.length === 0 && <p role="status">Zero customers selected.</p>}
                    {param.model.selectedItems.map(customer => <div key={customer.id} className={classNames.listRow}>
                        <IconButton iconProps={{ iconName: 'RemoveFilter' }} ariaLabel={`Unselect ${customer.name}`}
                            onClick={() => param.dispatch(new Model.ActionRemoveCustomer(customer))} />
                        <span>{customer.name}</span>
                    </div>)}
                    <h3>Find customers</h3>
                    <SearchBox ariaLabel="Search customers" placeholder="Search fictional customers" value={param.model.searchFilter}
                        onChange={(_, value) => param.dispatch(new Model.ActionCustomerSearchRequested(value ?? ''))} />
                    <p>Search by customer name, then add a customer to the filter.</p>
                    {matches.length === 0 && <p role="status">No customers found.</p>}
                    {matches.map(customer => <div key={customer.id} className={classNames.listRow}>
                        <IconButton iconProps={{ iconName: 'Add' }} ariaLabel={`Select ${customer.name}`}
                            disabled={param.model.selectedItems.some(selected => selected.id === customer.id)}
                            onClick={() => param.dispatch(new Model.ActionAddCustomer(customer))} />
                        <span>{customer.name}</span>
                    </div>)}
                </>}
                <DefaultButton text="Done" onClick={() => param.dispatch(new Model.ActionPanelDismiss())} />
            </div>
        </Panel>
    </div>
}
