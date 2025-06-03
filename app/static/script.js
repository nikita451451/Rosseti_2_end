// ====================== Глобальные переменные ======================
const API_BASE_URL = 'http://localhost:8000';
const AUTH_ENDPOINTS = {
    login: '/auth/login',
    register: '/auth/register',
    forgot: '/auth/forgot-password',
    validate: '/auth/validate-token'
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

async function forgotPassword(email) {
    try {
        const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.forgot}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка восстановления пароля');
        }

        return await response.json();
    } catch (error) {
        console.error('Forgot password error:', error);
        throw error;
    }
}

async function validateToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.validate}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Невалидный токен');
        }

        return await response.json();
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('authToken');
        throw error;
    }
}

// ====================== Обработчики событий ======================
function handleLoginFormSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    loginUser(email, password)
        .catch(error => {
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.style.display = 'block';
            }
        });
}

function handleRegisterFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const userData = {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
        confirmPassword: form.confirm_password.value
    };

    registerUser(userData)
        .then(data => {
            alert(data.message || 'Регистрация успешна!');
            window.location.href = '/login';
        })
        .catch(error => {
            const errorElement = document.getElementById('register-error');
            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.style.display = 'block';
            }
            
            // Подсветка проблемных полей
            if (error.message.includes('Email')) {
                form.email.classList.add('error');
            }
            if (error.message.includes('имя пользователя')) {
                form.username.classList.add('error');
            }
            if (error.message.includes('Пароли')) {
                form.password.classList.add('error');
                form.confirm_password.classList.add('error');
            }
        });
}

function handleForgotPasswordFormSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const btn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btnText');

    if (btn) btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'block';

    forgotPassword(email)
        .then(() => {
            alert('Письмо с инструкциями отправлено на ваш email');
            window.location.href = '/login';
        })
        .catch(error => {
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.style.display = 'block';
            }
        })
        .finally(() => {
            if (btn) btn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (spinner) spinner.style.display = 'none';
        });
}

// ====================== Вспомогательные функции ======================
function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

function checkAuthStatus() {
    return validateToken()
        .then(user => {
            if (user) {
                // Пользователь аутентифицирован
                document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.guest-required').forEach(el => el.style.display = 'none');
                return true;
            }
            return false;
        })
        .catch(() => false);
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
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
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

function updateUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user && token) {
        // Обновление шапки на всех страницах
        const userPanel = document.getElementById('userPanel');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (userPanel) userPanel.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Обновление имени пользователя
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = user.username;
        
        // Обновление сайдбара (только если он есть на странице)
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        if (sidebarUserName) sidebarUserName.textContent = user.username;
        if (sidebarUserEmail) sidebarUserEmail.textContent = user.email;
        
        // Обновление приветствия (только на главной)
        const welcomeHeader = document.getElementById('welcomeHeader');
        if (welcomeHeader) welcomeHeader.textContent = `Добро пожаловать, ${user.username}!`;
        
        // Скрытие информационного сообщения (только на главной)
        const alertInfo = document.querySelector('.alert.info');
        if (alertInfo) alertInfo.style.display = 'none';
    } else {
        // Если пользователь не авторизован, показываем кнопки входа
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userPanel = document.getElementById('userPanel');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (userPanel) userPanel.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// ====================== Инициализация ======================
document.addEventListener('DOMContentLoaded', () => {
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

    // Проверка статуса аутентификации
    checkAuthStatus();
    updateUI();
});
function showContent(sectionId) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем запрошенную секцию
    const activeSection = document.getElementById(sectionId + '-content');
    if(activeSection) {
        activeSection.style.display = 'block';
    }
}