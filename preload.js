const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Authentication
    login: (credentials) => ipcRenderer.invoke('login', credentials),

    // Members
    getMembers: () => ipcRenderer.invoke('get-members'),
    addMember: (memberData) => ipcRenderer.invoke('add-member', memberData),
    updateMember: (id, data) => ipcRenderer.invoke('update-member', { id, data }),
    deleteMember: (id) => ipcRenderer.invoke('delete-member', id),

    // Trainers
    getTrainers: () => ipcRenderer.invoke('get-trainers'),
    addTrainer: (trainer) => ipcRenderer.invoke('add-trainer', trainer),
    updateTrainer: (id, trainer) => ipcRenderer.invoke('update-trainer', { id, trainer }),
    deleteTrainer: (id) => ipcRenderer.invoke('delete-trainer', id),

    // Admin/Settings
    getUsers: () => ipcRenderer.invoke('get-users'),
    deleteUser: (id) => ipcRenderer.invoke('delete-user', id),

    // Payments/Subscriptions
    renewSubscription: (data) => ipcRenderer.invoke('renew-subscription', data),
    getPayments: () => ipcRenderer.invoke('get-payments'),
    getSubscriptions: () => ipcRenderer.invoke('get-subscriptions'),
    getExpiringSubscriptions: (days) => ipcRenderer.invoke('get-expiring-subscriptions', days),
    freezeSubscription: (data) => ipcRenderer.invoke('freeze-subscription', data),
    unfreezeSubscription: (id) => ipcRenderer.invoke('unfreeze-subscription', id),
    getNotifications: () => ipcRenderer.invoke('get-notifications'),
    markNotificationRead: (id) => ipcRenderer.invoke('mark-notification-read', id),
    runNotificationSweep: () => ipcRenderer.invoke('run-notification-sweep'),


    // Dashboard
    getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

    // Navigation
    navigateToDashboard: () => ipcRenderer.send('navigate-to-dashboard'),

    // Attendance
    getAttendance: (options) => ipcRenderer.invoke('get-attendance', options),
    checkIn: (data) => ipcRenderer.invoke('check-in', data),
    checkOut: (id) => ipcRenderer.invoke('check-out', id),

    // Equipment and classes
    getEquipment: () => ipcRenderer.invoke('get-equipment'),
    saveEquipment: (data) => ipcRenderer.invoke('save-equipment', data),
    deleteEquipment: (id) => ipcRenderer.invoke('delete-equipment', id),
    getRooms: () => ipcRenderer.invoke('get-rooms'),
    saveRoom: (data) => ipcRenderer.invoke('save-room', data),
    deleteRoom: (id) => ipcRenderer.invoke('delete-room', id),
    getClasses: () => ipcRenderer.invoke('get-classes'),
    saveClass: (data) => ipcRenderer.invoke('save-class', data),
    bookClass: (data) => ipcRenderer.invoke('book-class', data),
    getReports: (range) => ipcRenderer.invoke('get-reports', range),

    // Utils
    openExternal: (url) => ipcRenderer.send('open-external', url)
});