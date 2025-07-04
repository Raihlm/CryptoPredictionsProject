 // ============================================
        // 🎨 SLIDESHOW FUNCTIONALITY
        // ============================================
        
        let currentSlideIndex = 0;
        const slides = document.querySelectorAll('.slide');
        const navDots = document.querySelectorAll('.nav-dot');
        
        function showSlide(index) {
            // Hide all slides
            slides.forEach(slide => slide.classList.remove('active'));
            navDots.forEach(dot => dot.classList.remove('active'));
            
            // Show current slide
            slides[index].classList.add('active');
            navDots[index].classList.add('active');
        }
        
        function nextSlide() {
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            showSlide(currentSlideIndex);
        }
        
        function currentSlide(index) {
            currentSlideIndex = index - 1;
            showSlide(currentSlideIndex);
        }
        
        // Auto-advance slides every 5 seconds
        setInterval(nextSlide, 5000);

        // ============================================
        // 📊 CHART FUNCTIONALITY
        // ============================================
        
        // Draw Pie Chart for Sentiment Distribution
        function drawPieChart() {
            const canvas = document.getElementById('sentiment-pie-chart');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 20;
            
            // Data
            const data = [
                { label: 'Positive', value: 65, color: '#10b981' },
                { label: 'Neutral', value: 25, color: '#f59e0b' },
                { label: 'Negative', value: 10, color: '#ef4444' }
            ];
            
            let currentAngle = -Math.PI / 2; // Start from top
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw pie slices
            data.forEach((segment, index) => {
                const sliceAngle = (segment.value / 100) * 2 * Math.PI;
                
                // Draw slice
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = segment.color;
                ctx.fill();
                
                // Draw label
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                ctx.textAlign = 'center';
                ctx.fillText(`${segment.value}%`, labelX, labelY);
                
                currentAngle += sliceAngle;
            });
        }
        
        // Draw Bar Chart for Platform Comparison
        function drawBarChart() {
            const canvas = document.getElementById('sentiment-bar-chart');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            const padding = 40;
            const chartWidth = canvas.width - padding * 2;
            const chartHeight = canvas.height - padding * 2;
            
            // Data
            const platforms = [
                { name: 'Twitter', positive: 82, color: '#1da1f2' },
                { name: 'Instagram', positive: 74, color: '#e1306c' },
                { name: 'TikTok', positive: 68, color: '#ff0050' },
                { name: 'Reddit', positive: 76, color: '#ff4500' },
                { name: 'LinkedIn', positive: 85, color: '#0077b5' },
                { name: 'YouTube', positive: 71, color: '#ff0000' }
            ];
            
            const barWidth = chartWidth / platforms.length - 10;
            const maxValue = 100;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw bars
            platforms.forEach((platform, index) => {
                const barHeight = (platform.positive / maxValue) * chartHeight;
                const x = padding + index * (barWidth + 10);
                const y = padding + chartHeight - barHeight;
                
                // Draw bar
                ctx.fillStyle = platform.color;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Draw value on top of bar
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                ctx.textAlign = 'center';
                ctx.fillText(`${platform.positive}%`, x + barWidth / 2, y - 5);
                
                // Draw platform name
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                ctx.fillText(platform.name, x + barWidth / 2, padding + chartHeight + 20);
            });
        }

        // ============================================
        // 🔄 REFRESH FUNCTIONS
        // ============================================
        
        // Refresh sentiment data
        function refreshSentiment() {
            const refreshBtn = document.querySelector('.sentiment-analysis .refresh-btn');
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<div class="loading"></div><span>Refreshing...</span>';
            
            setTimeout(() => {
                // Simulate new sentiment data
                const sentimentBar = document.querySelector('.sentiment-bar-fill');
                const positive = 60 + Math.random() * 20; // 60-80%
                const negative = 5 + Math.random() * 10;  // 5-15%
                const neutral = 100 - positive - negative;
                
                sentimentBar.innerHTML = `
                    <div class="sentiment-positive" style="width: ${positive}%;"></div>
                    <div class="sentiment-neutral" style="width: ${neutral}%;"></div>
                    <div class="sentiment-negative" style="width: ${negative}%;"></div>
                `;
                
                // Update legend
                const legendItems = document.querySelectorAll('.sentiment-legend .legend-item span');
                legendItems[0].textContent = `Positive (${positive.toFixed(0)}%)`;
                legendItems[1].textContent = `Neutral (${neutral.toFixed(0)}%)`;
                legendItems[2].textContent = `Negative (${negative.toFixed(0)}%)`;
                
                // Redraw charts
                drawPieChart();
                drawBarChart();
                
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<span>Refresh</span>';
            }, 1500);
        }
        
        // Refresh data (no API calls)
        function refreshData() {
            const refreshBtn = document.getElementById('refresh-btn');
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<div class="loading"></div><span>Loading...</span>';
            
            // Simulate loading
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<span>Refresh</span>';
                
                // Simulate price updates
                const prices = document.querySelectorAll('.coins-table tbody tr');
                prices.forEach(row => {
                    const priceCell = row.cells[2];
                    const changeCell = row.cells[3];
                    
                    // Random price change
                    const change = (Math.random() - 0.5) * 10; // -5% to +5%
                    const currentPrice = parseFloat(priceCell.textContent.replace('$', '').replace(',', ''));
                    const newPrice = currentPrice * (1 + change / 100);
                    
                    priceCell.textContent = '$' + newPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    const changeSpan = changeCell.querySelector('.price-change');
                    changeSpan.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
                    changeSpan.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative');
                });
            }, 1500);
        }
        
        // Refresh feed
        function refreshFeed() {
            const refreshBtn = document.querySelector('.sentiment-feed .refresh-btn');
            refreshBtn.style.transform = 'rotate(360deg)';
            
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
                
                // Simulate new data
                const stats = document.querySelectorAll('.feed-stat-number');
                stats.forEach(stat => {
                    if (stat.classList.contains('primary') && stat.textContent.includes('%')) return;
                    if (stat.textContent.includes('M')) return;
                    
                    const currentValue = parseInt(stat.textContent.replace(',', ''));
                    const newValue = currentValue + Math.floor(Math.random() * 50);
                    stat.textContent = newValue.toLocaleString();
                });
            }, 500);
        }

        // ============================================
        // 🎨 EXISTING FEATURES (PRESERVED)
        // ============================================
        
        // Filter functionality
        function filterPosts(sentiment, button) {
            const posts = document.querySelectorAll('.post-item');
            const filterBtns = document.querySelectorAll('.filter-btn');
            
            // Update active filter button
            filterBtns.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter posts
            posts.forEach(post => {
                if (sentiment === 'all' || post.dataset.sentiment === sentiment) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        }
        
        // Word cloud hover effects
        document.querySelectorAll('.word-item').forEach(word => {
            word.addEventListener('mouseenter', function() {
                this.style.textShadow = '0 0 20px currentColor';
            });
            
            word.addEventListener('mouseleave', function() {
                this.style.textShadow = 'none';
            });
        });
        
        // Smooth animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.feed-stat, .post-item, .word-item, .metric-card, .insight-card, .platform-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
        
        // Initialize animations after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.querySelectorAll('.feed-stat, .post-item, .word-item, .metric-card, .insight-card, .platform-card').forEach((el, index) => {
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, index * 50);
                });
            }, 300);
        });

        // ============================================
        // 🚀 INITIALIZATION
        // ============================================
        
        // Initialize dashboard
        function initDashboard() {
            console.log('🚀 Initializing Enhanced CryptoVision Dashboard...');
            
            // Draw initial charts
            setTimeout(() => {
                drawPieChart();
                drawBarChart();
            }, 500);
            
            // Handle window resize for charts
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    drawPieChart();
                    drawBarChart();
                }, 100);
            });
            
            console.log('✅ Enhanced Dashboard initialized successfully!');
        }
        
        // Start the dashboard when page loads
        document.addEventListener('DOMContentLoaded', initDashboard);