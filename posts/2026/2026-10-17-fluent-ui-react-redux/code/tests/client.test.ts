import { describe, expect, it, vi } from 'vitest'
import { createCustomers, createRequests } from '../server/data'
import { getInitializationData, resolveRequests, saveCustomerSettings } from '../src/DemoApi/DemoApi'

describe('anonymous same-origin API client', () => {
    it('loads only the local requests and customers routes', async () => {
        const fetch = vi.fn()
            .mockResolvedValueOnce(Response.json(createRequests()))
            .mockResolvedValueOnce(Response.json(createCustomers()))
        vi.stubGlobal('fetch', fetch)
        const data = await getInitializationData(new AbortController().signal)
        expect(data.requests).toHaveLength(8)
        expect(data.customers).toHaveLength(3)
        expect(fetch.mock.calls.map(call => call[0])).toEqual(['/api/requests', '/api/customers'])
        expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    })

    it('validates data returned by the server', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([{ id: 'invalid' }])))
        await expect(getInitializationData(new AbortController().signal)).rejects.toThrow()
    })

    it('surfaces server errors instead of returning success-shaped fallback data', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Already completed' }, { status: 409 })))
        await expect(resolveRequests({ ids: ['DEMO-101'], outcome: 'Completed' }, new AbortController().signal))
            .rejects.toThrow('Already completed')
    })

    it('sends only synthetic customer settings with no authentication headers', async () => {
        const fetch = vi.fn().mockResolvedValue(Response.json(createCustomers()[0]))
        vi.stubGlobal('fetch', fetch)
        const settings = { deliveryMethod: 'Collection' as const, notificationsEnabled: false }
        await saveCustomerSettings('customer-1', settings, new AbortController().signal)
        expect(fetch).toHaveBeenCalledWith('/api/customers/customer-1', expect.objectContaining({
            method: 'PATCH', body: JSON.stringify(settings), headers: { 'Content-Type': 'application/json' },
        }))
    })
})
