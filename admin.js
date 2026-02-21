import { mockUsers } from './store.js';
import { utils, toast } from './utils.js';
import { auditLogs } from './logger.js';
import { state } from './store.js';

export const admin = {
    init() {
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.openUserModal());
        }

        const userModalClose = document.getElementById('user-modal-close');
        if (userModalClose) {
            userModalClose.addEventListener('click', () => this.closeUserModal());
        }

        const userModalCancel = document.getElementById('user-modal-cancel');
        if (userModalCancel) {
            userModalCancel.addEventListener('click', () => this.closeUserModal());
        }

        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUser();
            });
        }
    },

    render() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        const roleNames = {
            admin: '系統管理員',
            user: '一般使用者',
            med_admin: '訂藥管理員'
        };

        tbody.innerHTML = mockUsers.map(u => `
            <tr>
                <td><div class="mono">${u.username}</div></td>
                <td>${u.name}</td>
                <td>
                    <span class="role-badge ${u.role}">${roleNames[u.role] || u.role}</span>
                </td>
                <td>
                    <span class="status-badge ${u.isActive ? 'active' : 'inactive'}">
                        ${u.isActive ? '啟用' : '停用'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon edit-user-btn" data-id="${u.id}" title="編輯">✏️</button>
                        ${u.username !== state.currentUser?.username ?
                `<button class="btn-icon delete delete-user-btn" data-id="${u.id}" title="${u.isActive ? '停用' : '啟用'}">
                                ${u.isActive ? '🚫' : '✅'}
                            </button>` : ''
            }
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const user = mockUsers.find(u => u.id === id);
                if (user) this.openUserModal(user);
            });
        });

        tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.toggleUserStatus(id);
            });
        });
    },

    openUserModal(user = null) {
        const modal = document.getElementById('user-modal');
        if (!modal) return;

        document.getElementById('user-modal-title').textContent = user ? '編輯使用者' : '新增使用者';

        const usernameInput = document.getElementById('user-username');
        if (usernameInput) {
            usernameInput.value = user ? user.username : '';
            usernameInput.disabled = !!user; // 不能修改帳號
        }

        const pwdInput = document.getElementById('user-password');
        if (pwdInput) {
            pwdInput.value = '';
            pwdInput.placeholder = user ? '留空表示不修改' : '請輸入密碼';
            pwdInput.required = !user;
        }

        const nameInput = document.getElementById('user-display-name');
        if (nameInput) {
            nameInput.value = user ? user.name : '';
        }

        const roleSelect = document.getElementById('user-role-select');
        if (roleSelect) {
            roleSelect.value = user ? user.role : 'user';
        }

        const activeCb = document.getElementById('user-active');
        if (activeCb) {
            activeCb.checked = user ? user.isActive : true;
        }

        state.editingUser = user;
        modal.classList.add('active');
    },

    closeUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) modal.classList.remove('active');
        state.editingUser = null;
    },

    saveUser() {
        const userData = {
            username: document.getElementById('user-username').value,
            name: document.getElementById('user-display-name').value,
            role: document.getElementById('user-role-select').value,
            isActive: document.getElementById('user-active').checked
        };

        const pwd = document.getElementById('user-password').value;
        if (pwd) {
            userData.password = pwd;
        }

        if (state.editingUser) {
            // Update
            const index = mockUsers.findIndex(u => u.id === state.editingUser.id);
            if (index !== -1) {
                mockUsers[index] = { ...mockUsers[index], ...userData };
                auditLogs.logAction('UPDATE', 'User', state.editingUser.id, `更新使用者：${userData.username}`);
                toast.show('使用者資料已更新', 'success');
            }
        } else {
            // Check duplicate
            if (mockUsers.some(u => u.username === userData.username)) {
                toast.show('帳號已存在', 'error');
                return;
            }

            // Create
            const newUser = {
                id: utils.generateUserId(),
                ...userData
            };
            mockUsers.push(newUser);
            auditLogs.logAction('CREATE', 'User', newUser.id, `新增使用者：${newUser.username}`);
            toast.show('使用者已建立', 'success');
        }

        this.closeUserModal();
        this.render();
    },

    toggleUserStatus(id) {
        const user = mockUsers.find(u => u.id === id);
        if (!user) return;

        if (user.username === state.currentUser?.username) {
            toast.show('無法停用自己的帳號', 'error');
            return;
        }

        user.isActive = !user.isActive;
        auditLogs.logAction('UPDATE', 'User', id, `${user.isActive ? '啟用' : '停用'}使用者：${user.username}`);

        this.render();
        toast.show(`已${user.isActive ? '啟用' : '停用'}該帳號`, 'success');
    }
};
