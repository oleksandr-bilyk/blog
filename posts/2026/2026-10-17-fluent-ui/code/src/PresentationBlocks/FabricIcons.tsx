import * as React from 'react'
import { registerIcons } from '@fluentui/react'
import {
    AddIcon, ArchiveIcon, BlockedIcon, CancelIcon, CheckMarkIcon,
    ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon,
    ClearIcon, DeployIcon, ErrorBadgeIcon, FilterIcon, InfoIcon,
    RefreshIcon, ReleaseDefinitionIcon, RemoveFilterIcon, SearchIcon, WarningIcon
} from '@fluentui/react-icons-mdl2'

// These are the portal's Fluent glyphs, bundled as SVG rather than fetched from a font CDN.
export function registerDemoIcons() {
    registerIcons({
        icons: {
            Add: <AddIcon />, Archive: <ArchiveIcon />, Blocked: <BlockedIcon />,
            Cancel: <CancelIcon />, CheckMark: <CheckMarkIcon />,
            ChevronDown: <ChevronDownIcon />, ChevronLeft: <ChevronLeftIcon />,
            ChevronRight: <ChevronRightIcon />, ChevronUp: <ChevronUpIcon />,
            Clear: <ClearIcon />, Deploy: <DeployIcon />, ErrorBadge: <ErrorBadgeIcon />,
            Filter: <FilterIcon />, Info: <InfoIcon />, Refresh: <RefreshIcon />,
            ReleaseDefinition: <ReleaseDefinitionIcon />, RemoveFilter: <RemoveFilterIcon />,
            Search: <SearchIcon />, Warning: <WarningIcon />
        }
    })
}
