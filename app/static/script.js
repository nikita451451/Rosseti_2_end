// Проверка аутентификации при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});
// DOM элементы
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userPanel = document.getElementById('userPanel');
const userName = document.getElementById('userName');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserEmail = document.getElementById('sidebarUserEmail');

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupContentSections();
});

// 2. Улучшенная проверка авторизации с обработкой JWT
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Проверка валидности токена (в реальном приложении - запрос к API)
        const response = await fetch('/api/validate-token', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            updateUIForLoggedInUser(userData);
        } else {
            logout(); // Токен невалидный - разлогиниваем
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// 3. Отдельная функция для обновления UI
function updateUIForLoggedInUser(userData) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    userPanel.style.display = 'flex';
    userName.textContent = userData.name;
    sidebarUserName.textContent = userData.name;
    sidebarUserEmail.textContent = userData.email;
    const alertElement = document.querySelector('.alert');
if (alertElement) {
    alertElement.style.display = 'none';
}

    
}
function updateUIForLoggedInUser(userData) {
    // 1. Собираем все элементы в объект для удобства
    const elements = {
        loginBtn: document.getElementById('loginBtn'),
        registerBtn: document.getElementById('registerBtn'),
        userPanel: document.getElementById('userPanel'),
        userName: document.getElementById('userName'),
        sidebarUserName: document.getElementById('sidebarUserName'),
        sidebarUserEmail: document.getElementById('sidebarUserEmail'),
        alert: document.querySelector('.alert')
    };

    // 2. Проверяем существование элементов перед изменением
    if (elements.loginBtn) elements.loginBtn.style.display = 'none';
    if (elements.registerBtn) elements.registerBtn.style.display = 'none';
    if (elements.userPanel) elements.userPanel.style.display = 'flex';
    
    // 3. Обновляем текстовые данные
    if (elements.userName) elements.userName.textContent = userData.name;
    if (elements.sidebarUserName) elements.sidebarUserName.textContent = userData.name;
    if (elements.sidebarUserEmail) elements.sidebarUserEmail.textContent = userData.email;
    
    // 4. Скрываем алерт, если он есть
    if (elements.alert) elements.alert.style.display = 'none';
}
// Управление разделами контента (только для страниц с контентом)
function setupContentSections() {
    // Проверяем, есть ли на странице нужные элементы
    const homeContent = document.getElementById('home-content');
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    
    // Если элементов нет (как на страницах login/register), выходим из функции
    if (!homeContent || sidebarLinks.length === 0) return;
    
    // Показываем первый раздел по умолчанию
    homeContent.classList.add('active');
    
    // Обработчики для бокового меню
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удаляем активный класс у всех ссылок
            sidebarLinks.forEach(item => item.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            this.classList.add('active');
            
            // Показываем соответствующий контент
            const target = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showContent(target);
        });
    });
}

// Показать раздел контента
function showContent(sectionId) {
    // Скрываем все разделы
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Показываем выбранный раздел
    document.getElementById(`${sectionId}-content`).classList.add('active');
}
// Обработка формы регистрации
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';
        
        const formData = {
            name: document.getElementById('fullname').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirm-password').value
        };
        
        if (formData.password !== formData.confirmPassword) {
            throw new Error('Пароли не совпадают');
        }
        
        // Вызов функции регистрации
        const data = await registerUser(formData);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        showToast('Регистрация прошла успешно!');
        window.location.href = '/'; // Перенаправление после регистрации
    } catch (error) {
        showError(error.message, 'register-error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
// 1. Добавьте обработку реальных API запросов вместо имитации
async function registerUser() {
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Проверка на совпадение паролей
    if (password !== confirmPassword) {
        showError("Пароли не совпадают");
        return;
    }

    const response = await fetch('http://127.0.0.1:8000/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fullname: fullname,
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (response.ok) {
        console.log('User registered successfully:', data);
        // Дополнительно, можно перенаправить или показать сообщение об успехе
    } else {
        console.error('Registration error:', data);
        showError(data.detail || 'Registration failed.');
    }
}
async function loginUser(credentials) {
    const response = await fetch('http://localhost:8000/login/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json(); // Получаем детали ошибки от сервера
        throw new Error(errorData.detail || "Ошибка входа");
    }
    
    return await response.json();
}
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';
        
        const credentials = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        const data = await loginUser(credentials);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        showToast('Вход выполнен успешно!');
        window.location.href = '/'; // Перенаправление после входа
    } catch (error) {
        showError(error.message, 'login-error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});


// Выход из системы
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    loginBtn.style.display = 'block';
    registerBtn.style.display = 'block';
    userPanel.style.display = 'none';
    
    sidebarUserName.textContent = 'Гость';
    sidebarUserEmail.textContent = 'Не авторизован';
    
    // Показываем сообщение для гостей
    document.querySelector('.alert').style.display = 'flex';
    
    // Возвращаем на главную
    showContent('home');
    
    // Обновляем активную ссылку в меню
    const menuLinks = document.querySelectorAll('.sidebar ul li a');
    menuLinks.forEach(link => link.classList.remove('active'));
    menuLinks[0].classList.add('active');
}
// 5. Вспомогательные функции для уведомлений
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function showError(message, elementId = 'error-message') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('server-status');

    // Функция для запроса состояния сервера
    async function checkServerStatus() {
        try {
            const response = await fetch('/api/healthcheck');
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'connected') {
                    statusElement.className = 'server-status online';
                } else {
                    statusElement.className = 'server-status offline';
                }
            } else {
                statusElement.className = 'server-status offline';
            }
        } catch (error) {
            statusElement.className = 'server-status offline';
        }
    }

    // Проверка при загрузке страницы
    checkServerStatus();

    // Проверка каждые 30 секунд
    setInterval(checkServerStatus, 30000);
});
