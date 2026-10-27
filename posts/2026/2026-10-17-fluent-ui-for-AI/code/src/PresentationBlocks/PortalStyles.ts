import { FontSizes, FontWeights, getFocusStyle, ITheme, mergeStyleSets } from '@fluentui/react'
import {
    columnGapItems,
    columnGapItemsMajor,
    contentMaxWidth,
    panelBorderPadding,
    rowGapItemsMajor,
    verticalPanelGap,
} from './GridLayout'

export function getPortalClassNames(theme: ITheme) {
    const { palette, semanticColors } = theme
    return mergeStyleSets({
        root: {
            minHeight: '100vh',
            background: palette.white,
            color: semanticColors.bodyText,
            fontFamily: theme.fonts.medium.fontFamily,
            fontSize: FontSizes.medium,
        },
        content: {
            maxWidth: contentMaxWidth,
            margin: 'auto',
            padding: panelBorderPadding,
            minWidth: 0,
            selectors: { ':focus': { outline: 'none' } },
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: columnGapItemsMajor,
            marginBottom: rowGapItemsMajor,
        },
        headerGroup: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: columnGapItemsMajor },
        titleButton: {
            padding: 0,
            height: 'auto',
            selectors: { '.ms-Button-label': { margin: 0, fontSize: FontSizes.xxLarge, fontWeight: FontWeights.semibold } },
        },
        environment: { color: palette.neutralSecondary, fontSize: FontSizes.small },
        profileButton: [
            getFocusStyle(theme),
            { background: 'transparent', border: 0, cursor: 'pointer', padding: '2px', borderRadius: '50%' },
        ],
        loading: { maxWidth: '480px', margin: '80px auto', padding: panelBorderPadding },
        requests: { marginTop: rowGapItemsMajor, minWidth: 0 },
        tabs: { overflowX: 'auto', whiteSpace: 'nowrap' },
        toolbar: {
            display: 'flex', alignItems: 'center', flexWrap: 'wrap',
            gap: columnGapItemsMajor, marginTop: rowGapItemsMajor, marginBottom: rowGapItemsMajor,
        },
        search: { flex: '1 1 240px', maxWidth: '420px' },
        tableScroll: { overflowX: 'auto', selectors: { '.ms-DetailsList': { minWidth: '780px' } } },
        tableFooter: { color: palette.neutralSecondary, fontSize: FontSizes.small, padding: `${rowGapItemsMajor} 0` },
        empty: { padding: '24px', textAlign: 'center' },
        panelContent: { marginTop: verticalPanelGap, display: 'grid', gap: rowGapItemsMajor },
        panelActions: { display: 'flex', flexWrap: 'wrap', gap: columnGapItems, paddingBottom: rowGapItemsMajor },
        detailList: {
            display: 'grid', gridTemplateColumns: '120px 1fr', gap: rowGapItemsMajor,
            selectors: { dt: { fontWeight: FontWeights.semibold }, dd: { margin: 0 } },
        },
        listRow: [
            getFocusStyle(theme),
            {
                display: 'flex', alignItems: 'center', gap: columnGapItems,
                borderBottom: `1px solid ${semanticColors.bodyDivider}`,
                selectors: { ':hover': { background: palette.neutralLighter } },
            },
        ],
        settingsLayout: {
            display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)',
            gap: '24px', marginTop: '24px',
            selectors: { '@media (max-width: 650px)': { gridTemplateColumns: '1fr' } },
        },
        customerList: { display: 'grid', gap: columnGapItems, marginTop: rowGapItemsMajor },
        settingsForm: { maxWidth: '520px', display: 'grid', gap: rowGapItemsMajor, alignContent: 'start' },
        footer: { marginTop: '24px', color: palette.neutralSecondary, fontSize: FontSizes.small },
        skipLink: {
            position: 'absolute', top: '-100px', left: panelBorderPadding, zIndex: 10,
            padding: panelBorderPadding, background: palette.white, color: palette.themePrimary,
            selectors: { ':focus': { top: panelBorderPadding } },
        },
    })
}
