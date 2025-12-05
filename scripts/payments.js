class PaymentsManager {
    constructor() {
        this.payments = [];
        this.init();
    }

    async init() {
        await this.loadPayments();
        this.setupEventListeners();
    }

    async loadPayments() {
        try {
            if (window.api) {
                this.payments = await window.api.getPayments();
                this.renderPayments();
            }
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    }

    setupEventListeners() {
        // Add listener for renewal button if it exists in a modal or page
    }

    renderPayments() {
        const container = document.getElementById("paymentsTableContainer");
        if (!container) return;

        container.innerHTML = `
            <table class="payments-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>العضو</th>
                        <th>المبلغ</th>
                        <th>طريقة الدفع</th>
                        <th>التاريخ</th>
                        <th>الوصف</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.payments.map(payment => `
                        <tr>
                            <td>${payment.id}</td>
                            <td>${payment.member_name || 'غير معروف'}</td>
                            <td>${payment.amount}</td>
                            <td>${payment.method}</td>
                            <td>${new Date(payment.payment_date).toLocaleDateString('ar-SA')}</td>
                            <td>${payment.description || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async renewSubscription(memberId, duration, amount) {
        try {
            if (window.api) {
                await window.api.renewSubscription({
                    memberId,
                    durationMonths: parseInt(duration),
                    amount: parseFloat(amount),
                    paymentMethod: 'cash', // Default for now
                    processedBy: 1 // Default admin ID for now
                });
                this.showToast('تم تجديد الاشتراك بنجاح', 'success');
                await this.loadPayments();
                // Also refresh members list if possible
                if (window.membersPage) {
                    await window.membersPage.loadMembers();
                }
            }
        } catch (error) {
            console.error('Error renewing subscription:', error);
            this.showToast(error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("payments-page")) {
        window.paymentsManager = new PaymentsManager();
    }
});
