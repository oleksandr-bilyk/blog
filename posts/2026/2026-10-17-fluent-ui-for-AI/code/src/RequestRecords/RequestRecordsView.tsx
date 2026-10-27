import * as React from 'react'
import {
    CheckboxVisibility, CommandBar, DefaultButton, DetailsList, DetailsListLayoutMode,
    IColumn, Link, Selection, SelectionMode, useTheme,
} from '@fluentui/react'
import { WorkshopRequest } from '../../shared/contracts'
import { ApplicationAction } from '../ApplicationStateModel'
import { ActionAllCustomersSelectedToggleChanged, CustomersFilterModel } from '../CustomersFilter/CustomersFilterModel'
import { getPortalClassNames } from '../PresentationBlocks/PortalStyles'
import { StatusLabel } from '../PresentationBlocks/StatusLabel'
import * as Model from './RequestRecordsModel'

export function RequestRecordsView(param: {
    model: Model.RequestRecordsModel,
    filter: CustomersFilterModel,
    loading: boolean,
    dispatch: React.Dispatch<ApplicationAction>,
}) {
    const classNames = getPortalClassNames(useTheme())
    const pending = param.model.requestState !== 'Completed'
    const busy = param.loading || param.model.operation.state === 'Running'
    const rows = React.useMemo(
        () => Model.getVisibleRecords(param.model, param.filter).map(item => ({ ...item, key: item.id })),
        [param.model.items, param.model.requestState, param.model.searchFilter,
            param.filter.allCustomersSelected, param.filter.selectedItems]
    )
    const selection: Selection = React.useMemo(() => new Selection({
        onSelectionChanged: () => param.dispatch(new Model.ActionItemsSelected(selection.getSelection().map(item => {
            if (item.key === undefined) throw new Error('A selectable request must have a stable key.')
            return String(item.key)
        }))),
    }), [param.dispatch])

    React.useEffect(
        () => {
            if (param.model.itemsSelected.length === 0) selection.setAllSelected(false)
        },
        [param.model.itemsSelected, selection]
    )

    const columns: IColumn[] = [
        {
            key: 'id', name: 'Request', minWidth: 90, maxWidth: 100,
            onRender: (item: WorkshopRequest) => <Link data-selection-disabled aria-label={`Open ${item.id}`}
                onClick={() => param.dispatch(new Model.ActionDetailsOpen(item.id))}>{item.id}</Link>,
        },
        { key: 'title', name: 'Title', fieldName: 'title', minWidth: 200, isResizable: true },
        { key: 'customer', name: 'Customer', fieldName: 'customer', minWidth: 115, maxWidth: 140 },
        { key: 'owner', name: 'Requested by', fieldName: 'owner', minWidth: 120, maxWidth: 140 },
        {
            key: 'created', name: 'Submitted time', minWidth: 130, maxWidth: 150,
            onRender: (item: WorkshopRequest) => new Date(item.createdAt).toLocaleString(),
        },
        {
            key: 'status', name: 'Status', minWidth: 90, maxWidth: 110,
            onRender: (item: WorkshopRequest) => <StatusLabel value={item.status} />,
        },
    ]

    return <>
        {pending && <CommandBar ariaLabel="Selected requests commands"
            styles={{ root: { paddingLeft: 0, paddingRight: 0 } }} items={[
                {
                    key: 'complete', text: 'Complete selected', iconProps: { iconName: 'CheckMark' },
                    disabled: busy || param.model.itemsSelected.length === 0,
                    onClick: () => param.dispatch(new Model.ActionResolveRequested({
                        ids: param.model.itemsSelected, outcome: 'Completed',
                    })),
                },
                {
                    key: 'reject', text: 'Reject selected', iconProps: { iconName: 'Blocked' },
                    disabled: busy || param.model.itemsSelected.length === 0,
                    onClick: () => param.dispatch(new Model.ActionResolveRequested({
                        ids: param.model.itemsSelected, outcome: 'Rejected',
                    })),
                },
            ]} />}
        <div className={classNames.tableScroll} aria-busy={busy}>
            <DetailsList items={rows} columns={columns} getKey={item => item.id} setKey={param.model.requestState}
                selection={selection} selectionMode={pending ? SelectionMode.multiple : SelectionMode.none}
                selectionPreservedOnEmptyClick checkboxVisibility={CheckboxVisibility.always}
                layoutMode={DetailsListLayoutMode.justified} onShouldVirtualize={() => false}
                ariaLabelForSelectionColumn="Toggle request selection" ariaLabelForSelectAllCheckbox="Select all requests"
                checkButtonAriaLabel="Select request" ariaLabelForGrid={`${param.model.requestState} requests`} />
        </div>
        {rows.length === 0 && <div className={classNames.empty}>
            <h3>No requests here</h3><p>Try another tab, customer or search.</p>
            <DefaultButton text="Clear filters" onClick={() => {
                param.dispatch(new Model.ActionSearchRequested(''))
                param.dispatch(new ActionAllCustomersSelectedToggleChanged(true))
            }} />
        </div>}
        <div className={classNames.tableFooter} role="status">
            {rows.length} requests shown{pending ? ` / ${param.model.itemsSelected.length} selected` : ''}
        </div>
    </>
}
