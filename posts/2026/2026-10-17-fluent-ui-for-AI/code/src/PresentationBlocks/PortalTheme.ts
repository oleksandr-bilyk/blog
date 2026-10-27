import { createTheme } from '@fluentui/react'

const lightTheme = createTheme({})
const darkTheme = createTheme({
    palette: {
        themePrimary: '#6cb8f6',
        white: '#202020',
        black: '#ffffff',
        neutralLighterAlt: '#252525',
        neutralLighter: '#2b2b2b',
        neutralLight: '#383838',
        neutralQuaternaryAlt: '#424242',
        neutralQuaternary: '#4a4a4a',
        neutralTertiaryAlt: '#666666',
        neutralTertiary: '#b3b3b3',
        neutralSecondary: '#d0d0d0',
        neutralPrimaryAlt: '#e0e0e0',
        neutralPrimary: '#f3f2f1',
        neutralDark: '#ffffff',
    },
    isInverted: true,
})

export function getPortalTheme(dark: boolean) {
    return dark ? darkTheme : lightTheme
}
