import { db } from './firebase';
import {
    collection, doc, setDoc, getDocs,
    updateDoc, query, where, orderBy,
    serverTimestamp
} from "firebase/firestore";
import { Order, Shipment, Carrier, ShippingZone } from '../types';

export const logisticsService = {

    // Get orders that need fulfillment (Processing status)
    async getFulfillmentQueue() {
        // Removed orderBy to prevent FAILED_PRECONDITION (Missing Index) error.
        // Sorting is done client-side.
        const q = query(collection(db, 'orders'), where('status', '==', 'Processing'));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        // Sort by createdAt ascending (oldest first)
        return orders.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    },

    // Assign order to staff (mock implementation as we don't have staff collection deeply integrated yet)
    async assignOrderToStaff(orderId: string, staffName: string) {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            assignedStaff: staffName,
            updatedAt: serverTimestamp()
        });
    },

    // Create a shipment record and update order status
    async createShipment(orderId: string, shipmentData: Partial<Shipment>) {
        const shipmentId = `SHP-${Date.now()}`;
        const shipmentRef = doc(db, 'shipments', shipmentId);

        await setDoc(shipmentRef, {
            id: shipmentId,
            orderId,
            ...shipmentData,
            status: 'pre_transit',
            createdAt: serverTimestamp()
        });

        // Update order status to Shipped
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: 'Shipped',
            trackingNumber: shipmentData.trackingNumber, // Sync for easy access
            updatedAt: serverTimestamp()
        });

        return shipmentId;
    },

    // Get all active shipments
    async getActiveShipments() {
        const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shipment));
    },

    // Mock carriers
    getCarriers(): Carrier[] {
        return [
            { id: 'c1', name: 'FedEx', code: 'fedex', connected: true },
            { id: 'c2', name: 'UPS', code: 'ups', connected: true },
            { id: 'c3', name: 'DHL', code: 'dhl', connected: false },
            { id: 'c4', name: 'USPS', code: 'usps', connected: true },
            { id: 'c5', name: 'TCS', code: 'tcs', connected: true }, // Local
            { id: 'c6', name: 'Leopards', code: 'leopards', connected: true }, // Local
        ];
    },

    // Shipping Zones
    async getShippingZones(): Promise<ShippingZone[]> {
        const q = query(collection(db, 'shipping_zones'), orderBy('price', 'asc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            const defaults: ShippingZone[] = [
                { id: 'zone_a', name: 'Zone A (Local)', description: 'Peshawar Region', price: 0 },
                { id: 'zone_b', name: 'Zone B (Domestic)', description: 'Major Cities (LHE, KHI, ISL)', price: 500 },
                { id: 'zone_c', name: 'Zone C (National)', description: 'Rest of Pakistan', price: 850 }
            ];
            // Seed defaults
            for (const z of defaults) {
                await setDoc(doc(db, 'shipping_zones', z.id), z);
            }
            return defaults;
        }

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingZone));
    },

    async updateShippingZone(zone: ShippingZone) {
        await setDoc(doc(db, 'shipping_zones', zone.id), zone);
    }
};
