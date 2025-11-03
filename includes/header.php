<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title><?php echo $pageTitle ?? APP_NAME; ?></title>

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>">

    <!-- CSS -->
    <link rel="stylesheet" href="assets/css/style.css">

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
</head>
<body>
    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Yükleniyor...</p>
    </div>

    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Header -->
    <header class="header">
        <div class="header-left">
            <div class="logo">
                <i class="fas fa-shield-alt"></i>
                <span><?php echo APP_NAME; ?></span>
            </div>
        </div>

        <div class="header-center">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="globalSearch" placeholder="IP, saldırı tipi veya port ara... (Ctrl+K)">
            </div>
        </div>

        <div class="header-right">
            <!-- Tarih-Saat -->
            <div class="datetime" id="currentDateTime">
                <?php echo formatTurkishDate(date('Y-m-d H:i:s')); ?>
            </div>

            <!-- Bildirimler -->
            <button class="header-btn notification-btn" id="notificationBtn" title="Bildirimler">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notificationCount">0</span>
            </button>

            <!-- Dark/Light Mode Toggle -->
            <button class="header-btn theme-toggle" id="themeToggle" title="Tema Değiştir">
                <i class="fas fa-moon"></i>
            </button>

            <!-- Ayarlar -->
            <button class="header-btn" id="settingsBtn" title="Ayarlar">
                <i class="fas fa-cog"></i>
            </button>

            <!-- Kullanıcı -->
            <div class="user-menu">
                <button class="user-btn">
                    <i class="fas fa-user-circle"></i>
                    <span>Yönetici</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Notification Panel -->
    <div id="notificationPanel" class="notification-panel">
        <div class="notification-header">
            <h3>Bildirimler</h3>
            <button class="close-btn" onclick="closeNotificationPanel()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notification-body" id="notificationList">
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>Yeni bildirim yok</p>
            </div>
        </div>
    </div>

    <div class="app-container">
