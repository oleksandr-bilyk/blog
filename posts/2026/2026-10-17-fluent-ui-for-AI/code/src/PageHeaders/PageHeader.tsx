import * as React from 'react'
import { ActionButton, ContextualMenu, Persona, PersonaSize, Toggle, useTheme } from '@fluentui/react'
import { ActionToggleTheme, ApplicationAction, ApplicationStateModel, SelectScreenAction } from '../ApplicationStateModel'
import { getPortalClassNames } from '../PresentationBlocks/PortalStyles'
import { ActionPortalVNextToggle } from '../UserProfile/FeatureFlags'

export function PageHeader(param: { model: ApplicationStateModel, dispatch: React.Dispatch<ApplicationAction> }) {
    const classNames = getPortalClassNames(useTheme())
    const [showContextualMenu, setShowContextualMenu] = React.useState(false)
    const profileRef = React.useRef<HTMLButtonElement>(null)

    return <header className={classNames.header}>
        <div className={classNames.headerGroup}>
            <ActionButton className={classNames.titleButton} text="Fluent demo"
                onClick={() => param.dispatch(new SelectScreenAction('Home'))} />
            <span className={classNames.environment}>Local demo / Fictional data</span>
        </div>
        <div className={classNames.headerGroup}>
            <Toggle label="Dark theme" inlineLabel checked={param.model.darkTheme} styles={{ root: { marginBottom: 0 } }}
                onChange={() => param.dispatch(new ActionToggleTheme())} />
            <button ref={profileRef} className={classNames.profileButton} title="User Profile Menu"
                aria-label="User Profile Menu" aria-haspopup="menu" aria-expanded={showContextualMenu}
                onClick={() => setShowContextualMenu(true)}>
                <Persona size={PersonaSize.size32} imageInitials="DV" hidePersonaDetails />
            </button>
            <ContextualMenu target={profileRef} hidden={!showContextualMenu} onDismiss={() => setShowContextualMenu(false)}
                items={[
                    { key: 'userName', text: 'Demo visitor (fictional)', disabled: true },
                    {
                        key: 'portalVNextEnabled', text: 'VNext Portal enabled', canCheck: true,
                        isChecked: param.model.featureFlags.portalVNextEnabled,
                        onClick: () => { param.dispatch(new ActionPortalVNextToggle()) },
                    },
                    {
                        key: 'customerSettings', text: 'Customer settings',
                        onClick: () => { param.dispatch(new SelectScreenAction('CustomerSettings')) },
                    },
                    { key: 'home', text: 'Requests', onClick: () => { param.dispatch(new SelectScreenAction('Home')) } },
                ]} />
        </div>
    </header>
}
