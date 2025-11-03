/**
 * Önceliklendirme Algoritması
 * Network Event Priority Scoring Algorithm
 */

// Ağırlık faktörleri (toplam 100)
const WEIGHT_ATTACK_TYPE = 40;
const WEIGHT_TRAFFIC_VOLUME = 25;
const WEIGHT_PORT_CRITICALITY = 20;
const WEIGHT_FREQUENCY = 10;
const WEIGHT_TIME_FACTOR = 5;

// Saldırı tipi ağırlıkları (0-100)
const ATTACK_TYPE_WEIGHTS = {
    'DDoS': 100,
    'Infiltration': 95,
    'DoS Hulk': 90,
    'DoS GoldenEye': 90,
    'DoS slowloris': 85,
    'DoS Slowhttptest': 85,
    'Heartbleed': 85,
    'Bot': 80,
    'Web Attack Sql Injection': 80,
    'SSH-Patator': 75,
    'FTP-Patator': 70,
    'Web Attack Brute Force': 70,
    'Web Attack XSS': 65,
    'PortScan': 50,
    'BENIGN': 0
};

// Kritik port skorları (0-100)
const CRITICAL_PORTS = {
    3389: 95,  // RDP - Çok kritik
    22: 90,    // SSH
    443: 90,   // HTTPS
    23: 85,    // Telnet
    80: 85,    // HTTP
    1433: 85,  // MSSQL
    3306: 85,  // MySQL
    5432: 85,  // PostgreSQL
    53: 80,    // DNS
    445: 80,   // SMB
    5900: 80,  // VNC
    8443: 80,  // HTTPS-Alt
    8080: 75,  // HTTP-Alt
    21: 75,    // FTP
    20: 70,    // FTP-Data
    25: 70,    // SMTP
    110: 65,   // POP3
    143: 65    // IMAP
};

// Mesai saatleri (24 saat formatı)
const WORKING_HOURS = {
    start: 9,  // 09:00
    end: 18    // 18:00
};

/**
 * Ana öncelik skoru hesaplama fonksiyonu
 *
 * @param {Object} event - Olay objesi
 * @returns {Object} { score, level, breakdown }
 */
function calculatePriorityScore(event) {
    // 1. Saldırı Tipi Skoru
    const attackScore = calculateAttackTypeScore(event.attack_type);

    // 2. Trafik Hacmi Skoru
    const trafficScore = calculateTrafficVolumeScore(
        event.total_fwd_packets || 0,
        event.total_bwd_packets || 0,
        event.total_length_fwd_packets || 0,
        event.total_length_bwd_packets || 0
    );

    // 3. Port Kritiklik Skoru
    const portScore = calculatePortCriticalityScore(event.destination_port || 0);

    // 4. Frekans Skoru
    const frequencyScore = calculateFrequencyScore(event.frequency || 1);

    // 5. Zaman Faktörü Skoru
    const timeScore = calculateTimeFactorScore(event.timestamp);

    // Toplam skor hesapla
    const totalScore =
        (attackScore * (WEIGHT_ATTACK_TYPE / 100)) +
        (trafficScore * (WEIGHT_TRAFFIC_VOLUME / 100)) +
        (portScore * (WEIGHT_PORT_CRITICALITY / 100)) +
        (frequencyScore * (WEIGHT_FREQUENCY / 100)) +
        (timeScore * (WEIGHT_TIME_FACTOR / 100));

    // 0-100 arası sınırla
    const finalScore = Math.min(100, Math.max(0, totalScore));

    // Öncelik seviyesi belirle
    const level = determinePriorityLevel(finalScore);

    return {
        score: parseFloat(finalScore.toFixed(2)),
        level: level,
        breakdown: {
            attack_type: parseFloat((attackScore * (WEIGHT_ATTACK_TYPE / 100)).toFixed(2)),
            traffic_volume: parseFloat((trafficScore * (WEIGHT_TRAFFIC_VOLUME / 100)).toFixed(2)),
            port_criticality: parseFloat((portScore * (WEIGHT_PORT_CRITICALITY / 100)).toFixed(2)),
            frequency: parseFloat((frequencyScore * (WEIGHT_FREQUENCY / 100)).toFixed(2)),
            time_factor: parseFloat((timeScore * (WEIGHT_TIME_FACTOR / 100)).toFixed(2))
        }
    };
}

/**
 * Saldırı tipi skorunu hesapla
 *
 * @param {string} attackType
 * @returns {number} 0-100 arası skor
 */
function calculateAttackTypeScore(attackType) {
    return ATTACK_TYPE_WEIGHTS[attackType] || 25;
}

/**
 * Trafik hacmi skorunu hesapla
 * Yüksek paket/byte sayısı = Yüksek skor
 *
 * @param {number} fwdPackets
 * @param {number} bwdPackets
 * @param {number} fwdBytes
 * @param {number} bwdBytes
 * @returns {number} 0-100 arası skor
 */
function calculateTrafficVolumeScore(fwdPackets, bwdPackets, fwdBytes, bwdBytes) {
    const totalPackets = fwdPackets + bwdPackets;
    const totalBytes = fwdBytes + bwdBytes;

    // Normalize et (logaritmik ölçek kullan)
    let packetScore = 0;
    if (totalPackets > 0) {
        // 10 paket = 10 skor, 100 paket = 20 skor, 1000 paket = 30 skor, vb.
        packetScore = Math.min(50, Math.log10(totalPackets + 1) * 10);
    }

    let byteScore = 0;
    if (totalBytes > 0) {
        // 1KB = 10 skor, 10KB = 20 skor, 100KB = 30 skor, vb.
        byteScore = Math.min(50, Math.log10(totalBytes / 1000 + 1) * 10);
    }

    return packetScore + byteScore;
}

/**
 * Port kritiklik skorunu hesapla
 *
 * @param {number} port
 * @returns {number} 0-100 arası skor
 */
function calculatePortCriticalityScore(port) {
    // Kritik portlar listesinde var mı?
    if (CRITICAL_PORTS.hasOwnProperty(port)) {
        return CRITICAL_PORTS[port];
    }

    // Yaygın port aralıkları
    if (port <= 1024) {
        return 40; // Well-known ports
    } else if (port <= 49151) {
        return 20; // Registered ports
    } else {
        return 10; // Dynamic/private ports
    }
}

/**
 * Frekans skorunu hesapla
 * Aynı kaynaktan tekrarlanan saldırılar = Yüksek skor
 *
 * @param {number} frequency - Tekrar sayısı
 * @returns {number} 0-100 arası skor
 */
function calculateFrequencyScore(frequency) {
    // 1 olay = 20 skor, 5 olay = 60 skor, 10+ olay = 100 skor
    return Math.min(100, 20 + (frequency - 1) * 10);
}

/**
 * Zaman faktörü skorunu hesapla
 * Mesai dışı olaylar daha şüpheli
 *
 * @param {string} timestamp - ISO format tarih
 * @returns {number} 0-100 arası skor
 */
function calculateTimeFactorScore(timestamp) {
    if (!timestamp) {
        return 50; // Varsayılan
    }

    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Pazar, 6 = Cumartesi

    // Hafta sonu kontrolü
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 80; // Hafta sonu şüpheli
    }

    // Mesai saati kontrolü
    if (hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end) {
        return 40; // Mesai saati içi - normal
    } else if (hour >= 0 && hour < 6) {
        return 90; // Gece yarısı - çok şüpheli
    } else {
        return 70; // Mesai dışı - şüpheli
    }
}

/**
 * Skora göre öncelik seviyesi belirle
 *
 * @param {number} score
 * @returns {string} 'critical', 'high', 'medium', 'low'
 */
function determinePriorityLevel(score) {
    if (score >= 80) {
        return 'critical';
    } else if (score >= 60) {
        return 'high';
    } else if (score >= 40) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Öncelik seviyesine göre renk döndür
 *
 * @param {string} level
 * @returns {string} CSS renk kodu
 */
function getPriorityColor(level) {
    const colors = {
        'critical': '#dc2626',
        'high': '#f59e0b',
        'medium': '#3b82f6',
        'low': '#10b981'
    };
    return colors[level] || '#6b7280';
}

/**
 * Öncelik seviyesine göre Türkçe etiket döndür
 *
 * @param {string} level
 * @returns {string}
 */
function getPriorityLabel(level) {
    const labels = {
        'critical': 'Kritik',
        'high': 'Yüksek',
        'medium': 'Orta',
        'low': 'Düşük'
    };
    return labels[level] || 'Bilinmiyor';
}

/**
 * Öncelik skoru görselleştirme için yüzde hesapla
 *
 * @param {number} score
 * @returns {number} 0-100 arası yüzde
 */
function getScorePercentage(score) {
    return Math.round(score);
}

/**
 * Birden fazla olayı önceliğe göre sırala
 *
 * @param {Array} events
 * @returns {Array} Sıralanmış olaylar
 */
function sortEventsByPriority(events) {
    return events.sort((a, b) => {
        // Önce priority_score'a göre
        if (b.priority_score !== a.priority_score) {
            return b.priority_score - a.priority_score;
        }
        // Sonra timestamp'e göre (yeni olaylar önce)
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
}

/**
 * Kritik olayları filtrele
 *
 * @param {Array} events
 * @returns {Array} Sadece kritik olaylar
 */
function filterCriticalEvents(events) {
    return events.filter(event => event.priority_level === 'critical');
}

/**
 * İşlenmemiş olayları filtrele
 *
 * @param {Array} events
 * @returns {Array} İşlenmemiş olaylar
 */
function filterUnprocessedEvents(events) {
    return events.filter(event => !event.is_processed);
}

/**
 * Skor breakdown'ını yüzde olarak hesapla
 *
 * @param {Object} breakdown
 * @returns {Object} Yüzde değerleri
 */
function getBreakdownPercentages(breakdown) {
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const percentages = {};

    for (const [key, value] of Object.entries(breakdown)) {
        percentages[key] = total > 0 ? Math.round((value / total) * 100) : 0;
    }

    return percentages;
}

/**
 * Önceliklendirme önerisi oluştur
 *
 * @param {Object} event
 * @returns {string} Öneri metni
 */
function getRecommendation(event) {
    const score = event.priority_score;
    const attackType = event.attack_type;

    if (score >= 90) {
        return '🚨 ACİL MÜDAHALE GEREKLİ! Bu olay en yüksek önceliğe sahip. Hemen güvenlik ekibini bilgilendirin.';
    } else if (score >= 80) {
        return '⚠️ KRİTİK OLAY! Bu olaya öncelikli olarak müdahale edilmeli.';
    } else if (score >= 60) {
        return '⚡ YÜKSEK ÖNCELİK! Bu olay yakın takibe alınmalı ve analiz edilmeli.';
    } else if (score >= 40) {
        return 'ℹ️ ORTA ÖNCELİK! Bu olay normal iş akışı içinde incelenebilir.';
    } else if (attackType === 'BENIGN') {
        return '✅ Normal trafik - Aksiyona gerek yok.';
    } else {
        return '📊 Düşük öncelikli olay - Rutin kontroller sırasında incelenebilir.';
    }
}

// Export fonksiyonları (eğer modül sistemi kullanılıyorsa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculatePriorityScore,
        determinePriorityLevel,
        getPriorityColor,
        getPriorityLabel,
        sortEventsByPriority,
        filterCriticalEvents,
        filterUnprocessedEvents,
        getRecommendation
    };
}
