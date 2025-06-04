// ====================== Глобальные переменные ======================
const API_BASE_URL = 'http://localhost:8000';
const AUTH_ENDPOINTS = {
    login: '/auth/login',
    register: '/auth/register',
    forgot: '/auth/forgot-password',
    validate: '/auth/validate-token'
    
};

// ====================== Вспомогательные функции ======================
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'alert error';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.prepend(errorElement);
    }
    
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'alert success';
    successElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.prepend(successElement);
    }
    
    setTimeout(() => {
        successElement.remove();
    }, 5000);
}

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
    const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
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

// ====================== Функции профиля пользователя ======================
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Пользователь не авторизован');
        }

        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Ошибка загрузки профиля');
        }
        
        const user = await response.json();
        
        document.getElementById('profileName').value = user.username || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileAddress').value = user.address || '';
        
    } catch (error) {
        console.error('Profile load error:', error);
        showError(error.message || 'Не удалось загрузить профиль');
    }
}

function loadProfile() {
    // Получаем сохраненные данные пользователя
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
        // Заполняем поля формы данными из localStorage
        document.getElementById('profileName').value = user.username || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileAddress').value = user.address || '';
    } else {
        console.log('Данные пользователя не найдены');
    }
}

// Упрощенная функция сохранения профиля
async function saveProfile() {
    const userData = {
        username: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Ошибка обновления профиля');
        }

        // Обновляем данные в localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = {...currentUser, ...userData};
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Показываем сообщение об успехе
        document.getElementById('profileSuccess').style.display = 'block';
        setTimeout(() => {
            document.getElementById('profileSuccess').style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Не удалось сохранить изменения');
    }
}

// Вызываем загрузку профиля при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли пользователь в localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        console.log('Пользователь не авторизован');
        return;
    }
    
    // Если пользователь есть - заполняем профиль
    loadProfile();
});

// ====================== Функции приборов учета ======================
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
        
        metersList.innerHTML = '';
        meterSelect.innerHTML = '';
        
        if (meters.length === 0) {
            metersList.innerHTML = '<div class="empty-message">У вас нет зарегистрированных приборов учета</div>';
            meterSelect.innerHTML = '<option value="">Нет доступных приборов</option>';
            return;
        }
        
        meters.forEach(meter => {
            const option = document.createElement('option');
            option.value = meter.id;
            option.textContent = `${meter.type} (${meter.serial_number})`;
            meterSelect.appendChild(option);

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

// ====================== Функции показаний ======================
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

// ====================== Другие функции ======================
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
        const userPanel = document.getElementById('userPanel');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (userPanel) userPanel.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = user.username;
        
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        if (sidebarUserName) sidebarUserName.textContent = user.username;
        if (sidebarUserEmail) sidebarUserEmail.textContent = user.email;
        
        const welcomeHeader = document.getElementById('welcomeHeader');
        if (welcomeHeader) welcomeHeader.textContent = `Добро пожаловать, ${user.username}!`;
        
        const alertInfo = document.querySelector('.alert.info');
        if (alertInfo) alertInfo.style.display = 'none';
    } else {
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

function showContent(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    const activeSection = document.getElementById(sectionId + '-content');
    if(activeSection) {
        activeSection.style.display = 'block';
        
        if (sectionId === 'profile') {
            loadProfile();
        }
    }
}

// ====================== Инициализация ======================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLoginFormSubmit);
    }

    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', handleRegisterFormSubmit);
    }

    if (document.getElementById('forgotPasswordForm')) {
        document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPasswordFormSubmit);
    }

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.closest('.form-group').querySelector('input[type="password"]');
            const icon = button.querySelector('i');
            if (input && icon) {
                togglePasswordVisibility(input.id, icon);
            }
        });
    });

    checkAuthStatus();
    updateUI();
});
// ====================== Функции для работы с показаниями ======================
window.meters = [];
// Загружаем список приборов учета
// Функция загрузки приборов
async function loadMeters() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
  
      const response = await fetch('/api/meters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Meters load error:', error);
      showErrorNotification('Ошибка загрузки приборов');
    }
  }
        
        meters.forEach(meter => {
            // Добавляем в выпадающий список
            const option = document.createElement('option');
            option.value = meter.id;
            option.textContent = `${meter.type} (${meter.number})`;
            meterSelect.appendChild(option);
            
            // Добавляем карточку прибора
            const meterCard = document.createElement('div');
            meterCard.className = 'meter-card';
            meterCard.innerHTML = `
                <div class="meter-header">
                    <h3>${meter.type}</h3>
                </div>
                <div class="meter-details">
                    <div class="detail-row">
                        <span>Номер:</span>
                        <span>${meter.number}</span>
                    </div>
                    <div class="detail-row">
                        <span>Дата установки:</span>
                        <span>${new Date(meter.installed_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="meter-actions">
                    <button class="action-btn edit-btn" onclick="editMeter(${meter.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMeter(${meter.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            metersList.appendChild(meterCard);
        });
        
// ===== Форма добавления прибора =====
function showAddMeterForm() {
    document.getElementById('addMeterForm').style.display = 'block';
}

function cancelAddMeter() {
    document.getElementById('addMeterForm').style.display = 'none';
}

async function addMeter() {
    const type = document.getElementById('meterType').value;
    const number = document.getElementById('meterNumber').value.trim();
    const installDate = document.getElementById('meterInstallDate').value;

    if (!type || !number || !installDate) {
        showAlert('Заполните все поля', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/meters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: type,
                number: number,
                installed_at: installDate
            })
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка сервера');
        }

        const newMeter = await response.json();
        meters.push(newMeter);
        renderMeters();
        
        document.getElementById('addMeterForm').style.display = 'none';
        document.getElementById('meterNumber').value = '';
        document.getElementById('meterInstallDate').value = '';
        document.getElementById('meterType').selectedIndex = 0;
        
        showAlert('Прибор успешно добавлен', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showAlert(error.message || 'Ошибка при добавлении прибора', 'error');
    }
}

// ===== Вспомогательные функции =====
function getMeterIcon(type) {
    const icons = {
        'Электричество': 'fa-bolt',
        'Вода': 'fa-tint',
        'Газ': 'fa-fire'
    };
    const iconClass = icons[type] || 'fa-bolt';
    return `<i class="fas ${iconClass}"></i>`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('meterSuccess');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 3000);
}

// ===== Удаление прибора =====
async function deleteMeter(meterId) {
    if (!confirm('Вы уверены, что хотите удалить этот прибор?')) return;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch(`/api/meters/${meterId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('Ошибка удаления прибора');
        }

        meters = meters.filter(m => m.id !== meterId);
        renderMeters();
        showAlert('Прибор успешно удален', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showAlert('Ошибка при удалении прибора', 'error');
    }
}
  
  // Инициализация при загрузке страницы
  window.addEventListener('load', async () => {
    const meters = await loadMeters(); // Теперь meters определена
    
    if (meters.length > 0) {
      renderMeters(meters);
    } else {
      showEmptyState();
    }
  });
  
  function renderMeters(meters) {
    const container = document.getElementById('meters-container');
    if (!container) return;
    
    container.innerHTML = meters.map(meter => `
      <div class="meter-card">
        <h3>${meter.number}</h3>
        <p>Тип: ${meter.type}</p>
        <p>Дата установки: ${formatDate(meter.installed_at)}</p>
      </div>
    `).join('');
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }
// Отправка показаний
async function submitReading() {
    const meterId = document.getElementById('meterSelect').value;
    const value = document.getElementById('readingValue').value;
    const dateInput = document.getElementById('readingDate');
    
    // Валидация
    if (!meterId || !value || !dateInput.value) {
        document.getElementById('readingError').style.display = 'block';
        setTimeout(() => {
            document.getElementById('readingError').style.display = 'none';
        }, 3000);
        return;
    }
    
    // Форматируем дату
    const date = new Date(dateInput.value).toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                meter_id: meterId,
                value: parseFloat(value),
                date: date
            })
        });
        
        if (!response.ok) throw new Error('Ошибка отправки показаний');
        
        // Показываем сообщение об успехе
        document.getElementById('readingSuccess').style.display = 'block';
        setTimeout(() => {
            document.getElementById('readingSuccess').style.display = 'none';
        }, 3000);
        
        // Очищаем поле значения
        document.getElementById('readingValue').value = '';
        
        // Обновляем историю
        loadReadingHistory(meterId);
        
    } catch (error) {
        console.error('Submit reading error:', error);
        showError('Не удалось отправить показания');
    }
}

// Загрузка истории показаний
async function loadReadingHistory(meterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/readings?meter_id=${meterId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки истории');
        
        const readings = await response.json();
        const historyTable = document.getElementById('readingHistory');
        
        // Очищаем таблицу
        historyTable.innerHTML = '';
        
        if (readings.length === 0) {
            historyTable.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-message">Нет данных о показаниях</td>
                </tr>
            `;
            return;
        }
        
        // Заполняем таблицу
        readings.forEach(reading => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(reading.date).toLocaleDateString()}</td>
                <td>${reading.meter_type}</td>
                <td>${reading.value}</td>
                <td><span class="status-${reading.status || 'pending'}">${reading.status === 'accepted' ? 'Принято' : 'Ожидает проверки'}</span></td>
            `;
            historyTable.appendChild(row);
        });
        
    } catch (error) {
        console.error('History load error:', error);
        showError('Не удалось загрузить историю показаний');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем приборы учета
    loadMeters();
    
    // Устанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('readingDate').valueAsDate = new Date();
    
    // Обработчик изменения выбора прибора
    document.getElementById('meterSelect').addEventListener('change', function() {
        if (this.value) {
            loadReadingHistory(this.value);
        }
    });
});
// ===== Глобальные переменные =====
let meters = [];

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadMeters();
});

// ===== Функции аутентификации =====
function checkAuthAndLoadMeters() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    loadMeters();
}

// Показать форму добавления
function showAddMeterForm() {
    document.getElementById('addMeterForm').style.display = 'block';
    document.getElementById('meterNumber').value = '';
    document.getElementById('meterInstallDate').value = '';
    document.getElementById('meterType').selectedIndex = 0;
}

// Скрыть форму добавления
function cancelAddMeter() {
    document.getElementById('addMeterForm').style.display = 'none';
}

// Добавить новый прибор
async function addMeter() {
    const type = document.getElementById('meterType').value;
    const number = document.getElementById('meterNumber').value.trim();
    const installDate = document.getElementById('meterInstallDate').value;
    
    // Валидация
    if (!type || !number || !installDate) {
        showAlert('Заполните все поля', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/meters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: type,
                number: number,
                installed_at: installDate
            })
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        const newMeter = await response.json();
        meters.push(newMeter);
        renderMeters();
        
        document.getElementById('addMeterForm').style.display = 'none';
        showAlert('Прибор успешно добавлен', 'success');
    } catch (error) {
        console.error('Ошибка при добавлении прибора:', error);
        showAlert('Ошибка при добавлении прибора', 'error');
    }
}

async function loadMeters() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/meters`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('Ошибка загрузки приборов');
        }

        const meters = await response.json();
        renderMeters(meters);
    } catch (error) {
        console.error('Ошибка:', error);
        showAlert('Ошибка загрузки приборов', 'error');
    }
}

function renderMeters() {
    const grid = document.getElementById('metersGrid');
    if (!grid) return;

    if (meters.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет добавленных приборов учета</div>';
        return;
    }

    grid.innerHTML = meters.map(meter => `
        <div class="meter-card">
            <div class="meter-icon">
                ${getMeterIcon(meter.type)}
            </div>
            <div class="meter-info">
                <h3>${meter.number}</h3>
                <p><strong>Тип:</strong> ${meter.type}</p>
                <p><strong>Дата установки:</strong> ${formatDate(meter.installed_at)}</p>
            </div>
            <div class="meter-actions">
                <button class="btn-icon" onclick="editMeter('${meter.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteMeter('${meter.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}


// Отрисовка приборов
function renderMeters() {
    const grid = document.getElementById('metersGrid');
    if (!grid) return;
    
    if (meters.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет добавленных приборов учета</div>';
        return;
    }
    
    grid.innerHTML = meters.map(meter => `
        <div class="meter-card">
            <div class="meter-icon">
                ${getMeterIcon(meter.type)}
            </div>
            <div class="meter-info">
                <h3>${meter.number}</h3>
                <p><strong>Тип:</strong> ${meter.type}</p>
                <p><strong>Дата установки:</strong> ${formatDate(meter.installed_at)}</p>
            </div>
            <div class="meter-actions">
                <button class="btn-icon" onclick="editMeter('${meter.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteMeter('${meter.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Иконка в зависимости от типа прибора
function getMeterIcon(type) {
    const icons = {
        'Электричество': 'fa-bolt',
        'Вода': 'fa-tint',
        'Газ': 'fa-fire'
    };
    const iconClass = icons[type] || 'fa-bolt';
    return `<i class="fas ${iconClass}"></i>`;
}

// Форматирование даты
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Уведомления
function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('meterSuccess');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 3000);
}

// Дополнительные функции (можно реализовать позже)
function editMeter(meterId) {
    console.log('Редактирование прибора', meterId);
    // Реализация редактирования
}

async function deleteMeter(meterId) {
    if (!confirm('Вы уверены, что хотите удалить этот прибор?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/meters/${meterId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        meters = meters.filter(m => m.id !== meterId);
        renderMeters();
        showAlert('Прибор успешно удален', 'success');
    } catch (error) {
        console.error('Ошибка удаления прибора:', error);
        showAlert('Ошибка при удалении прибора', 'error');
    }
}
async function populateMeterSelect() {
    const meterSelect = document.getElementById('meterSelect');
    
    try {
        // Очищаем список перед заполнением
        meterSelect.innerHTML = '<option value="">-- Выберите прибор --</option>';
        
        // Проверяем авторизацию
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        // Загружаем список приборов
        const response = await fetch('/api/meters', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Обработка ошибки авторизации
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }
        
        // Проверяем успешность запроса
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        // Получаем и обрабатываем данные
        const meters = await response.json();
        
        if (!meters || meters.length === 0) {
            meterSelect.innerHTML = '<option value="">Нет доступных приборов</option>';
            return;
        }
        
        // Добавляем приборы в выпадающий список
        meters.forEach(meter => {
            const option = document.createElement('option');
            option.value = meter.id;
            
            // Форматируем текст для отображения
            let meterType = '';
            switch(meter.type) {
                case 'electricity': meterType = 'Электричество'; break;
                case 'water': meterType = 'Вода'; break;
                case 'gas': meterType = 'Газ'; break;
                default: meterType = meter.type;
            }
            
            option.textContent = `${meterType} (${meter.number})`;
            option.setAttribute('data-type', meter.type);
            meterSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки приборов:', error);
        meterSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        
        // Показываем пользователю сообщение об ошибке
        const errorDiv = document.getElementById('meterError');
        if (errorDiv) {
            errorDiv.textContent = 'Не удалось загрузить список приборов';
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 3000);
        }
    }
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    populateMeterSelect();
    
    // Инициализация для обновления при изменении
    const refreshBtn = document.getElementById('refreshMeters');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', populateMeterSelect);
    }
});