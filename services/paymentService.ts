
import { db } from './firebase';
import {
    collection, doc, setDoc, getDoc, getDocs,
    updateDoc, query, where, orderBy,
    serverTimestamp, Timestamp
} from "firebase/firestore";
import { Payment, Invoice } from '../types';

export const paymentService = {
    // Generate invoice number
    generateInvoiceNumber: () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}${month}${day}-${random}`;
    },

    // Create payment record
    async createPayment(paymentData: Partial<Payment>) {
        const paymentId = `PAY-${Date.now()}`;
        const invoiceNumber = this.generateInvoiceNumber();

        const paymentRef = doc(db, 'payments', paymentId);

        await setDoc(paymentRef, {
            id: paymentId,
            invoiceNumber,
            ...paymentData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return { paymentId, invoiceNumber };
    },

    // Get payments with filters
    async getPayments(filters: any = {}) {
        let q = query(collection(db, 'payments'));

        if (filters.status && filters.status !== 'all') {
            q = query(q, where('paymentStatus', '==', filters.status));
        }

        // Note: Multiple inequalities in Firestore require composite indexes. 
        // We'll sort by createdAt desc for now and filter status client-side if needed for complex queries without indexes.
        // For this implementation, we will stick to basic queries.
        q = query(q, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);

        // Client-side filtering for dates to avoid index issues for now, or ensure indexes are created.
        let payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));

        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate).getTime();
            const end = new Date(filters.endDate).getTime();
            payments = payments.filter(p => {
                // Handle both Firestore Timestamp and number/string
                const created = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt).getTime();
                return created >= start && created <= end;
            });
        }

        return payments;
    },

    // Update payment status
    async updatePaymentStatus(paymentId: string, newStatus: string, notes = '') {
        const paymentRef = doc(db, 'payments', paymentId);

        const updateData: any = {
            paymentStatus: newStatus,
            updatedAt: serverTimestamp()
        };

        if (notes) {
            updateData.notes = notes;
        }

        if (newStatus === 'completed') {
            updateData.paidAt = serverTimestamp();
        }

        if (newStatus === 'refunded') {
            updateData.refundedAt = serverTimestamp();
        }

        await updateDoc(paymentRef, updateData);

        // If payment is completed, also update order status
        if (newStatus === 'completed') {
            const paymentDoc = await getDoc(paymentRef);
            const paymentData = paymentDoc.data() as Payment;

            if (paymentData?.orderId) {
                const orderRef = doc(db, 'orders', paymentData.orderId);
                await updateDoc(orderRef, {
                    paymentStatus: 'Paid',
                    updatedAt: serverTimestamp()
                });
            }
        }
    },

    // Process refund
    async processRefund(paymentId: string, refundAmount: number, reason: string) {
        const paymentRef = doc(db, 'payments', paymentId);
        const paymentDoc = await getDoc(paymentRef);
        const paymentData = paymentDoc.data() as Payment;

        const newRefundAmount = (paymentData.refundAmount || 0) + refundAmount;
        const newStatus = newRefundAmount >= paymentData.amount ? 'refunded' : 'partially_refunded';

        await updateDoc(paymentRef, {
            refundAmount: newRefundAmount,
            paymentStatus: newStatus,
            refundedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            notes: `${paymentData.notes || ''}\nRefund: $${refundAmount} - ${reason}`
        });

        return true;
    },

    // Get payment analytics
    async getPaymentAnalytics(startDate: Date, endDate: Date) {
        // Re-use getPayments with client side filtering for specific range
        const payments = await this.getPayments({ startDate, endDate });

        const analytics = {
            totalRevenue: 0,
            totalTransactions: payments.length,
            pendingPayments: 0,
            completedPayments: 0,
            failedPayments: 0,
            refundedAmount: 0,
            byMethod: {} as Record<string, number>,
            dailyRevenue: {} as Record<string, number>
        };

        payments.forEach(payment => {
            // Basic safeguard for amount
            const amount = Number(payment.amount) || 0;

            if (payment.paymentStatus === 'completed') {
                analytics.totalRevenue += amount;
                analytics.completedPayments++;
            } else if (payment.paymentStatus === 'pending') {
                analytics.pendingPayments++;
            } else if (payment.paymentStatus === 'failed') {
                analytics.failedPayments++;
            }

            if (payment.refundAmount) analytics.refundedAmount += payment.refundAmount;

            // Group by payment method
            const method = payment.paymentMethod || 'unknown';
            analytics.byMethod[method] = (analytics.byMethod[method] || 0) + amount;

            // Group by date (if completed)
            if (payment.createdAt) { // Using createdAt for chart logic for now to show activity
                const dateObj = payment.createdAt?.seconds ? new Date(payment.createdAt.seconds * 1000) : new Date(payment.createdAt);
                const date = dateObj.toISOString().split('T')[0];
                if (payment.paymentStatus === 'completed') {
                    analytics.dailyRevenue[date] = (analytics.dailyRevenue[date] || 0) + amount;
                }
            }
        });

        return analytics;
    },

    // Create B2B invoice
    async createInvoice(invoiceData: Partial<Invoice>) {
        const invoiceId = `INV-${Date.now()}`;
        const invoiceNumber = this.generateInvoiceNumber();

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (invoiceData.paymentTerms || 30));

        const invoiceRef = doc(db, 'invoices', invoiceId);

        await setDoc(invoiceRef, {
            id: invoiceId,
            invoiceNumber,
            ...invoiceData,
            dueDate: Timestamp.fromDate(dueDate),
            status: 'draft',
            createdAt: serverTimestamp()
        });

        return { invoiceId, invoiceNumber };
    }
};
