/**
 * Chart.js - Grafik Yönetimi
 */

// Chart instances
let hourlyChart = null;
let attackTypeChart = null;
let topPortsChart = null;
let trendChart = null;

/**
 * Grafikleri güncelle
 */
function updateCharts(data) {
    createHourlyChart(data.hourly_distribution);
    createAttackTypeChart(data.attack_distribution);
    createTopPortsChart(data.top_ports);
    createTrendChart(data.trend_analysis);
}

/**
 * Saatlik dağılım grafiği
 */
function createHourlyChart(data) {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;

    // Mevcut chart'ı temizle
    if (hourlyChart) {
        hourlyChart.destroy();
    }

    // 24 saat için veri hazırla
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const totalEvents = new Array(24).fill(0);
    const criticalEvents = new Array(24).fill(0);

    data.forEach(item => {
        const hour = parseInt(item.hour);
        totalEvents[hour] = parseInt(item.total_events);
        criticalEvents[hour] = parseInt(item.critical_events);
    });

    hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [
                {
                    label: 'Toplam Olaylar',
                    data: totalEvents,
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Kritik Olaylar',
                    data: criticalEvents,
                    borderColor: 'rgb(220, 38, 38)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' olay';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Saldırı tipi dağılım grafiği (Pasta)
 */
function createAttackTypeChart(data) {
    const ctx = document.getElementById('attackTypeChart');
    if (!ctx) return;

    if (attackTypeChart) {
        attackTypeChart.destroy();
    }

    // BENIGN hariç, en yüksek 8 saldırı tipini al
    const filtered = data
        .filter(item => item.attack_type !== 'BENIGN')
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    const labels = filtered.map(item => item.attack_type);
    const counts = filtered.map(item => parseInt(item.count));

    // Renk paleti
    const colors = [
        'rgb(220, 38, 38)',   // Kırmızı
        'rgb(245, 158, 11)',  // Turuncu
        'rgb(59, 130, 246)',  // Mavi
        'rgb(16, 185, 129)',  // Yeşil
        'rgb(99, 102, 241)',  // İndigo
        'rgb(236, 72, 153)',  // Pembe
        'rgb(168, 85, 247)',  // Mor
        'rgb(251, 146, 60)'   // Açık turuncu
    ];

    attackTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * En çok hedef alınan portlar grafiği (Bar)
 */
function createTopPortsChart(data) {
    const ctx = document.getElementById('topPortsChart');
    if (!ctx) return;

    if (topPortsChart) {
        topPortsChart.destroy();
    }

    const labels = data.map(item => {
        const port = item.destination_port;
        const service = item.service_name || 'Unknown';
        return `${port} (${service})`;
    });
    const counts = data.map(item => parseInt(item.count));

    topPortsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Olay Sayısı',
                data: counts,
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Yatay bar
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return 'Olay Sayısı: ' + context.parsed.x;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Trend analiz grafiği (Alan)
 */
function createTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (trendChart) {
        trendChart.destroy();
    }

    const labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
    });

    const totalEvents = data.map(item => parseInt(item.total_events));
    const criticalEvents = data.map(item => parseInt(item.critical_events));
    const maliciousEvents = data.map(item => parseInt(item.malicious_events));

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Toplam Olaylar',
                    data: totalEvents,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Zararlı Olaylar',
                    data: maliciousEvents,
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Kritik Olaylar',
                    data: criticalEvents,
                    borderColor: 'rgb(220, 38, 38)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' olay';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Tek bir grafiği yenile
 */
async function refreshChart(chartName) {
    showToast('Bilgi', 'Grafik yenileniyor...', 'info');

    try {
        const response = await fetch('api/get_summary.php');
        const result = await response.json();

        if (result.success) {
            switch (chartName) {
                case 'hourlyChart':
                    createHourlyChart(result.data.hourly_distribution);
                    break;
                case 'attackTypeChart':
                    createAttackTypeChart(result.data.attack_distribution);
                    break;
                case 'topPortsChart':
                    createTopPortsChart(result.data.top_ports);
                    break;
                case 'trendChart':
                    createTrendChart(result.data.trend_analysis);
                    break;
            }
            showToast('Başarılı', 'Grafik güncellendi', 'success');
        }
    } catch (error) {
        console.error('Refresh chart error:', error);
        showToast('Hata', 'Grafik güncellenemedi', 'error');
    }
}

/**
 * Trend periyodunu değiştir
 */
async function changeTrendPeriod(period) {
    showToast('Bilgi', 'Trend verisi yükleniyor...', 'info');

    try {
        const response = await fetch(`api/get_summary.php?trend_period=${period}`);
        const result = await response.json();

        if (result.success) {
            createTrendChart(result.data.trend_analysis);
            showToast('Başarılı', 'Trend grafiği güncellendi', 'success');
        }
    } catch (error) {
        console.error('Change trend period error:', error);
        showToast('Hata', 'Trend verisi yüklenemedi', 'error');
    }
}

/**
 * Tüm grafikleri temizle (tema değişiminde kullanılabilir)
 */
function destroyAllCharts() {
    if (hourlyChart) hourlyChart.destroy();
    if (attackTypeChart) attackTypeChart.destroy();
    if (topPortsChart) topPortsChart.destroy();
    if (trendChart) trendChart.destroy();
}

/**
 * Chart.js global ayarları
 */
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
