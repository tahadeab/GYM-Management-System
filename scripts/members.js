const { ipcRenderer } = require('electron');
const db = require('../database/improved_db');
const Helpers = require('../scripts/helpers');

class MembersManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalMembers = 0;
        this.filteredMembers = [];
        this.allMembers = [];
        this.selectedMembers = [];
        this.currentView = 'table';
        this.filters = {
            search: '',
            status: '',
            membership: '',
            gender: ''
        };
        this.init();
    }

    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadMembers();
        this.updateStats();
    }

    initializeElements() {
        // Search and filters
        this.searchInput = document.getElementById('searchInput');
        this.statusFilter = document.getElementById('statusFilter');
        this.membershipFilter = document.getElementById('membershipFilter');
        this.genderFilter = document.getElementById('genderFilter');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');

        // Table elements
        this.membersTableBody = document.getElementById('membersTableBody');
        this.membersGrid = document.getElementById('membersGrid');
        this.selectAllCheckbox = document.getElementById('selectAll');

        // Pagination
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.pageNumbers = document.getElementById('pageNumbers');
        this.showingFrom = document.getElementById('showingFrom');
        this.showingTo = document.getElementById('showingTo');
        this.totalRecords = document.getElementById('totalRecords');

        // Modals
        this.memberModal = document.getElementById('memberModal');
        this.memberDetailsModal = document.getElementById('memberDetailsModal');
        this.bulkActionsModal = document.getElementById('bulkActionsModal');

        // Forms
        this.memberForm = document.getElementById('memberForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.saveMemberBtn = document.getElementById('saveMemberBtn');

        // Stats
        this.totalMembersElement = document.getElementById('totalMembers');
        this.activeMembersElement = document.getElementById('activeMembers');
        this.expiringMembersElement = document.getElementById('expiringMembers');
        this.newMembersThisMonthElement = document.getElementById('newMembersThisMonth');

        // Photo upload
        this.memberPhoto = document.getElementById('memberPhoto');
        this.photoPreview = document.getElementById('photoPreview');
    }

    setupEventListeners() {
        // Search and filters
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.statusFilter.addEventListener('change', (e) => this.handleFilter('status', e.target.value));
        this.membershipFilter.addEventListener('change', (e) => this.handleFilter('membership', e.target.value));
        this.genderFilter.addEventListener('change', (e) => this.handleFilter('gender', e.target.value));
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());

        // Buttons
        document.getElementById('addMemberBtn').addEventListener('click', () => this.openAddMemberModal());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadMembers());
        document.getElementById('exportMembersBtn').addEventListener('click', () => this.exportMembers());
        document.getElementById('importMembersBtn').addEventListener('click', () => this.importMembers());

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleView(e.target.dataset.view));
        });

        // Pagination
        this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));

        // Select all checkbox
        this.selectAllCheckbox.addEventListener('change', (e) => this.handleSelectAll(e.target.checked));

        // Modal events
        this.setupModalEvents();

        // Form events
        this.memberForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.memberPhoto.addEventListener('change', (e) => this.handlePhotoUpload(e));

        // Bulk actions
        this.setupBulkActions();
    }

    setupModalEvents() {
        // Close modal buttons
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal('memberModal'));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal('memberModal'));
        document.getElementById('closeMemberDetailsBtn').addEventListener('click', () => this.closeModal('memberDetailsModal'));
        document.getElementById('closeBulkActionsBtn').addEventListener('click', () => this.closeModal('bulkActionsModal'));

        // Close modal on backdrop click
        [this.memberModal, this.memberDetailsModal, this.bulkActionsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('memberModal');
                this.closeModal('memberDetailsModal');
                this.closeModal('bulkActionsModal');
            }
        });
    }

    setupBulkActions() {
        document.getElementById('bulkSuspendBtn').addEventListener('click', () => this.bulkAction('suspend'));
        document.getElementById('bulkActivateBtn').addEventListener('click', () => this.bulkAction('activate'));
        document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkAction('delete'));
    }

    async loadMembers() {
        try {
            this.showLoading();
            this.allMembers = await db.getAllMembers();
            this.applyFilters();
            this.renderMembers();
            this.updatePagination();
        } catch (error) {
            console.error('خطأ في تحميل الأعضاء:', error);
            this.showNotification('حدث خطأ في تحميل بيانات الأعضاء', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async updateStats() {
        try {
            const stats = await this.calculateStats();
            this.animateNumber(this.totalMembersElement, stats.total);
            this.animateNumber(this.activeMembersElement, stats.active);
            this.animateNumber(this.expiringMembersElement, stats.expiring);
            this.animateNumber(this.newMembersThisMonthElement, stats.newThisMonth);
        } catch (error) {
            console.error('خطأ في تحديث الإحصائيات:', error);
        }
    }

    async calculateStats() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return {
            total: this.allMembers.length,
            active: this.allMembers.filter(m => m.status === 'active').length,
            expiring: this.allMembers.filter(m => {
                if (!m.subscription_end_date) return false;
                const endDate = new Date(m.subscription_end_date);
                return endDate <= nextWeek && endDate >= now;
            }).length,
            newThisMonth: this.allMembers.filter(m => {
                const joinDate = new Date(m.join_date);
                return joinDate >= thisMonth;
            }).length
        };
    }

    animateNumber(element, targetValue) {
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue.toLocaleString('ar-SA');

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    handleSearch(query) {
        this.filters.search = query.toLowerCase();
        this.applyFilters();
        this.currentPage = 1;
        this.renderMembers();
        this.updatePagination();
    }

    handleFilter(type, value) {
        this.filters[type] = value;
        this.applyFilters();
        this.currentPage = 1;
        this.renderMembers();
        this.updatePagination();
    }

    applyFilters() {
        this.filteredMembers = this.allMembers.filter(member => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search;
                const searchableText = `${member.name} ${member.phone} ${member.email}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Status filter
            if (this.filters.status && member.status !== this.filters.status) {
                return false;
            }

            // Membership filter
            if (this.filters.membership && member.membership_type !== this.filters.membership) {
                return false;
            }

            // Gender filter
            if (this.filters.gender && member.gender !== this.filters.gender) {
                return false;
            }

            return true;
        });

        this.totalMembers = this.filteredMembers.length;
    }

    clearFilters() {
        this.filters = {
            search: '',
            status: '',
            membership: '',
            gender: ''
        };

        this.searchInput.value = '';
        this.statusFilter.value = '';
        this.membershipFilter.value = '';
        this.genderFilter.value = '';

        this.applyFilters();
        this.currentPage = 1;
        this.renderMembers();
        this.updatePagination();
    }

    renderMembers() {
        if (this.currentView === 'table') {
            this.renderTableView();
        } else {
            this.renderGridView();
        }
    }

    renderTableView() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageMembers = this.filteredMembers.slice(startIndex, endIndex);

        this.membersTableBody.innerHTML = pageMembers.map(member => `
            <tr>
                <td>
                    <input type="checkbox" class="member-checkbox" value="${member.id}" 
                           ${this.selectedMembers.includes(member.id) ? 'checked' : ''}>
                </td>
                <td>
                    ${member.photo ? 
                        `<img src="${member.photo}" alt="${member.name}" class="member-photo">` :
                        `<div class="member-photo-placeholder"><i class="fas fa-user"></i></div>`
                    }
                </td>
                <td>${member.name}</td>
                <td>${member.phone || '-'}</td>
                <td>${member.email || '-'}</td>
                <td>${this.formatMembershipType(member.membership_type)}</td>
                <td>${member.subscription_end_date ? Helpers.formatDate(member.subscription_end_date) : '-'}</td>
                <td>
                    <span class="status-badge ${member.status}">
                        ${this.formatStatus(member.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="membersManager.viewMember(${member.id})" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="membersManager.editMember(${member.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="membersManager.deleteMember(${member.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners for checkboxes
        document.querySelectorAll('.member-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleMemberSelect(e));
        });
    }

    renderGridView() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageMembers = this.filteredMembers.slice(startIndex, endIndex);

        this.membersGrid.innerHTML = pageMembers.map(member => `
            <div class="member-card">
                <div class="member-card-header">
                    ${member.photo ? 
                        `<img src="${member.photo}" alt="${member.name}" class="member-card-photo">` :
                        `<div class="member-photo-placeholder"><i class="fas fa-user"></i></div>`
                    }
                    <div class="member-card-info">
                        <h4>${member.name}</h4>
                        <p>${member.phone || 'لا يوجد هاتف'}</p>
                    </div>
                </div>
                <div class="member-card-details">
                    <div class="member-detail">
                        <span class="label">البريد الإلكتروني:</span>
                        <span class="value">${member.email || '-'}</span>
                    </div>
                    <div class="member-detail">
                        <span class="label">نوع العضوية:</span>
                        <span class="value">${this.formatMembershipType(member.membership_type)}</span>
                    </div>
                    <div class="member-detail">
                        <span class="label">الحالة:</span>
                        <span class="value">
                            <span class="status-badge ${member.status}">
                                ${this.formatStatus(member.status)}
                            </span>
                        </span>
                    </div>
                    <div class="member-detail">
                        <span class="label">تاريخ الانتهاء:</span>
                        <span class="value">${member.subscription_end_date ? Helpers.formatDate(member.subscription_end_date) : '-'}</span>
                    </div>
                </div>
                <div class="member-card-actions">
                    <button class="action-btn view" onclick="membersManager.viewMember(${member.id})" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="membersManager.editMember(${member.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="membersManager.deleteMember(${member.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    toggleView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Show/hide views
        document.getElementById('tableView').style.display = view === 'table' ? 'block' : 'none';
        document.getElementById('gridView').style.display = view === 'grid' ? 'block' : 'none';

        this.renderMembers();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalMembers / this.itemsPerPage);
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalMembers);
        
        this.showingFrom.textContent = this.totalMembers > 0 ? startIndex : 0;
        this.showingTo.textContent = endIndex;
        this.totalRecords.textContent = this.totalMembers;

        // Update pagination buttons
        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= totalPages;

        // Generate page numbers
        this.generatePageNumbers(totalPages);
    }

    generatePageNumbers(totalPages) {
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        this.pageNumbers.innerHTML = '';

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            this.pageNumbers.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.totalMembers / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderMembers();
        this.updatePagination();
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.member-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.handleMemberSelect({ target: checkbox });
        });
    }

    handleMemberSelect(e) {
        const memberId = parseInt(e.target.value);
        const isChecked = e.target.checked;

        if (isChecked) {
            if (!this.selectedMembers.includes(memberId)) {
                this.selectedMembers.push(memberId);
            }
        } else {
            this.selectedMembers = this.selectedMembers.filter(id => id !== memberId);
        }

        // Update select all checkbox
        const totalCheckboxes = document.querySelectorAll('.member-checkbox').length;
        const checkedCheckboxes = document.querySelectorAll('.member-checkbox:checked').length;
        
        this.selectAllCheckbox.checked = checkedCheckboxes === totalCheckboxes && totalCheckboxes > 0;
        this.selectAllCheckbox.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;

        // Show/hide bulk actions
        if (this.selectedMembers.length > 0) {
            this.showBulkActions();
        } else {
            this.hideBulkActions();
        }
    }

    showBulkActions() {
        document.getElementById('selectedCount').textContent = this.selectedMembers.length;
        this.openModal('bulkActionsModal');
    }

    hideBulkActions() {
        this.closeModal('bulkActionsModal');
    }

    async bulkAction(action) {
        if (this.selectedMembers.length === 0) return;

        const confirmMessage = {
            suspend: 'هل أنت متأكد من تعليق الأعضاء المحددين؟',
            activate: 'هل أنت متأكد من تفعيل الأعضاء المحددين؟',
            delete: 'هل أنت متأكد من حذف الأعضاء المحددين؟ هذا الإجراء لا يمكن التراجع عنه.'
        };

        if (!confirm(confirmMessage[action])) return;

        try {
            this.showLoading();

            for (const memberId of this.selectedMembers) {
                switch (action) {
                    case 'suspend':
                        await db.updateMember(memberId, { status: 'suspended' });
                        break;
                    case 'activate':
                        await db.updateMember(memberId, { status: 'active' });
                        break;
                    case 'delete':
                        await db.deleteMember(memberId);
                        break;
                }
            }

            this.selectedMembers = [];
            this.closeModal('bulkActionsModal');
            await this.loadMembers();
            await this.updateStats();
            
            this.showNotification(`تم ${action === 'delete' ? 'حذف' : action === 'suspend' ? 'تعليق' : 'تفعيل'} الأعضاء بنجاح`, 'success');

        } catch (error) {
            console.error('خطأ في الإجراء المتعدد:', error);
            this.showNotification('حدث خطأ أثناء تنفيذ الإجراء', 'error');
        } finally {
            this.hideLoading();
        }
    }

    openAddMemberModal() {
        this.modalTitle.textContent = 'إضافة عضو جديد';
        this.saveMemberBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
        this.memberForm.reset();
        this.resetPhotoPreview();
        this.openModal('memberModal');
    }

    async editMember(memberId) {
        try {
            const member = this.allMembers.find(m => m.id === memberId);
            if (!member) return;

            this.modalTitle.textContent = 'تعديل بيانات العضو';
            this.saveMemberBtn.innerHTML = '<i class="fas fa-save"></i> تحديث';

            // Fill form with member data
            document.getElementById('memberName').value = member.name || '';
            document.getElementById('memberPhone').value = member.phone || '';
            document.getElementById('memberEmail').value = member.email || '';
            document.getElementById('memberGender').value = member.gender || '';
            document.getElementById('memberBirthDate').value = member.date_of_birth || '';
            document.getElementById('membershipType').value = member.membership_type || '';
            document.getElementById('memberAddress').value = member.address || '';
            document.getElementById('emergencyContactName').value = member.emergency_contact_name || '';
            document.getElementById('emergencyContactPhone').value = member.emergency_contact_phone || '';
            document.getElementById('medicalNotes').value = member.medical_notes || '';

            // Set photo preview
            if (member.photo) {
                this.setPhotoPreview(member.photo);
            } else {
                this.resetPhotoPreview();
            }

            // Store member ID for update
            this.memberForm.dataset.memberId = memberId;

            this.openModal('memberModal');

        } catch (error) {
            console.error('خطأ في تحميل بيانات العضو:', error);
            this.showNotification('حدث خطأ في تحميل بيانات العضو', 'error');
        }
    }

    async viewMember(memberId) {
        try {
            const member = this.allMembers.find(m => m.id === memberId);
            if (!member) return;

            const memberDetailsContent = document.getElementById('memberDetailsContent');
            memberDetailsContent.innerHTML = `
                <div class="member-details">
                    <div class="member-header">
                        <div class="member-photo-large">
                            ${member.photo ? 
                                `<img src="${member.photo}" alt="${member.name}">` :
                                `<div class="photo-placeholder"><i class="fas fa-user"></i></div>`
                            }
                        </div>
                        <div class="member-info">
                            <h2>${member.name}</h2>
                            <p class="member-id">رقم العضوية: ${member.id}</p>
                            <span class="status-badge ${member.status}">
                                ${this.formatStatus(member.status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-section">
                            <h3>المعلومات الشخصية</h3>
                            <div class="detail-item">
                                <span class="label">الهاتف:</span>
                                <span class="value">${member.phone || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">البريد الإلكتروني:</span>
                                <span class="value">${member.email || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">الجنس:</span>
                                <span class="value">${this.formatGender(member.gender)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ الميلاد:</span>
                                <span class="value">${member.date_of_birth ? Helpers.formatDate(member.date_of_birth) : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">العنوان:</span>
                                <span class="value">${member.address || '-'}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>معلومات العضوية</h3>
                            <div class="detail-item">
                                <span class="label">نوع العضوية:</span>
                                <span class="value">${this.formatMembershipType(member.membership_type)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ الانضمام:</span>
                                <span class="value">${Helpers.formatDate(member.join_date)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ انتهاء الاشتراك:</span>
                                <span class="value">${member.subscription_end_date ? Helpers.formatDate(member.subscription_end_date) : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">آخر زيارة:</span>
                                <span class="value">${member.last_visit ? Helpers.formatDate(member.last_visit) : '-'}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>معلومات الطوارئ</h3>
                            <div class="detail-item">
                                <span class="label">اسم جهة الاتصال:</span>
                                <span class="value">${member.emergency_contact_name || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">هاتف جهة الاتصال:</span>
                                <span class="value">${member.emergency_contact_phone || '-'}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>الملاحظات الطبية</h3>
                            <div class="medical-notes">
                                ${member.medical_notes || 'لا توجد ملاحظات طبية'}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.openModal('memberDetailsModal');

        } catch (error) {
            console.error('خطأ في عرض تفاصيل العضو:', error);
            this.showNotification('حدث خطأ في عرض تفاصيل العضو', 'error');
        }
    }

    async deleteMember(memberId) {
        if (!confirm('هل أنت متأكد من حذف هذا العضو؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }

        try {
            this.showLoading();
            await db.deleteMember(memberId);
            await this.loadMembers();
            await this.updateStats();
            this.showNotification('تم حذف العضو بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف العضو:', error);
            this.showNotification('حدث خطأ أثناء حذف العضو', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        try {
            this.showLoading();

            const formData = new FormData(this.memberForm);
            const memberData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                gender: formData.get('gender'),
                date_of_birth: formData.get('date_of_birth'),
                membership_type: formData.get('membership_type'),
                address: formData.get('address'),
                emergency_contact_name: formData.get('emergency_contact_name'),
                emergency_contact_phone: formData.get('emergency_contact_phone'),
                medical_notes: formData.get('medical_notes'),
                photo: formData.get('photo')
            };

            // Validate required fields
            const errors = this.validateMemberData(memberData);
            if (errors.length > 0) {
                this.showNotification(errors.join('<br>'), 'error');
                return;
            }

            const memberId = this.memberForm.dataset.memberId;

            if (memberId) {
                // Update existing member
                await db.updateMember(parseInt(memberId), memberData);
                this.showNotification('تم تحديث بيانات العضو بنجاح', 'success');
            } else {
                // Add new member
                await db.addMember(memberData);
                this.showNotification('تم إضافة العضو بنجاح', 'success');
            }

            this.closeModal('memberModal');
            await this.loadMembers();
            await this.updateStats();

        } catch (error) {
            console.error('خطأ في حفظ بيانات العضو:', error);
            this.showNotification('حدث خطأ أثناء حفظ بيانات العضو', 'error');
        } finally {
            this.hideLoading();
        }
    }

    validateMemberData(data) {
        const errors = [];

        if (!data.name || data.name.trim() === '') {
            errors.push('الاسم مطلوب');
        }

        if (!data.phone || data.phone.trim() === '') {
            errors.push('رقم الهاتف مطلوب');
        } else if (!Helpers.isValidPhone(data.phone)) {
            errors.push('رقم الهاتف غير صحيح');
        }

        if (data.email && !Helpers.isValidEmail(data.email)) {
            errors.push('البريد الإلكتروني غير صحيح');
        }

        if (!data.gender) {
            errors.push('الجنس مطلوب');
        }

        if (!data.membership_type) {
            errors.push('نوع العضوية مطلوب');
        }

        return errors;
    }

    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('يرجى اختيار ملف صورة صحيح', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.setPhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    setPhotoPreview(imageSrc) {
        this.photoPreview.innerHTML = `<img src="${imageSrc}" alt="صورة العضو">`;
        this.photoPreview.classList.add('has-image');
    }

    resetPhotoPreview() {
        this.photoPreview.innerHTML = `
            <i class="fas fa-camera"></i>
            <span>اختر صورة</span>
        `;
        this.photoPreview.classList.remove('has-image');
    }

    async exportMembers() {
        try {
            this.showLoading();

            const headers = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'الجنس', 'نوع العضوية', 'الحالة', 'تاريخ الانضمام'];
            const data = this.filteredMembers.map(member => [
                member.name,
                member.phone || '',
                member.email || '',
                this.formatGender(member.gender),
                this.formatMembershipType(member.membership_type),
                this.formatStatus(member.status),
                Helpers.formatDate(member.join_date)
            ]);

            const csvContent = Helpers.exportToCSV(data, headers);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            this.showNotification('تم تصدير بيانات الأعضاء بنجاح', 'success');

        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showNotification('حدث خطأ أثناء تصدير البيانات', 'error');
        } finally {
            this.hideLoading();
        }
    }

    importMembers() {
        this.showNotification('ميزة استيراد الأعضاء قيد التطوير', 'info');
    }

    formatStatus(status) {
        const statusMap = {
            'active': 'نشط',
            'inactive': 'غير نشط',
            'suspended': 'معلق'
        };
        return statusMap[status] || status;
    }

    formatMembershipType(type) {
        const typeMap = {
            'daily': 'يومي',
            'monthly': 'شهري',
            'quarterly': 'ربع سنوي',
            'yearly': 'سنوي'
        };
        return typeMap[type] || type;
    }

    formatGender(gender) {
        const genderMap = {
            'male': 'ذكر',
            'female': 'أنثى'
        };
        return genderMap[gender] || '-';
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Reset form if it's the member modal
            if (modalId === 'memberModal') {
                this.memberForm.reset();
                this.memberForm.removeAttribute('data-member-id');
                this.resetPhotoPreview();
            }
        }
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

// Initialize members manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.membersManager = new MembersManager();
});

