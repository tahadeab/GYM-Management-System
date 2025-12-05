class TrainersManager {
    constructor() {
        this.trainers = [];
        this.init();
    }

    async init() {
        await this.loadTrainers();
        this.setupEventListeners();
    }

    async loadTrainers() {
        try {
            if (window.api) {
                this.trainers = await window.api.getTrainers();
            } else {
                console.warn('API not available');
                this.trainers = [];
            }
            this.renderTrainers();
        } catch (error) {
            console.error('Error loading trainers:', error);
            this.showToast('فشل في تحميل بيانات المدربين', 'error');
        }
    }

    setupEventListeners() {
        const addTrainerBtn = document.getElementById("addTrainerBtn");
        const trainerModal = document.getElementById("trainerModal");
        const trainerForm = document.getElementById("trainerForm");
        const modalCloseBtn = trainerModal?.querySelector(".modal-close");

        if (addTrainerBtn) {
            addTrainerBtn.addEventListener("click", () => {
                this.openTrainerModal();
            });
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener("click", () => {
                this.closeTrainerModal();
            });
        }

        if (trainerForm) {
            trainerForm.addEventListener("submit", (e) => {
                this.handleTrainerFormSubmit(e);
            });
        }

        if (trainerModal) {
            trainerModal.addEventListener("click", (e) => {
                if (e.target === trainerModal) {
                    this.closeTrainerModal();
                }
            });
        }
    }

    openTrainerModal(trainer = null) {
        const trainerModal = document.getElementById("trainerModal");
        const trainerForm = document.getElementById("trainerForm");

        if (!trainerModal || !trainerForm) return;

        trainerForm.reset();

        if (trainer) {
            document.getElementById("trainerName").value = trainer.name || '';
            document.getElementById("trainerEmail").value = trainer.email || '';
            document.getElementById("trainerPhone").value = trainer.phone || '';
            document.getElementById("trainerSpecialty").value = trainer.specialty || '';
            document.getElementById("trainerStatus").value = trainer.status || 'active';
            trainerModal.dataset.editId = trainer.id;
        } else {
            delete trainerModal.dataset.editId;
        }

        trainerModal.classList.add("show");
    }

    closeTrainerModal() {
        const trainerModal = document.getElementById("trainerModal");
        if (trainerModal) {
            trainerModal.classList.remove("show");
        }
    }

    async handleTrainerFormSubmit(e) {
        e.preventDefault();

        const trainerModal = document.getElementById("trainerModal");
        const editId = trainerModal?.dataset.editId;

        const trainerData = {
            name: document.getElementById("trainerName").value,
            email: document.getElementById("trainerEmail").value,
            phone: document.getElementById("trainerPhone").value,
            specialty: document.getElementById("trainerSpecialty").value,
            status: document.getElementById("trainerStatus").value,
            // Add defaults for other fields
            hire_date: new Date().toISOString(),
            experience_years: 0,
            salary: 0
        };

        try {
            if (editId) {
                if (window.api) {
                    await window.api.updateTrainer(parseInt(editId), trainerData);
                }
            } else {
                if (window.api) {
                    await window.api.addTrainer(trainerData);
                }
            }

            this.showToast(editId ? 'تم تحديث بيانات المدرب بنجاح' : 'تم إضافة المدرب بنجاح', 'success');
            this.closeTrainerModal();
            await this.loadTrainers();
        } catch (error) {
            console.error('Error saving trainer:', error);
            this.showToast(error.message || 'حدث خطأ أثناء حفظ البيانات', 'error');
        }
    }

    renderTrainers() {
        const trainersTableBody = document.getElementById("trainersTableBody");
        if (!trainersTableBody) return;

        trainersTableBody.innerHTML = "";

        if (this.trainers.length === 0) {
            const row = trainersTableBody.insertRow();
            row.innerHTML = `<td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">لا يوجد مدربين حالياً</td>`;
            return;
        }

        this.trainers.forEach(trainer => {
            const row = trainersTableBody.insertRow();
            const statusClass = trainer.status === 'active' ? 'active' : 'inactive';
            const statusText = trainer.status === 'active' ? 'نشط' : 'غير نشط';

            row.innerHTML = `
                <td>${trainer.id}</td>
                <td>${trainer.name}</td>
                <td>${trainer.email || '-'}</td>
                <td>${trainer.phone || '-'}</td>
                <td>${trainer.specialty || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-info edit-trainer-btn" data-id="${trainer.id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-error delete-trainer-btn" data-id="${trainer.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            `;
        });

        this.addEventListenersToButtons();
    }

    addEventListenersToButtons() {
        document.querySelectorAll(".edit-trainer-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const trainerId = parseInt(e.currentTarget.dataset.id);
                const trainer = this.trainers.find(t => t.id === trainerId);
                if (trainer) {
                    this.openTrainerModal(trainer);
                }
            });
        });

        document.querySelectorAll(".delete-trainer-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const trainerId = parseInt(e.currentTarget.dataset.id);
                this.deleteTrainer(trainerId);
            });
        });
    }

    async deleteTrainer(id) {
        if (confirm('هل أنت متأكد من حذف هذا المدرب؟')) {
            try {
                if (window.api) {
                    await window.api.deleteTrainer(id);
                    this.showToast('تم حذف المدرب بنجاح', 'success');
                    await this.loadTrainers();
                }
            } catch (error) {
                console.error('Error deleting trainer:', error);
                this.showToast('حدث خطأ أثناء الحذف', 'error');
            }
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
    // Initialize only if we are on the dashboard page
    if (document.getElementById("trainers-page")) {
        window.trainersManager = new TrainersManager();
    }
});
