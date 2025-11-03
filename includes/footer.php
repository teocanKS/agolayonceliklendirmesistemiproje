    </div> <!-- .app-container -->

    <!-- Event Detail Modal -->
    <div id="eventDetailModal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Olay Detayları</h2>
                <button class="close-btn" onclick="closeModal('eventDetailModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="eventDetailContent">
                <div class="loading-spinner"></div>
            </div>
        </div>
    </div>

    <!-- Settings Modal -->
    <div id="settingsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Ayarlar</h2>
                <button class="close-btn" onclick="closeModal('settingsModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h3><i class="fas fa-paint-brush"></i> Görünüm</h3>
                    <div class="setting-item">
                        <label>
                            <span>Tema</span>
                            <select id="themeSetting">
                                <option value="light">Açık Tema</option>
                                <option value="dark">Koyu Tema</option>
                                <option value="auto">Otomatik</option>
                            </select>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-sliders-h"></i> Öncelik Eşikleri</h3>
                    <div class="setting-item">
                        <label>
                            <span>Kritik Eşik (80-100)</span>
                            <input type="range" id="criticalThreshold" min="70" max="90" value="80" step="1">
                            <span class="setting-value" id="criticalValue">80</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <span>Orta Eşik (40-70)</span>
                            <input type="range" id="mediumThreshold" min="30" max="60" value="50" step="1">
                            <span class="setting-value" id="mediumValue">50</span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-sync"></i> Yenileme</h3>
                    <div class="setting-item">
                        <label>
                            <span>Otomatik Yenileme (saniye)</span>
                            <input type="number" id="refreshInterval" min="10" max="300" value="30">
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-bell"></i> Bildirimler</h3>
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="notificationsEnabled" checked>
                            <span>Kritik olaylar için bildirim göster</span>
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('settingsModal')">İptal</button>
                    <button class="btn btn-primary" onclick="saveSettings()">Kaydet</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <p>&copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?> v<?php echo APP_VERSION; ?> | Canadian Institute for Cybersecurity (CIC)</p>
        <p>CICIDS2017 Network Intrusion Dataset</p>
    </footer>

    <!-- CSRF Token -->
    <input type="hidden" id="csrfToken" value="<?php echo getCSRFToken(); ?>">

    <!-- JavaScript -->
    <script src="assets/js/priority-algorithm.js"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/charts.js"></script>

    <script>
        // Tarih-saat güncelleme
        function updateDateTime() {
            const now = new Date();
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            document.getElementById('currentDateTime').textContent =
                now.toLocaleDateString('tr-TR', options);
        }
        setInterval(updateDateTime, 1000);

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+K: Arama
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearch').focus();
            }
        });

        // Global arama
        document.getElementById('globalSearch').addEventListener('input', function(e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2) {
                // Debounce ile arama yap
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(() => {
                    filterEvents({ search: searchTerm });
                }, 500);
            } else if (searchTerm.length === 0) {
                loadEvents();
            }
        });

        // Bildirim paneli toggle
        document.getElementById('notificationBtn').addEventListener('click', function() {
            document.getElementById('notificationPanel').classList.toggle('active');
        });

        function closeNotificationPanel() {
            document.getElementById('notificationPanel').classList.remove('active');
        }

        // Sayfa dışına tıklandığında paneli kapat
        document.addEventListener('click', function(e) {
            const panel = document.getElementById('notificationPanel');
            const btn = document.getElementById('notificationBtn');
            if (!panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('active');
            }
        });

        // Ayarlar butonu
        document.getElementById('settingsBtn').addEventListener('click', function() {
            openModal('settingsModal');
        });
    </script>
</body>
</html>
