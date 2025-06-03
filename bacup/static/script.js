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
function setupEventListeners() {
    // Обработчик для кнопки отправки показаний
    document.getElementById('submit-reading-btn')?.addEventListener('click', submitReading);
    
    // Обработчик для кнопки проверки ИПУ
    document.getElementById('check-ipu-btn')?.addEventListener('click', checkIPU);
    
    // Обработчик изменения выбора прибора учета
    document.getElementById('meter-select')?.addEventListener('change', function() {
        if (this.value) {
            loadLastReadings(this.value);
        }
    });
    
    // Обработчики для истории начислений
    document.getElementById('history-period')?.addEventListener('change', function() {
        loadPaymentHistory(this.value);
    });
    
    // Обработчики для квитанций
    document.getElementById('receipt-period')?.addEventListener('change', function() {
        loadReceipts(this.value);
    });
    
    // Обработчики для справок
    document.querySelectorAll('.certificate-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const formContainer = document.getElementById('certificate-form-container');
            const formTitle = document.getElementById('certificate-form-title');
            
            // Показываем соответствующую форму
            formContainer.style.display = 'block';
            
            // Настраиваем форму в зависимости от типа справки
            switch(type) {
                case 'consumption':
                    formTitle.textContent = 'Справка о потреблении';
                    document.getElementById('certificate-period-group').style.display = 'block';
                    break;
                case 'payments':
                    formTitle.textContent = 'Справка о платежах';
                    document.getElementById('certificate-period-group').style.display = 'block';
                    break;
                case 'no-debt':
                    formTitle.textContent = 'Справка об отсутствии задолженности';
                    document.getElementById('certificate-period-group').style.display = 'none';
                    break;
            }
            
            // Устанавливаем текущие даты по умолчанию
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
            
            document.getElementById('certificate-start-date').valueAsDate = startDate;
            document.getElementById('certificate-end-date').valueAsDate = endDate;
            
            // Устанавливаем email пользователя по умолчанию
            const user = JSON.parse(localStorage.getItem('user'));
            if (user?.email) {
                document.getElementById('certificate-email').value = user.email;
            }
            
            // Обработчик отправки формы
            document.getElementById('certificate-form').onsubmit = function(e) {
                e.preventDefault();
                const startDate = document.getElementById('certificate-start-date').value;
                const endDate = document.getElementById('certificate-end-date').value;
                const email = document.getElementById('certificate-email').value;
                
                requestCertificate(type, startDate, endDate, email);
            };
        });
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
// Загрузка профиля пользователя
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки профиля');
        
        const user = await response.json();
        
        // Обновляем данные в профиле
        document.getElementById('profile-name').textContent = user.username || 'Не указано';
        document.getElementById('profile-email').textContent = user.email || 'Не указан';
        document.getElementById('profile-phone').textContent = user.phone || 'Не указан';
        document.getElementById('profile-address').textContent = user.address || 'Не указан';
        
    } catch (error) {
        console.error('Profile load error:', error);
        showError('Не удалось загрузить данные профиля');
    }
}

// Загрузка приборов учета
async function loadMeters() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/meters`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки приборов');
        
        const meters = await response.json();
        const metersList = document.getElementById('meters-list');
        const meterSelect = document.getElementById('meter-select');
        
        // Очищаем списки
        metersList.innerHTML = '';
        meterSelect.innerHTML = '';
        
        if (meters.length === 0) {
            metersList.innerHTML = '<div class="empty-message">У вас нет зарегистрированных приборов учета</div>';
            meterSelect.innerHTML = '<option value="">Нет доступных приборов</option>';
            return;
        }
        
        // Заполняем выпадающий список
        meters.forEach(meter => {
            const option = document.createElement('option');
            option.value = meter.id;
            option.textContent = `${meter.type} (${meter.serial_number})`;
            meterSelect.appendChild(option);
        });
        
        // Заполняем список приборов
        meters.forEach(meter => {
            const meterCard = document.createElement('div');
            meterCard.className = 'meter-card';
            meterCard.innerHTML = `
                <div class="meter-header">
                    <h3>${meter.type}</h3>
                    <span class="meter-status ${meter.is_active ? 'active' : 'inactive'}">
                        ${meter.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                </div>
                <div class="meter-details">
                    <div class="detail-row">
                        <span>Серийный номер:</span>
                        <span>${meter.serial_number}</span>
                    </div>
                    <div class="detail-row">
                        <span>Дата установки:</span>
                        <span>${new Date(meter.installation_date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span>Последние показания:</span>
                        <span>${meter.last_reading || 'Нет данных'}</span>
                    </div>
                </div>
                <div class="meter-actions">
                    <button class="action-btn edit-btn" data-id="${meter.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${meter.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            metersList.appendChild(meterCard);
        });
        
    } catch (error) {
        console.error('Meters load error:', error);
        showError('Не удалось загрузить список приборов');
    }
}

// Подача показаний
async function submitReading() {
    const meterId = document.getElementById('meter-select').value;
    const value = document.getElementById('reading-value').value;
    const date = document.getElementById('reading-date').value;
    
    if (!meterId || !value || !date) {
        showError('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                meter_id: parseInt(meterId),
                value: parseFloat(value),
                date: date
            })
        });
        
        if (!response.ok) throw new Error('Ошибка отправки показаний');
        
        const result = await response.json();
        showSuccess('Показания успешно отправлены');
        loadLastReadings(meterId);
        document.getElementById('reading-value').value = '';
        
    } catch (error) {
        console.error('Submit reading error:', error);
        showError('Не удалось отправить показания');
    }
}

// Загрузка последних показаний
async function loadLastReadings(meterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/readings?meter_id=${meterId}&limit=5`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки показаний');
        
        const readings = await response.json();
        const readingsList = document.getElementById('readings-list');
        readingsList.innerHTML = '';
        
        if (readings.length === 0) {
            readingsList.innerHTML = '<div class="empty-message">Нет данных о показаниях</div>';
            return;
        }
        
        readings.forEach(reading => {
            const readingItem = document.createElement('div');
            readingItem.className = 'reading-item';
            readingItem.innerHTML = `
                <span class="reading-date">${new Date(reading.date).toLocaleDateString()}</span>
                <span class="reading-value">${reading.value}</span>
            `;
            readingsList.appendChild(readingItem);
        });
        
    } catch (error) {
        console.error('Readings load error:', error);
        showError('Не удалось загрузить историю показаний');
    }
}

// Проверка ИПУ
async function checkIPU() {
    const meterNumber = document.getElementById('meter-number').value.trim();
    
    if (!meterNumber) {
        showError('Введите номер прибора учета');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/meters/check?serial_number=${meterNumber}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка проверки ИПУ');
        
        const result = await response.json();
        const resultContent = document.getElementById('ipu-result-content');
        
        if (result.is_valid) {
            resultContent.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <p>Прибор учета с номером <strong>${meterNumber}</strong> прошел проверку</p>
                </div>
                <div class="ipu-details">
                    <p><strong>Тип:</strong> ${result.type}</p>
                    <p><strong>Дата поверки:</strong> ${new Date(result.verification_date).toLocaleDateString()}</p>
                    <p><strong>Следующая поверка:</strong> ${new Date(result.next_verification_date).toLocaleDateString()}</p>
                    <p><strong>Статус:</strong> <span class="status-active">Активен</span></p>
                </div>
            `;
        } else {
            resultContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Прибор учета с номером <strong>${meterNumber}</strong> не прошел проверку</p>
                </div>
                <div class="ipu-details">
                    <p><strong>Причина:</strong> ${result.reason || 'Неизвестная причина'}</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('IPU check error:', error);
        showError('Не удалось проверить прибор учета');
    }
}

// Загрузка истории начислений
async function loadPaymentHistory(period = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/payments?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки истории');
        
        const history = await response.json();
        const tableBody = document.getElementById('history-table-body');
        tableBody.innerHTML = '';
        
        if (history.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-message">Нет данных о начислениях</td>
                </tr>
            `;
            return;
        }
        
        history.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.reading_value || '-'}</td>
                <td>${payment.amount} руб.</td>
                <td><span class="status-${payment.status}">${payment.status === 'paid' ? 'Оплачено' : 'Не оплачено'}</span></td>
            `;
            tableBody.appendChild(row);
        });
        
        // Здесь можно добавить код для отрисовки графика (например, с помощью Chart.js)
        
    } catch (error) {
        console.error('History load error:', error);
        showError('Не удалось загрузить историю начислений');
    }
}

// Загрузка квитанций
async function loadReceipts(period = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/receipts?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки квитанций');
        
        const receipts = await response.json();
        const receiptsList = document.getElementById('receipts-list');
        receiptsList.innerHTML = '';
        
        if (receipts.length === 0) {
            receiptsList.innerHTML = '<div class="empty-message">Нет доступных квитанций</div>';
            return;
        }
        
        receipts.forEach(receipt => {
            const receiptItem = document.createElement('div');
            receiptItem.className = 'receipt-item';
            receiptItem.innerHTML = `
                <div class="receipt-header">
                    <h3>Квитанция №${receipt.id}</h3>
                    <span class="receipt-date">${new Date(receipt.date).toLocaleDateString()}</span>
                </div>
                <div class="receipt-details">
                    <div class="detail-row">
                        <span>Сумма:</span>
                        <span>${receipt.amount} руб.</span>
                    </div>
                    <div class="detail-row">
                        <span>Статус:</span>
                        <span class="status-${receipt.status}">
                            ${receipt.status === 'paid' ? 'Оплачено' : 'Не оплачено'}
                        </span>
                    </div>
                </div>
                <div class="receipt-actions">
                    <button class="action-btn view-btn" data-id="${receipt.id}">
                        <i class="fas fa-eye"></i> Просмотреть
                    </button>
                    ${receipt.status === 'unpaid' ? 
                        `<button class="action-btn pay-btn" data-id="${receipt.id}">
                            <i class="fas fa-ruble-sign"></i> Оплатить
                        </button>` : ''}
                    <button class="action-btn download-btn" data-id="${receipt.id}">
                        <i class="fas fa-download"></i> Скачать
                    </button>
                </div>
            `;
            receiptsList.appendChild(receiptItem);
        });
        
    } catch (error) {
        console.error('Receipts load error:', error);
        showError('Не удалось загрузить квитанции');
    }
}

// Запрос справки
async function requestCertificate(type, startDate, endDate, email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/certificates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                type: type,
                start_date: startDate,
                end_date: endDate,
                email: email
            })
        });
        
        if (!response.ok) throw new Error('Ошибка запроса справки');
        
        const result = await response.json();
        showSuccess('Справка успешно запрошена. Она будет отправлена на указанный email.');
        
    } catch (error) {
        console.error('Certificate request error:', error);
        showError('Не удалось запросить справку');
    }
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
// ====================== Инициализация разделов ======================
function initContentSections() {
    // Профиль
    document.getElementById('profile-content')?.addEventListener('show', loadProfile);
    
    // Приборы учета
    document.getElementById('meters-content')?.addEventListener('show', loadMeters);
    
    // Подача показаний
    document.getElementById('submitReadings-content')?.addEventListener('show', function() {
        loadMeters();
        document.getElementById('reading-date').valueAsDate = new Date();
    });
    
    // История начислений
    document.getElementById('history-content')?.addEventListener('show', function() {
        loadPaymentHistory(document.getElementById('history-period').value);
    });
    
    // Квитанции
    document.getElementById('receipt-content')?.addEventListener('show', function() {
        loadReceipts(document.getElementById('receipt-period').value);
    });
}

// Обновляем функцию showContent для вызова событий при показе раздела
function showContent(sectionId) {
    const currentSection = document.querySelector('.content-section.active');
    const targetSection = document.getElementById(sectionId + '-content');
    
    if (!targetSection || currentSection === targetSection) return;
    
    // Анимация исчезновения текущего раздела
    if (currentSection) {
        currentSection.style.opacity = 0;
        currentSection.style.transform = 'translateY(20px)';
        setTimeout(() => {
            currentSection.classList.remove('active');
            currentSection.style.display = 'none';
            
            // Анимация появления нового раздела
            targetSection.style.display = 'block';
            setTimeout(() => {
                targetSection.classList.add('active');
                targetSection.style.opacity = 1;
                targetSection.style.transform = 'translateY(0)';
                
                // Вызываем событие показа для нового раздела
                const event = new Event('show');
                targetSection.dispatchEvent(event);
            }, 50);
        }, 300);
    }
}

// ====================== Вспомогательные функции ======================
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'alert error';
    errorElement.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-exclamation-circle alert-icon"></i>
            <div class="alert-text">${message}</div>
        </div>
    `;
    
    // Добавляем сообщение в начало контента
    const content = document.querySelector('.main-content');
    if (content) {
        content.insertBefore(errorElement, content.firstChild);
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
}

function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'alert success';
    successElement.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-check-circle alert-icon"></i>
            <div class="alert-text">${message}</div>
        </div>
    `;
    
    // Добавляем сообщение в начало контента
    const content = document.querySelector('.main-content');
    if (content) {
        content.insertBefore(successElement, content.firstChild);
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
            successElement.remove();
        }, 5000);
    }
}

// Обновляем инициализацию
document.addEventListener('DOMContentLoaded', () => {
    // ... существующий код ...
    
    // Инициализация разделов
    initContentSections();
    setupEventListeners();
    
    // Если пользователь авторизован, загружаем данные для активного раздела
    if (localStorage.getItem('token')) {
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            const event = new Event('show');
            activeSection.dispatchEvent(event);
        }
    }
});