import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { DefaultButton, Label, MessageBar, MessageBarType, ProgressIndicator, Spinner, Stack, ThemeProvider } from '@fluentui/react'
import { CustomerSettingsScreen } from './CustomerSettings/CustomerSettingsView'
import { useCustomerSettingsSave } from './CustomerSettings/CustomerSettingsService'
import { HomeScreen } from './HomeScreen/HomeScreenView'
import { ActionIndexInitializationRequested, getIndexModelInitial, updateIndexModel } from './IndexModel'
import { useIndexModelInitialization } from './IndexInitializationService'
import { PageHeader } from './PageHeaders/PageHeader'
import { registerDemoIcons } from './PresentationBlocks/FabricIcons'
import { getPortalClassNames } from './PresentationBlocks/PortalStyles'
import { getPortalTheme } from './PresentationBlocks/PortalTheme'
import { RequestDetailsView } from './RequestRecords/RequestDetailsView'
import { useRequestOperation } from './RequestRecords/RequestOperationService'

export function IndexComponent() {
    const [model, dispatch] = React.useReducer(updateIndexModel, undefined, getIndexModelInitial)
    const theme = getPortalTheme(model.application.darkTheme)
    const classNames = getPortalClassNames(theme)
    const loading = model.initializable.state === 'Initializing'
    const initialLoading = loading && model.application.screens.home.items.length === 0
    useIndexModelInitialization(model.initializable, dispatch)
    useRequestOperation(model.application.screens.home.operation, dispatch)
    useCustomerSettingsSave(model.application.screens.customerSettings.operation, dispatch)

    return <ThemeProvider theme={theme} className={classNames.root}>
        <a className={classNames.skipLink} href="#content">Skip to content</a>
        <div className={classNames.content}>
            <PageHeader model={model.application} dispatch={dispatch} />
            <main id="content" tabIndex={-1}>
                <MessageBar messageBarType={MessageBarType.info}>
                    Anonymous learning sandbox. All customers, people and requests are invented. No sign-in or cloud connection.
                </MessageBar>
                {loading && <div className={classNames.loading}>
                    {initialLoading && <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
                        <Label>Loading...</Label><Spinner labelPosition="right" />
                    </Stack>}
                    <ProgressIndicator label="Loading Fluent demo..."
                        description="An artificial five-second delay demonstrates the portal loading state." />
                </div>}
                {model.initializable.state === 'Failed' && <MessageBar messageBarType={MessageBarType.error}
                    actions={<DefaultButton text="Retry" onClick={() => dispatch(new ActionIndexInitializationRequested())} />}>
                    {model.initializable.errorMessage}
                </MessageBar>}
                {!initialLoading && model.application.screens.home.items.length > 0 && (
                    model.application.screenSelected === 'Home'
                        ? <HomeScreen model={model.application} loading={loading} dispatch={dispatch} />
                        : <CustomerSettingsScreen model={model.application.screens.customerSettings} loading={loading} dispatch={dispatch} />
                )}
                <footer className={classNames.footer}>Fluent demo / Fictional learning project / React + Redux pattern + Fluent UI</footer>
            </main>
        </div>
        <RequestDetailsView model={model.application.screens.home} loading={loading} dispatch={dispatch} />
    </ThemeProvider>
}

registerDemoIcons()
const container = document.getElementById('applicationDomContainer')
if (!container) throw new Error('The demo root element was not found.')
createRoot(container).render(<React.StrictMode><IndexComponent /></React.StrictMode>)
