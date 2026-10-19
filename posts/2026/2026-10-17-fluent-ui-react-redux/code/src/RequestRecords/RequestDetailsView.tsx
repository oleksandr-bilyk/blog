import * as React from 'react'
import { DefaultButton, MessageBar, MessageBarType, Panel, PanelType, PrimaryButton, ProgressIndicator, useTheme } from '@fluentui/react'
import { getPortalClassNames } from '../PresentationBlocks/PortalStyles'
import { StatusLabel } from '../PresentationBlocks/StatusLabel'
import * as Model from './RequestRecordsModel'

export function RequestDetailsView(param: {
    model: Model.RequestRecordsModel,
    loading: boolean,
    dispatch: React.Dispatch<Model.RequestRecordsAction>,
}) {
    const classNames = getPortalClassNames(useTheme())
    const selected = param.model.items.find(item => item.id === param.model.detailsId)
    const running = param.model.operation.state === 'Running'
    const busy = param.loading || running

    return <Panel isOpen={Boolean(selected)} type={PanelType.medium} headerText={selected?.title ?? 'Request details'}
        closeButtonAriaLabel="Close request details" isLightDismiss={!running} isBlocking isFooterAtBottom
        onDismiss={() => param.dispatch(new Model.ActionDetailsDismiss())}
        onRenderFooterContent={() => selected ? <div className={classNames.panelActions}>
            {selected.status === 'Pending' && <>
                <PrimaryButton text="Complete request" disabled={busy} iconProps={{ iconName: 'CheckMark' }}
                    onClick={() => param.dispatch(new Model.ActionResolveRequested({ ids: [selected.id], outcome: 'Completed' }))} />
                <DefaultButton text="Reject request" disabled={busy} iconProps={{ iconName: 'Blocked' }}
                    onClick={() => param.dispatch(new Model.ActionResolveRequested({ ids: [selected.id], outcome: 'Rejected' }))} />
            </>}
            <DefaultButton text="Close" disabled={running} onClick={() => param.dispatch(new Model.ActionDetailsDismiss())} />
        </div> : null}>
        {selected && <div className={classNames.panelContent}>
            <StatusLabel value={selected.status} />
            <p>{selected.id} / Fictional {selected.kind.toLowerCase()}</p>
            <h3>About this request</h3><p>{selected.description}</p>
            <dl className={classNames.detailList}>
                <dt>Customer</dt><dd>{selected.customer}</dd>
                <dt>Requested by</dt><dd>{selected.owner}</dd>
                <dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd>
                <dt>Last updated</dt><dd>{new Date(selected.updatedAt).toLocaleString()}</dd>
            </dl>
            <MessageBar>The mock API returns the updated request, the reducer stores it, and React updates the tab counts.</MessageBar>
            {running && <ProgressIndicator label="Saving to the mock API..." />}
            {param.model.operation.state === 'Failed' && <MessageBar messageBarType={MessageBarType.error}>
                {param.model.operation.errorMessage}
            </MessageBar>}
            <p>Restart the Node server to restore the original sample data.</p>
        </div>}
    </Panel>
}
