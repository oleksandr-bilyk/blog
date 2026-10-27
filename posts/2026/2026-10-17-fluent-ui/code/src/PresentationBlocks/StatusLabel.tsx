import * as React from 'react'
import { FontSizes, FontWeights, mergeStyles, useTheme } from '@fluentui/react'
import { RequestStatus } from '../../shared/contracts'

export function StatusLabel(param: { value: RequestStatus }) {
    const theme = useTheme()
    const color = param.value === 'Rejected' ? theme.semanticColors.errorText
        : param.value === 'Completed' ? theme.semanticColors.successText : theme.palette.themePrimary
    const className = mergeStyles({
        color,
        fontSize: FontSizes.small,
        fontWeight: FontWeights.semibold,
    })
    return <span className={className}>{param.value}</span>
}
