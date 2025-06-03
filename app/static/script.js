// ====================== Глобальные переменные ======================
const API_BASE_URL = 'http://localhost:8000';
const AUTH_ENDPOINTS = {
    login: '/auth/login',
    register: '/auth/register',
    forgot: '/auth/forgot-password',
    validate: '/auth/validate-token'
};

// Унифицируем ключи для localStorage
const STORAGE_KEYS = {
    token: 'authToken',
    user: 'userData'
};

// ====================== Основные функции аутентификации ======================
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: userData.username,
                email: userData.email,
                password: userData.password,
                confirm_password: userData.confirmPassword
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка регистрации');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem(STORAGE_KEYS.token, data.access_token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        
        updateUI();
        window.location.href = '/';
        
    } catch (error) {
        console.error('Login error:', error);
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
        throw error;
    }
}

async function checkAuthStatus() {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

function updateUI() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
    const token = localStorage.getItem(STORAGE_KEYS.token);
    
    if (user && token) {
        // Показываем панель пользователя
        const userPanel = document.getElementById('userPanel');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (userPanel) userPanel.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Обновляем имя пользователя
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = user.username;
        
        // Обновляем сайдбар
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        if (sidebarUserName) sidebarUserName.textContent = user.username;
        if (sidebarUserEmail) sidebarUserEmail.textContent = user.email;
        
        // Скрываем гостевой контент
        const guestContent = document.getElementById('guest-content');
        const mainContent = document.getElementById('main-content');
        if (guestContent) guestContent.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        loadMenu();
    } else {
        // Показываем кнопки входа
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userPanel = document.getElementById('userPanel');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (userPanel) userPanel.style.display = 'none';
        
        // Показываем гостевой контент
        const guestContent = document.getElementById('guest-content');
        const mainContent = document.getElementById('main-content');
        if (guestContent) guestContent.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        
        loadMenu();
    }
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    window.location.href = '/';
}

// ====================== Инициализация ======================
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем статус аутентификации и обновляем UI
    checkAuthStatus().then(isAuthenticated => {
        if (isAuthenticated) {
            updateUI();
            showContent('home');
        } else {
            updateUI();
        }
    });

    // Инициализация форм
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLoginFormSubmit);
    }

    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', handleRegisterFormSubmit);
    }

    if (document.getElementById('forgotPasswordForm')) {
        document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPasswordFormSubmit);
    }

    // Инициализация кнопок показа пароля
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.closest('.form-group').querySelector('input[type="password"]');
            const icon = button.querySelector('i');
            if (input && icon) {
                togglePasswordVisibility(input.id, icon);
            }
        });
    });
});

// ================== МЕНЮ САЙТА =====================
async function loadMenu() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/menu`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки меню');
        }
        const menuItems = await response.json();
        renderMenu(menuItems);
    } catch (error) {
        console.error('Menu loading error:', error);
    }
}

function renderMenu(items) {
    const menuContainer = document.querySelector('.sidebar-menu');
    if (!menuContainer) return;

    menuContainer.innerHTML = '';

    const sortedItems = items
        .filter(item => item.is_active)
        .sort((a, b) => a.order - b.order);

    // Получаем текущий раздел из URL
    const currentSection = window.location.hash.substring(1) || 'home';

    sortedItems.forEach(item => {
        const menuItem = document.createElement('li');
        menuItem.className = 'menu-item';
        
        const menuLink = document.createElement('a');
        menuLink.href = item.path || '#';
        
        // Определяем активный элемент
        const isActive = item.path === `#${currentSection}`;
        menuLink.className = `menu-link ${isActive ? 'active' : ''}`;
        
        menuLink.onclick = function(e) {
            if (item.path.startsWith('#')) {
                e.preventDefault();
                showContent(item.path.substring(1));
                
                // Обновляем активное состояние
                document.querySelectorAll('.menu-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        };
        
        menuLink.innerHTML = `
            <i class="fas ${item.icon} menu-icon"></i>
            <span class="menu-text">${item.title}</span>
            <i class="fas fa-chevron-right arrow-icon"></i>
        `;
        
        menuItem.appendChild(menuLink);
        menuContainer.appendChild(menuItem);
    });
}
// Обновим инициализацию в DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    updateUI();
});
async function loadMenu() {
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/menu`, {
            headers
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки меню');
        }
        
        const menuItems = await response.json();
        renderMenu(menuItems);
    } catch (error) {
        console.error('Menu loading error:', error);
    }
}
// Функции для работы с приборами учета
async function loadMeters() {
    try {
        const response = await fetch('/api/meters');
        const meters = await response.json();
        const tbody = document.querySelector('#metersTable tbody');
        
        tbody.innerHTML = '';
        meters.forEach(meter => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${meter.number}</td>
                <td>${meter.type}</td>
                <td>${new Date(meter.installed_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-meter" data-id="${meter.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-meter" data-id="${meter.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading meters:', error);
    }
}

// Функции для работы с показаниями
async function loadMetersForReadings() {
    try {
        const response = await fetch('/api/meters');
        const meters = await response.json();
        const select = document.getElementById('meter');
        
        select.innerHTML = '<option value="">Выберите прибор учета</option>';
        meters.forEach(meter => {
            const option = document.createElement('option');
            option.value = meter.id;
            option.textContent = `${meter.number} (${meter.type})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading meters for readings:', error);
    }
}

async function loadLastReadings() {
    try {
        const response = await fetch('/api/readings?limit=5');
        const readings = await response.json();
        const tbody = document.querySelector('#lastReadingsTable tbody');
        
        tbody.innerHTML = '';
        readings.forEach(reading => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(reading.date).toLocaleDateString()}</td>
                <td>Прибор ${reading.meter_id}</td>
                <td>${reading.value}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading last readings:', error);
    }
}

// Обработчик отправки показаний
document.getElementById('readingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const reading = {
        meter_id: parseInt(document.getElementById('meter').value),
        value: parseFloat(document.getElementById('value').value),
        date: document.getElementById('readingDate').value
    };
    
    try {
        const response = await fetch('/api/readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reading)
        });
        
        if (response.ok) {
            alert('Показания успешно отправлены!');
            loadLastReadings();
            document.getElementById('readingForm').reset();
        } else {
            throw new Error('Ошибка при отправке показаний');
        }
    } catch (error) {
        console.error('Submit reading error:', error);
        alert('Произошла ошибка: ' + error.message);
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем данные при переходе на соответствующие разделы
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('onclick').match(/'(\w+)'/)[1];
            
            if (section === 'submitReadings') {
                loadMetersForReadings();
                loadLastReadings();
                document.getElementById('readingDate').valueAsDate = new Date();
            } else if (section === 'meters') {
                loadMeters();
            }
        });
    });
    
    // Инициализация модального окна для приборов
    document.getElementById('addMeterBtn').addEventListener('click', () => {
        document.getElementById('meterForm').reset();
        document.getElementById('installedAt').valueAsDate = new Date();
        $('#meterModal').modal('show');
    });
    
    document.getElementById('saveMeterBtn').addEventListener('click', async () => {
        const meter = {
            number: document.getElementById('meterNumber').value,
            type: document.getElementById('meterType').value,
            installed_at: document.getElementById('installedAt').value
        };
        
        try {
            const response = await fetch('/api/meters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meter)
            });
            
            if (response.ok) {
                $('#meterModal').modal('hide');
                loadMeters();
            } else {
                throw new Error('Ошибка при сохранении прибора');
            }
        } catch (error) {
            console.error('Save meter error:', error);
            alert('Произошла ошибка: ' + error.message);
        }
    });
});
// Управление модальным окном
document.getElementById('addMeterBtn').addEventListener('click', function() {
    document.getElementById('meterModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы
});

document.querySelector('.modal-overlay, .close').addEventListener('click', function() {
    document.getElementById('meterModal').style.display = 'none';
    document.body.style.overflow = ''; // Восстанавливаем прокрутку
});

// Закрытие по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('meterModal').style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Предотвращаем закрытие при клике внутри модального окна
document.querySelector('.modal-dialog').addEventListener('click', function(e) {
    e.stopPropagation();
});
// Функция проверки авторизации
function isAuthenticated() {
    // Проверяем, есть ли в localStorage данные пользователя
    return localStorage.getItem('userToken') !== null;
    // Или можно проверять display userPanel
    // return document.getElementById('userPanel').style.display !== 'none';
}
// Оригинальный код для открытия модального окна
document.getElementById('addMeterBtn').addEventListener('click', function() {
    if (!isAuthenticated()) {
        showAuthRequiredMessage();
        return;
    }
    document.getElementById('meterModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
});
// Функция показа сообщения о необходимости авторизации
function showAuthRequiredMessage() {
    alert('Для выполнения этого действия необходимо войти в систему');
    // Или можно показать красивое уведомление:
    /*
    const notification = document.createElement('div');
    notification.className = 'auth-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>Для доступа к этой функции требуется авторизация</span>
            <div class="notification-actions">
                <button onclick="location.href='/login'">Войти</button>
                <button onclick="location.href='/register'">Зарегистрироваться</button>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
    */
}