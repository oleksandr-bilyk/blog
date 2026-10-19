import { describe, expect, it } from 'vitest'
import { createCustomers, createRequests } from '../server/data'
import { SelectScreenAction } from '../src/ApplicationStateModel'
import * as CustomersFilter from '../src/CustomersFilter/CustomersFilterModel'
import * as CustomerSettings from '../src/CustomerSettings/CustomerSettingsModel'
import * as Index from '../src/IndexModel'
import * as Records from '../src/RequestRecords/RequestRecordsModel'
import { ActionPortalVNextToggle } from '../src/UserProfile/FeatureFlags'

function initializedModel() {
    return Index.updateIndexModel(Index.getIndexModelInitial(), new Index.ActionIndexInitialized({
        requests: createRequests(),
        customers: createCustomers(),
    }))
}

describe('composed React-Redux models', () => {
    it('initializes data without mutating the original model', () => {
        const original = Index.getIndexModelInitial()
        const model = Index.updateIndexModel(original, new Index.ActionIndexInitialized({
            requests: createRequests(), customers: createCustomers(),
        }))
        expect(original.initializable.state).toBe('Initializing')
        expect(original.application.screens.home.items).toEqual([])
        expect(model.initializable.state).toBe('Initialized')
        expect(model.application.screens.home.items).toHaveLength(8)
        expect(model.application.screens.customerSettings.customers).toHaveLength(3)
    })

    it('projects the three tabs, including rejected requests in Completed', () => {
        const model = initializedModel().application
        expect(Records.getRecordsForState(model.screens.home, model.customersFilter, 'OrdersPending')).toHaveLength(3)
        expect(Records.getRecordsForState(model.screens.home, model.customersFilter, 'DeliveriesPending')).toHaveLength(2)
        expect(Records.getRecordsForState(model.screens.home, model.customersFilter, 'Completed')).toHaveLength(3)
    })

    it('filters customers and search while clearing hidden selections', () => {
        let model = initializedModel()
        const update = (action: Index.IndexAction) => { model = Index.updateIndexModel(model, action) }
        update(new Records.ActionItemsSelected(['DEMO-102']))
        update(new CustomersFilter.ActionAllCustomersSelectedToggleChanged(false))
        expect(Records.getVisibleRecords(model.application.screens.home, model.application.customersFilter)).toHaveLength(0)
        expect(model.application.screens.home.itemsSelected).toEqual([])
        update(new CustomersFilter.ActionAddCustomer(createCustomers()[0]))
        expect(Records.getVisibleRecords(model.application.screens.home, model.application.customersFilter)).toHaveLength(2)
        update(new Records.ActionSearchRequested('  DEMO-101  '))
        expect(Records.getVisibleRecords(model.application.screens.home, model.application.customersFilter)
            .map(item => item.id)).toEqual(['DEMO-101'])
        update(new CustomersFilter.ActionRemoveCustomer(createCustomers()[0]))
        expect(Records.getVisibleRecords(model.application.screens.home, model.application.customersFilter)).toEqual([])
    })

    it('does not add duplicate customers and keeps the selection sorted', () => {
        let filter = CustomersFilter.getInitialModel()
        for (const customer of [createCustomers()[2], createCustomers()[0], createCustomers()[0]]) {
            filter = CustomersFilter.updateModel(filter, new CustomersFilter.ActionAddCustomer(customer))
        }
        expect(filter.selectedItems.map(item => item.name)).toEqual(['Cedar Crafts', 'Willow Works'])
    })

    it('changes request outcomes only after a successful API result', () => {
        let model = initializedModel()
        const request = { ids: ['DEMO-101'], outcome: 'Completed' as const }
        model = Index.updateIndexModel(model, new Records.ActionItemsSelected(request.ids))
        model = Index.updateIndexModel(model, new Records.ActionResolveRequested(request))
        expect(model.application.screens.home.items[0].status).toBe('Pending')
        expect(model.application.screens.home.operation.state).toBe('Running')
        const running = model
        model = Index.updateIndexModel(model, new Index.ActionIndexInitializationRequested())
        expect(model).toBe(running)
        model = Index.updateIndexModel(model, new Records.ActionResolveSucceeded([
            { ...createRequests()[0], status: 'Completed' },
        ], 'Completed'))
        expect(model.application.screens.home.items[0].status).toBe('Completed')
        expect(model.application.screens.home.itemsSelected).toEqual([])
        expect(model.lastAction).toBe('ActionResolveSucceeded')
    })

    it('retains data and selection after failure so an operation can be retried', () => {
        let model = initializedModel()
        model = Index.updateIndexModel(model, new Records.ActionItemsSelected(['DEMO-101']))
        model = Index.updateIndexModel(model, new Records.ActionResolveRequested({ ids: ['DEMO-101'], outcome: 'Rejected' }))
        model = Index.updateIndexModel(model, new Records.ActionResolveFailed('Mock API unavailable'))
        expect(model.application.screens.home.items[0].status).toBe('Pending')
        expect(model.application.screens.home.itemsSelected).toEqual(['DEMO-101'])
        expect(model.application.screens.home.operation).toEqual({ state: 'Failed', errorMessage: 'Mock API unavailable' })
        model = Index.updateIndexModel(model, new Records.ActionResolveRequested({ ids: ['DEMO-101'], outcome: 'Rejected' }))
        expect(model.application.screens.home.operation.state).toBe('Running')
    })

    it('exposes initialization failure and increments the request version on retry', () => {
        let model = Index.getIndexModelInitial()
        model = Index.updateIndexModel(model, new Index.ActionIndexInitializationFailed('Offline'))
        expect(model.initializable).toEqual({ state: 'Failed', version: 0, errorMessage: 'Offline' })
        model = Index.updateIndexModel(model, new Index.ActionIndexInitializationRequested())
        expect(model.initializable).toEqual({ state: 'Initializing', version: 1 })
    })

    it('saves fictional customer settings through typed operations', () => {
        let model = initializedModel()
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSettingsChanged({
            deliveryMethod: 'Delivery', notificationsEnabled: true,
        }))
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSaveRequested())
        expect(model.application.screens.customerSettings.operation).toEqual({
            state: 'Running', id: 'customer-1', settings: { deliveryMethod: 'Delivery', notificationsEnabled: true },
        })
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSaveSucceeded({
            ...createCustomers()[0], deliveryMethod: 'Delivery', notificationsEnabled: true,
        }))
        expect(model.application.screens.customerSettings.customers[0].notificationsEnabled).toBe(true)
        model = Index.updateIndexModel(model, new ActionPortalVNextToggle())
        expect(model.application.featureFlags.portalVNextEnabled).toBe(false)
        model = Index.updateIndexModel(model, new SelectScreenAction('CustomerSettings'))
        expect(model.application.screenSelected).toBe('CustomerSettings')
    })

    it('keeps settings edits after a failed save and does not switch customers while saving', () => {
        let model = initializedModel()
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSettingsChanged({
            deliveryMethod: 'Delivery', notificationsEnabled: true,
        }))
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSaveRequested())
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSelectCustomer('customer-2'))
        expect(model.application.screens.customerSettings.selectedId).toBe('customer-1')
        model = Index.updateIndexModel(model, new CustomerSettings.ActionSaveFailed('Offline'))
        expect(model.application.screens.customerSettings.draft?.notificationsEnabled).toBe(true)
        expect(model.application.screens.customerSettings.customers[0].notificationsEnabled).toBe(false)
    })
})
