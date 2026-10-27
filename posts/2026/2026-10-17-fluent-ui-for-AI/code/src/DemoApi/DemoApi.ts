import { z } from 'zod'
import {
    customerSchema,
    customersSchema,
    requestsSchema,
    CustomerSettings,
    Resolution,
} from '../../shared/contracts'

async function send(path: string, signal: AbortSignal, init?: RequestInit): Promise<unknown> {
    const response = await fetch(path, { ...init, signal })
    if (!response.ok) {
        const result = z.object({ error: z.string() }).safeParse(await response.json())
        throw new Error(result.success
            ? result.data.error
            : `Mock API returned ${response.status}. Check the local server and retry.`)
    }
    return response.json()
}

export async function getInitializationData(signal: AbortSignal) {
    const [requests, customers] = await Promise.all([
        send('/api/requests', signal),
        send('/api/customers', signal),
    ])
    return {
        requests: requestsSchema.parse(requests),
        customers: customersSchema.parse(customers),
    }
}

export type InitializationData = Awaited<ReturnType<typeof getInitializationData>>

export async function resolveRequests(value: Resolution, signal: AbortSignal) {
    return requestsSchema.parse(await send('/api/requests/resolve', signal, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
    }))
}

export async function saveCustomerSettings(id: string, settings: CustomerSettings, signal: AbortSignal) {
    return customerSchema.parse(await send(`/api/customers/${encodeURIComponent(id)}`, signal, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    }))
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'The mock API encountered an unexpected error.'
}
