/**
 * Dashboard JavaScript
 * AJAX calls, filtering, pagination, and interactive features
 */

// Global değişkenler
let currentPage = 1;
let perPage = 25;
let currentFilters = {};
let currentSort = { by: 'priority_score', dir: 'DESC' };
let refreshInterval = null;
let allEvents = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Tema yükle
    loadTheme();

    // İlk verileri yükle
    loadSummaryData();
    loadEvents();

    // Auto-refresh başlat
    startAutoRefresh();

    // Event listeners
    initializeEventListeners();

    // Tema toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
});

/**
 * Event listeners'ı başlat
 */
function initializeEventListeners() {
    // Filtre checkboxları
    document.querySelectorAll('#attackTypeFilters input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Auto-apply değilse manuel olarak applyFilters çağrılmalı
        });
    });

    document.querySelectorAll('#priorityFilters input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Auto-apply değilse manuel olarak applyFilters çağrılmalı
        });
    });
}

/**
 * Özet istatistikleri yükle
 */
async function loadSummaryData() {
    try {
        const response = await fetch('api/get_summary.php');
        const result = await response.json();

        if (result.success) {
            updateSummaryCards(result.data.summary);
            updateCharts(result.data);
        } else {
            showToast('Hata', result.error || 'Veriler yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Summary data error:', error);
        showToast('Hata', 'Sunucu ile bağlantı kurulamadı', 'error');
    }
}

/**
 * Özet kartları güncelle
 */
function updateSummaryCards(summary) {
    document.getElementById('totalEvents').textContent = formatNumber(summary.total_events || 0);
    document.getElementById('criticalEvents').textContent = formatNumber(summary.priority_critical || 0);
    document.getElementById('highEvents').textContent = formatNumber(summary.priority_high || 0);
    document.getElementById('mediumEvents').textContent = formatNumber(summary.priority_medium || 0);
    document.getElementById('lowEvents').textContent = formatNumber(summary.priority_low || 0);
    document.getElementById('dailyAverage').textContent = formatNumber(summary.daily_average || 0, 1);

    // Kritik olay bildirimi
    if (summary.unprocessed_critical > 0) {
        document.getElementById('notificationCount').textContent = summary.unprocessed_critical;
        document.getElementById('notificationCount').style.display = 'block';
    }
}

/**
 * Olayları yükle
 */
async function loadEvents(page = 1) {
    showLoading();

    try {
        // URL parametreleri oluştur
        const params = new URLSearchParams({
            page: page,
            per_page: perPage,
            order_by: currentSort.by,
            order_dir: currentSort.dir,
            ...currentFilters
        });

        const response = await fetch(`api/get_events.php?${params}`);
        const result = await response.json();

        if (result.success) {
            allEvents = result.data;
            displayEvents(result.data);
            updatePagination(result.pagination);
            updateTableInfo(result.pagination);
        } else {
            showToast('Hata', result.error || 'Olaylar yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Load events error:', error);
        showToast('Hata', 'Sunucu ile bağlantı kurulamadı', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Olayları tabloda göster
 */
function displayEvents(events) {
    const tbody = document.getElementById('eventsTableBody');

    if (events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Gösterilecek olay bulunamadı</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr data-event-id="${event.id}">
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-${event.priority_level}">${event.priority_label}</span>
                    <span style="font-weight: 600; color: ${getPriorityColor(event.priority_level)};">
                        ${event.priority_score}
                    </span>
                </div>
            </td>
            <td>
                <div>${event.formatted_timestamp}</div>
                <small style="color: var(--text-tertiary);">${event.time_ago}</small>
            </td>
            <td><code>${event.source_ip}</code></td>
            <td><code>${event.destination_ip}</code></td>
            <td><code>${event.destination_port}</code></td>
            <td>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                    <span>${event.attack_icon}</span>
                    <span>${event.attack_type}</span>
                </span>
            </td>
            <td>
                ${event.is_processed
                    ? '<span class="badge badge-processed">İşlenmiş</span>'
                    : '<span class="badge badge-pending">Bekliyor</span>'
                }
            </td>
            <td>
                <button class="btn-icon" onclick="viewEventDetail(${event.id})" title="Detay">
                    <i class="fas fa-eye"></i>
                </button>
                ${!event.is_processed
                    ? `<button class="btn-icon" onclick="markAsProcessed(${event.id})" title="İşlenmiş İşaretle">
                        <i class="fas fa-check"></i>
                    </button>`
                    : ''
                }
            </td>
        </tr>
    `).join('');
}

/**
 * Sayfalamayı güncelle
 */
function updatePagination(pagination) {
    const container = document.getElementById('pagination');
    const { current_page, total_pages, has_prev, has_next } = pagination;

    let html = '';

    // İlk sayfa
    html += `<button onclick="loadEvents(1)" ${current_page === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
    </button>`;

    // Önceki sayfa
    html += `<button onclick="loadEvents(${current_page - 1})" ${!has_prev ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
    </button>`;

    // Sayfa numaraları
    const startPage = Math.max(1, current_page - 2);
    const endPage = Math.min(total_pages, current_page + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button onclick="loadEvents(${i})" class="${i === current_page ? 'active' : ''}">
            ${i}
        </button>`;
    }

    // Sonraki sayfa
    html += `<button onclick="loadEvents(${current_page + 1})" ${!has_next ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
    </button>`;

    // Son sayfa
    html += `<button onclick="loadEvents(${total_pages})" ${current_page === total_pages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
    </button>`;

    container.innerHTML = html;
}

/**
 * Tablo bilgilerini güncelle
 */
function updateTableInfo(pagination) {
    const { total, per_page, current_page } = pagination;
    const start = (current_page - 1) * per_page + 1;
    const end = Math.min(current_page * per_page, total);

    document.getElementById('tableInfo').textContent =
        `${formatNumber(total)} kayıttan ${formatNumber(start)}-${formatNumber(end)} arası gösteriliyor`;
}

/**
 * Filtreleri uygula
 */
function applyFilters() {
    currentFilters = {};

    // Tarih filtreleri
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    if (startDate) currentFilters.start_date = startDate;
    if (endDate) currentFilters.end_date = endDate;

    // Saldırı tipi filtreleri
    const attackTypes = [];
    document.querySelectorAll('#attackTypeFilters input[type="checkbox"]:checked').forEach(cb => {
        attackTypes.push(cb.value);
    });
    if (attackTypes.length > 0) {
        currentFilters['attack_types[]'] = attackTypes;
    }

    // Öncelik filtreleri
    const priorityLevels = [];
    document.querySelectorAll('#priorityFilters input[type="checkbox"]:checked').forEach(cb => {
        priorityLevels.push(cb.value);
    });
    if (priorityLevels.length > 0) {
        currentFilters['priority_levels[]'] = priorityLevels;
    }

    // IP filtreleri
    const sourceIP = document.getElementById('filterSourceIP').value;
    const destIP = document.getElementById('filterDestIP').value;
    if (sourceIP) currentFilters.source_ip = sourceIP;
    if (destIP) currentFilters.destination_ip = destIP;

    // Port filtresi
    const port = document.getElementById('filterPort').value;
    if (port) currentFilters.destination_port = port;

    // İlk sayfaya dön ve yükle
    currentPage = 1;
    loadEvents(1);
}

/**
 * Filtreleri sıfırla
 */
function resetFilters() {
    currentFilters = {};

    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterSourceIP').value = '';
    document.getElementById('filterDestIP').value = '';
    document.getElementById('filterPort').value = '';

    document.querySelectorAll('#attackTypeFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = !cb.value.includes('BENIGN');
    });

    document.querySelectorAll('#priorityFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = !cb.value.includes('low');
    });

    setDateFilter('all');
    loadEvents(1);
}

/**
 * Tarih filtresi ayarla
 */
function setDateFilter(period) {
    const today = new Date();
    let startDate = '';

    // Aktif buton stilini güncelle
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    switch (period) {
        case 'today':
            startDate = formatDate(today);
            document.getElementById('filterStartDate').value = startDate;
            document.getElementById('filterEndDate').value = startDate;
            break;
        case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            document.getElementById('filterStartDate').value = formatDate(weekAgo);
            document.getElementById('filterEndDate').value = formatDate(today);
            break;
        case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            document.getElementById('filterStartDate').value = formatDate(monthAgo);
            document.getElementById('filterEndDate').value = formatDate(today);
            break;
        case 'all':
            document.getElementById('filterStartDate').value = '';
            document.getElementById('filterEndDate').value = '';
            break;
    }
}

/**
 * Olay detayını görüntüle
 */
async function viewEventDetail(eventId) {
    openModal('eventDetailModal');

    const contentDiv = document.getElementById('eventDetailContent');
    contentDiv.innerHTML = '<div class="loading-spinner"></div><p>Yükleniyor...</p>';

    try {
        const response = await fetch(`api/get_event_detail.php?id=${eventId}`);
        const result = await response.json();

        if (result.success) {
            displayEventDetail(result.data);
        } else {
            contentDiv.innerHTML = `<p class="text-center" style="color: var(--danger-color);">${result.error}</p>`;
        }
    } catch (error) {
        console.error('Event detail error:', error);
        contentDiv.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Veri yüklenemedi</p>';
    }
}

/**
 * Olay detayını göster
 */
function displayEventDetail(data) {
    const event = data.event;
    const html = `
        <div style="display: grid; gap: 20px;">
            <!-- Temel Bilgiler -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-info-circle"></i> Temel Bilgiler</h3>
                </div>
                <div class="card-body">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Öncelik:</td>
                            <td style="padding: 8px;">
                                <span class="badge badge-${event.priority_level}">${event.priority_label}</span>
                                <strong style="margin-left: 8px;">${event.priority_score}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Tarih/Saat:</td>
                            <td style="padding: 8px;">${event.formatted_timestamp}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Saldırı Tipi:</td>
                            <td style="padding: 8px;">${event.attack_icon} ${event.attack_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Kaynak IP:</td>
                            <td style="padding: 8px;"><code>${event.source_ip}</code>:${event.source_port}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Hedef IP:</td>
                            <td style="padding: 8px;"><code>${event.destination_ip}</code>:${event.destination_port}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Protokol:</td>
                            <td style="padding: 8px;">${event.protocol}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Toplam Paket:</td>
                            <td style="padding: 8px;">${formatNumber(event.total_packets)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Toplam Veri:</td>
                            <td style="padding: 8px;">${event.formatted_bytes}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: 600;">Durum:</td>
                            <td style="padding: 8px;">
                                ${event.is_processed
                                    ? '<span class="badge badge-processed">İşlenmiş</span>'
                                    : '<span class="badge badge-pending">Bekliyor</span>'
                                }
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Önerilen Aksiyon -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-lightbulb"></i> Önerilen Aksiyon</h3>
                </div>
                <div class="card-body">
                    <p>${data.recommended_action}</p>
                    <p style="margin-top: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                        ${getRecommendation(event)}
                    </p>
                </div>
            </div>

            <!-- İşlem Notları -->
            ${event.notes ? `
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-sticky-note"></i> İşlem Notları</h3>
                    </div>
                    <div class="card-body">
                        <p>${event.notes}</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('eventDetailContent').innerHTML = html;
}

/**
 * Olayı işlenmiş olarak işaretle
 */
async function markAsProcessed(eventId) {
    if (!confirm('Bu olayı işlenmiş olarak işaretlemek istediğinizden emin misiniz?')) {
        return;
    }

    const csrfToken = document.getElementById('csrfToken').value;
    const formData = new FormData();
    formData.append('id', eventId);
    formData.append('csrf_token', csrfToken);

    try {
        const response = await fetch('api/process_event.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showToast('Başarılı', 'Olay işlenmiş olarak işaretlendi', 'success');
            loadEvents(currentPage);
            loadSummaryData();
        } else {
            showToast('Hata', result.error || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Mark processed error:', error);
        showToast('Hata', 'Sunucu ile bağlantı kurulamadı', 'error');
    }
}

/**
 * Veri dışa aktar
 */
function exportData(format) {
    const params = new URLSearchParams({
        format: format,
        ...currentFilters
    });

    window.location.href = `api/export_data.php?${params}`;
    showToast('Başarılı', `${format.toUpperCase()} dosyası indiriliyor...`, 'info');
}

/**
 * Sayfa başına kayıt sayısını değiştir
 */
function changePerPage(value) {
    perPage = parseInt(value);
    loadEvents(1);
}

/**
 * Tabloyu sırala
 */
function sortTable(column) {
    if (currentSort.by === column) {
        currentSort.dir = currentSort.dir === 'ASC' ? 'DESC' : 'ASC';
    } else {
        currentSort.by = column;
        currentSort.dir = 'DESC';
    }

    loadEvents(currentPage);
}

/**
 * Modal aç
 */
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

/**
 * Modal kapat
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

/**
 * Toast bildirimi göster
 */
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconMap[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

/**
 * Loading göster/gizle
 */
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

/**
 * Tema değiştir
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // İkon güncelle
    const icon = document.querySelector('#themeToggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/**
 * Tema yükle
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.querySelector('#themeToggle i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/**
 * Auto-refresh başlat
 */
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        loadSummaryData();
        loadEvents(currentPage);
    }, 30000); // 30 saniye
}

/**
 * Yardımcı fonksiyonlar
 */
function formatNumber(num, decimals = 0) {
    return Number(num).toLocaleString('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Sayfa kapatıldığında interval'i temizle
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
