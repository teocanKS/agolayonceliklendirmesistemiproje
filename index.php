<?php
/**
 * Ana Dashboard Sayfası
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';

$pageTitle = 'Dashboard - ' . APP_NAME;

include __DIR__ . '/includes/header.php';
?>

<div class="dashboard">
    <!-- Left Sidebar - Filters -->
    <aside class="sidebar">
        <div class="sidebar-section">
            <h3><i class="fas fa-filter"></i> Filtreler</h3>

            <!-- Tarih Aralığı -->
            <div class="filter-group">
                <label>Tarih Aralığı</label>
                <div class="date-range">
                    <input type="date" id="filterStartDate" class="input-field">
                    <span>-</span>
                    <input type="date" id="filterEndDate" class="input-field">
                </div>
                <div class="quick-date-filters">
                    <button class="quick-filter-btn" onclick="setDateFilter('today')">Bugün</button>
                    <button class="quick-filter-btn" onclick="setDateFilter('week')">Bu Hafta</button>
                    <button class="quick-filter-btn" onclick="setDateFilter('month')">Bu Ay</button>
                    <button class="quick-filter-btn active" onclick="setDateFilter('all')">Tümü</button>
                </div>
            </div>

            <!-- Saldırı Tipi -->
            <div class="filter-group">
                <label>Saldırı Tipi</label>
                <div class="filter-checkboxes" id="attackTypeFilters">
                    <label class="checkbox-label">
                        <input type="checkbox" value="DDoS" checked>
                        <span>DDoS</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="Infiltration" checked>
                        <span>Infiltration</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="PortScan" checked>
                        <span>Port Scan</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="SSH-Patator" checked>
                        <span>SSH Brute Force</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="FTP-Patator" checked>
                        <span>FTP Brute Force</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="Web Attack Sql Injection" checked>
                        <span>SQL Injection</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="Web Attack XSS" checked>
                        <span>XSS</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="Bot" checked>
                        <span>Bot</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="BENIGN">
                        <span>Normal Trafik</span>
                    </label>
                </div>
            </div>

            <!-- Öncelik Seviyesi -->
            <div class="filter-group">
                <label>Öncelik Seviyesi</label>
                <div class="filter-checkboxes" id="priorityFilters">
                    <label class="checkbox-label">
                        <input type="checkbox" value="critical" checked>
                        <span class="badge badge-critical">Kritik</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="high" checked>
                        <span class="badge badge-high">Yüksek</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="medium" checked>
                        <span class="badge badge-medium">Orta</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="low">
                        <span class="badge badge-low">Düşük</span>
                    </label>
                </div>
            </div>

            <!-- IP Filtresi -->
            <div class="filter-group">
                <label>IP Adresi</label>
                <input type="text" id="filterSourceIP" class="input-field" placeholder="Kaynak IP">
                <input type="text" id="filterDestIP" class="input-field" placeholder="Hedef IP">
            </div>

            <!-- Port Filtresi -->
            <div class="filter-group">
                <label>Hedef Port</label>
                <input type="number" id="filterPort" class="input-field" placeholder="Port numarası">
            </div>

            <!-- Filtre Butonları -->
            <div class="filter-actions">
                <button class="btn btn-primary btn-block" onclick="applyFilters()">
                    <i class="fas fa-check"></i> Filtrele
                </button>
                <button class="btn btn-secondary btn-block" onclick="resetFilters()">
                    <i class="fas fa-redo"></i> Sıfırla
                </button>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Summary Cards -->
        <section class="summary-cards">
            <div class="card stat-card stat-card-primary">
                <div class="stat-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="stat-details">
                    <div class="stat-value" id="totalEvents">-</div>
                    <div class="stat-label">Toplam Olay</div>
                </div>
            </div>

            <div class="card stat-card stat-card-danger">
                <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-details">
                    <div class="stat-value" id="criticalEvents">-</div>
                    <div class="stat-label">Kritik Olaylar</div>
                </div>
            </div>

            <div class="card stat-card stat-card-warning">
                <div class="stat-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="stat-details">
                    <div class="stat-value" id="highEvents">-</div>
                    <div class="stat-label">Yüksek Öncelikli</div>
                </div>
            </div>

            <div class="card stat-card stat-card-info">
                <div class="stat-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="stat-details">
                    <div class="stat-value" id="mediumEvents">-</div>
                    <div class="stat-label">Orta Öncelikli</div>
                </div>
            </div>

            <div class="card stat-card stat-card-success">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-details">
                    <div class="stat-value" id="lowEvents">-</div>
                    <div class="stat-label">Düşük Öncelikli</div>
                </div>
            </div>

            <div class="card stat-card stat-card-secondary">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-details">
                    <div class="stat-value" id="dailyAverage">-</div>
                    <div class="stat-label">Günlük Ortalama</div>
                </div>
            </div>
        </section>

        <!-- Charts Section -->
        <section class="charts-section">
            <div class="chart-row">
                <!-- Saatlik Dağılım -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-line"></i> Saatlik Olay Dağılımı</h3>
                        <div class="card-actions">
                            <button class="btn-icon" title="Yenile" onclick="refreshChart('hourlyChart')">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="hourlyChart"></canvas>
                    </div>
                </div>

                <!-- Saldırı Tipi Dağılımı -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-pie"></i> Saldırı Tipi Dağılımı</h3>
                        <div class="card-actions">
                            <button class="btn-icon" title="Yenile" onclick="refreshChart('attackTypeChart')">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="attackTypeChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="chart-row">
                <!-- En Çok Hedef Alınan Portlar -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-bar"></i> En Çok Hedef Alınan Portlar</h3>
                        <div class="card-actions">
                            <button class="btn-icon" title="Yenile" onclick="refreshChart('topPortsChart')">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="topPortsChart"></canvas>
                    </div>
                </div>

                <!-- Trend Analizi -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-area"></i> Haftalık Trend</h3>
                        <div class="card-actions">
                            <select id="trendPeriod" onchange="changeTrendPeriod(this.value)">
                                <option value="week">Haftalık</option>
                                <option value="month">Aylık</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <!-- Events Table -->
        <section class="events-section">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Önceliklendirilmiş Olaylar</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="exportData('csv')">
                            <i class="fas fa-file-csv"></i> CSV
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="exportData('json')">
                            <i class="fas fa-file-code"></i> JSON
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="loadEvents()">
                            <i class="fas fa-sync"></i> Yenile
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Table Controls -->
                    <div class="table-controls">
                        <div class="table-control-left">
                            <label>
                                Göster:
                                <select id="perPageSelect" onchange="changePerPage(this.value)">
                                    <option value="10">10</option>
                                    <option value="25" selected>25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                kayıt
                            </label>
                        </div>
                        <div class="table-control-right">
                            <span id="tableInfo">-</span>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="table-container">
                        <table class="events-table" id="eventsTable">
                            <thead>
                                <tr>
                                    <th onclick="sortTable('priority_score')">
                                        Öncelik <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="sortTable('timestamp')">
                                        Tarih/Saat <i class="fas fa-sort"></i>
                                    </th>
                                    <th>Kaynak IP</th>
                                    <th>Hedef IP</th>
                                    <th>Port</th>
                                    <th onclick="sortTable('attack_type')">
                                        Saldırı Tipi <i class="fas fa-sort"></i>
                                    </th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody id="eventsTableBody">
                                <tr>
                                    <td colspan="8" class="text-center">
                                        <div class="loading-spinner"></div>
                                        <p>Veriler yükleniyor...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="pagination" id="pagination">
                        <!-- Dinamik olarak oluşturulacak -->
                    </div>
                </div>
            </div>
        </section>
    </main>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
