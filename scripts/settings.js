class SettingsManager {
    constructor() {
        this.users = [];
        this.init();
    }

    async init() {
        // Only load if settings page is active or when tab is clicked
        // For now, let's load when initialized
        await this.loadUsers();
    }

    async loadUsers() {
        try {
            if (window.api) {
                this.users = await window.api.getUsers();
                this.renderUsers();
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    renderUsers() {
        const container = document.getElementById("usersListContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="users-table-container">
                <h3>إدارة المستخدمين (المسؤولين)</h3>
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>اسم المستخدم</th>
                            <th>الاسم الكامل</th>
                            <th>الدور</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.username}</td>
                                <td>${user.full_name}</td>
                                <td>${user.role}</td>
                                <td>${user.status}</td>
                                <td>
                                    <button class="btn btn-error btn-sm delete-user-btn" data-id="${user.id}">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        document.querySelectorAll(".delete-user-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteUser(id);
            });
        });
    }

    async deleteUser(id) {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                if (window.api) {
                    await window.api.deleteUser(id);
                    this.showToast('تم حذف المستخدم بنجاح', 'success');
                    await this.loadUsers();
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                // Show error from backend (e.g., last admin check)
                this.showToast(error.message.replace('Error: ', ''), 'error');
            }
        }
    }

    showToast(message, type = 'info') {
        // Reuse existing toast logic or create new
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
    if (document.getElementById("settings-page")) {
        window.settingsManager = new SettingsManager();
    }
});
