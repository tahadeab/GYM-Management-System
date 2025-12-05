// JavaScript for members page functionality
class MembersPage {
    constructor() {
        this.members = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredMembers = [];
        this.init();
    }

    async init() {
        await this.loadMembers();
        this.setupEventListeners();
        this.renderMembers();
    }

    async loadMembers() {
        try {
            if (window.api) {
                this.members = await window.api.getMembers();
            } else {
                console.warn('API not available, using empty list');
                this.members = [];
            }
            this.filteredMembers = [...this.members];
            this.renderMembers();
        } catch (error) {
            console.error('Error loading members:', error);
            this.showToast('فشل في تحميل بيانات الأعضاء', 'error');
        }
    }

    setupEventListeners() {
        const addMemberBtn = document.getElementById("addMemberBtn");
        const memberModal = document.getElementById("memberModal");
        const memberForm = document.getElementById("memberForm");
        const modalCloseBtn = memberModal?.querySelector(".modal-close");
        const membersSearch = document.getElementById("membersSearch");
        const membersFilter = document.getElementById("membersFilter");

        if (addMemberBtn) {
            addMemberBtn.addEventListener("click", () => {
                this.openMemberModal();
            });
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener("click", () => {
                this.closeMemberModal();
            });
        }

        if (memberForm) {
            memberForm.addEventListener("submit", (e) => {
                this.handleMemberFormSubmit(e);
            });
        }

        if (membersSearch) {
            membersSearch.addEventListener("input", (e) => {
                this.handleSearch(e.target.value);
            });
        }

        if (membersFilter) {
            membersFilter.addEventListener("change", (e) => {
                this.handleFilter(e.target.value);
            });
        }

        // إغلاق النافذة المنبثقة عند النقر خارجها
        if (memberModal) {
            memberModal.addEventListener("click", (e) => {
                if (e.target === memberModal) {
                    this.closeMemberModal();
                }
            });
        }
    }

    openMemberModal(member = null) {
        const memberModal = document.getElementById("memberModal");
        const memberForm = document.getElementById("memberForm");

        if (!memberModal || !memberForm) return;

        memberForm.reset();

        if (member) {
            // تعديل عضو موجود
            document.getElementById("memberName").value = member.name || '';
            document.getElementById("memberEmail").value = member.email || '';
            document.getElementById("memberPhone").value = member.phone || '';
            document.getElementById("memberJoinDate").value = member.join_date ? member.join_date.split('T')[0] : '';
            // Handle subscription end date if available, or calculate default
            const expiry = member.subscription_end_date ? member.subscription_end_date.split('T')[0] : '';
            document.getElementById("memberExpiryDate").value = expiry;

            document.getElementById("memberStatus").value = member.status || 'active';
            memberModal.dataset.editId = member.id;
        } else {
            // إضافة عضو جديد
            delete memberModal.dataset.editId;
            // تعيين تاريخ الانضمام إلى اليوم
            const today = new Date().toISOString().split('T')[0];
            document.getElementById("memberJoinDate").value = today;
            // تعيين تاريخ انتهاء الاشتراك إلى شهر من اليوم (افتراضي)
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById("memberExpiryDate").value = nextMonth.toISOString().split('T')[0];
        }

        memberModal.classList.add("show");
    }

    closeMemberModal() {
        const memberModal = document.getElementById("memberModal");
        if (memberModal) {
            memberModal.classList.remove("show");
        }
    }

    async handleMemberFormSubmit(e) {
        e.preventDefault();

        const memberModal = document.getElementById("memberModal");
        const editId = memberModal?.dataset.editId;

        // Note: Mapping form fields to DB schema
        const memberData = {
            name: document.getElementById("memberName").value,
            email: document.getElementById("memberEmail").value,
            phone: document.getElementById("memberPhone").value,
            join_date: document.getElementById("memberJoinDate").value, // DB expects snake_case potentially, but let's stick to what addMember expects
            // For now, passing these as is. The backend addMember expects:
            // name, phone, email, date_of_birth, gender, address, emergency..., medical..., membership_type, photo
            // We might need to adjust the form or the backend handler if fields are missing.
            // For this fix, I'll map what we have.
            status: document.getElementById("memberStatus").value
        };

        // Add extra fields required by backend if missing in form
        memberData.membership_type = 'monthly'; // Default

        try {
            if (editId) {
                // Update
                if (window.api) {
                    await window.api.updateMember(parseInt(editId), memberData);
                }
            } else {
                // Add
                if (window.api) {
                    await window.api.addMember(memberData);
                }
            }

            this.showToast(editId ? 'تم تحديث بيانات العضو بنجاح' : 'تم إضافة العضو بنجاح', 'success');
            this.closeMemberModal();
            await this.loadMembers(); // Reload from DB
        } catch (error) {
            console.error('Error saving member:', error);
            this.showToast('حدث خطأ أثناء حفظ البيانات', 'error');
        }
    }

    handleSearch(searchTerm) {
        this.applyCurrentFilter(searchTerm);
        this.renderMembers();
    }

    handleFilter(filterValue) {
        this.applyCurrentFilter(null, filterValue);
        this.renderMembers();
    }

    applyCurrentFilter(searchTerm = null, filterValue = null) {
        const search = searchTerm !== null ? searchTerm : document.getElementById("membersSearch")?.value || '';
        const filter = filterValue !== null ? filterValue : document.getElementById("membersFilter")?.value || 'all';

        this.filteredMembers = this.members.filter(member => {
            // تطبيق البحث
            const matchesSearch = search === '' ||
                (member.name && member.name.toLowerCase().includes(search.toLowerCase())) ||
                (member.email && member.email.toLowerCase().includes(search.toLowerCase())) ||
                (member.phone && member.phone.includes(search));

            // تطبيق الفلتر
            let matchesFilter = true;
            if (filter === 'active') {
                matchesFilter = member.status === 'active';
            } else if (filter === 'inactive') {
                matchesFilter = member.status === 'inactive';
            } else if (filter === 'expired') {
                // Check subscription status if available
                matchesFilter = member.subscription_status === 'expired';
            }

            return matchesSearch && matchesFilter;
        });

        this.currentPage = 1; // إعادة تعيين الصفحة الحالية
    }

    renderMembers() {
        const membersTableBody = document.getElementById("membersTableBody");
        if (!membersTableBody) return;

        // حساب البيانات للصفحة الحالية
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentMembers = this.filteredMembers.slice(startIndex, endIndex);

        membersTableBody.innerHTML = "";

        if (currentMembers.length === 0) {
            const row = membersTableBody.insertRow();
            row.innerHTML = `<td colspan="8" style="text-align: center; padding: 2rem; color: #6b7280;">لا توجد أعضاء مطابقة للبحث</td>`;
            return;
        }

        currentMembers.forEach(member => {
            const row = membersTableBody.insertRow();
            const statusText = this.getStatusText(member);
            const statusClass = this.getStatusClass(member);

            // Handle dates safely
            const joinDate = member.join_date ? new Date(member.join_date).toLocaleDateString('ar-SA') : '-';
            const endDate = member.subscription_end_date ? new Date(member.subscription_end_date).toLocaleDateString('ar-SA') : '-';

            row.innerHTML = `
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.email || '-'}</td>
                <td>${member.phone || '-'}</td>
                <td>${joinDate}</td>
                <td>${endDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-info edit-btn" data-id="${member.id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-error delete-btn" data-id="${member.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            `;
        });

        this.addEventListenersToButtons();
        this.updatePagination();
    }

    getStatusText(member) {
        if (member.status === 'inactive') return 'غير نشط';
        if (member.subscription_status === 'expired') return 'منتهي الصلاحية';
        return 'نشط';
    }

    getStatusClass(member) {
        if (member.status === 'inactive') return 'inactive';
        if (member.subscription_status === 'expired') return 'expired';
        return 'active';
    }

    addEventListenersToButtons() {
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const memberId = parseInt(e.currentTarget.dataset.id);
                const member = this.members.find(m => m.id === memberId);
                if (member) {
                    this.openMemberModal(member);
                }
            });
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const memberId = parseInt(e.currentTarget.dataset.id);
                this.deleteMember(memberId);
            });
        });
    }

    async deleteMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        if (confirm(`هل أنت متأكد من حذف العضو "${member.name}"؟`)) {
            try {
                if (window.api) {
                    await window.api.deleteMember(memberId);
                    this.showToast('تم حذف العضو بنجاح', 'success');
                    await this.loadMembers();
                }
            } catch (error) {
                console.error('Error deleting member:', error);
                this.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
        const pageInfo = document.getElementById("pageInfo");
        const prevPageBtn = document.getElementById("prevPageBtn");
        const nextPageBtn = document.getElementById("nextPageBtn");

        if (pageInfo) {
            pageInfo.textContent = `الصفحة ${this.currentPage} من ${totalPages || 1}`;
        }

        if (prevPageBtn) {
            prevPageBtn.disabled = this.currentPage <= 1;
            prevPageBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderMembers();
                }
            };
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = this.currentPage >= totalPages;
            nextPageBtn.onclick = () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderMembers();
                }
            };
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
    if (document.getElementById("membersTableBody")) {
        window.membersPage = new MembersPage();
    }
});

