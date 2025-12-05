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

    // Dashboard
    getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

    // Navigation
    navigateToDashboard: () => ipcRenderer.send('navigate-to-dashboard'),

    // Utils
    openExternal: (url) => ipcRenderer.send('open-external', url)
});