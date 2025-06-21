// Inisasi Global variables
let historicalData = [];
let currentChart = null;
let currentTimeframe = '1d';
let currentChartType = 'candlestick';
let realtimeUpdateInterval = null;
let lastUpdateTime = null;
let lineChartData = {
  daily: { labels: [], data: [] },
  monthly: { labels: [], data: [] },
  yearly: { labels: [], data: [] }
};
let activeModel = 'linear';

// API Configuration - Use consistent endpoint
const API_BASE_URL = window.location.origin; // Use same origin as the webpage

// DOM Elements
const currentPriceEl = document.getElementById('current-price');
const priceChangeEl = document.getElementById('price-change');
const volumeEl = document.getElementById('volume');
const chartTypeBtns = document.querySelectorAll('[data-charttype]');
const candlestickTimeframeBtns = document.querySelectorAll('#candlestick-timeframe [data-timeframe]');
const lineTimeframeBtns = document.querySelectorAll('#line-timeframe [data-timeframe]');
const candlestickContainer = document.getElementById('candlestick-container');
const lineContainer = document.getElementById('line-container');
const candlestickTimeframeSelector = document.getElementById('candlestick-timeframe');
const lineTimeframeSelector = document.getElementById('line-timeframe');
const marketCapEl = document.getElementById("market-cap");
const marketCapRankEl = document.getElementById("market-cap-rank")?.querySelector("span");
const highLowEl = document.getElementById("high-low");

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  try {

    // Setup popup event listeners PERTAMA
    setupPopupEventListeners();
    
    // Pastikan popup ready
    setTimeout(() => {
      ensurePopupReady();
    }, 100);

    await loadHistoricalData();
    await loadLineChartData();
    setupControlButtons();
    
    await fetchRealTimeData();
    
    // Initial prediction and model performance update
    setTimeout(async () => {
      await updatePredictions();
      await updateModelPerformance();
    }, 2000);
    
    // Start real-time updates
    realtimeUpdateInterval = setInterval(fetchRealTimeData, 60000);
    
    // Check API status
    updateAPIStatus();
    setInterval(updateAPIStatus, 30000);
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});


function setupPopupEventListeners() {
  console.log('Setting up popup event listeners'); // Debug log
  
  // Gunakan event delegation untuk memastikan event listener terpasang
  document.addEventListener('click', function(e) {
    // Cek apakah yang diklik adalah tombol view history
    if (e.target.matches('.view-history-btn') || e.target.closest('.view-history-btn')) {
      e.preventDefault();
      console.log('View history button clicked');
      showHistoricalPredictions();
    }
    
    // Cek apakah yang diklik adalah tombol close
    if (e.target.matches('#close-history-btn') || e.target.closest('#close-history-btn')) {
      e.preventDefault();
      console.log('Close button clicked');
      closeHistoricalPredictions();
    }
  });

  // Event listener untuk close popup ketika klik di luar popup content
  document.addEventListener('click', function(e) {
    const popup = document.getElementById('historical-popup');
    if (popup && e.target === popup) {
      closeHistoricalPredictions();
    }
  });

  // Event listener untuk ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const popup = document.getElementById('historical-popup');
      if (popup && popup.style.display !== 'none') {
        closeHistoricalPredictions();
      }
    }
  });

  // Event listener untuk model filter - gunakan event delegation
  document.addEventListener('change', function(e) {
    if (e.target.matches('#model-filter')) {
      console.log('Model filter changed to:', e.target.value);
      loadHistoricalPredictions();
    }
  });
}

// Load historical data for candlestick chart
// Perbaikan untuk loadHistoricalData agar format data konsisten
async function loadHistoricalData() {
  try {
    const response = await fetch('/web/static/historical_data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Convert data to consistent format
    historicalData = data.map(item => {
      // Handle timestamp conversion
      const timestamp = item.timestamp;
      const date = new Date(timestamp);
      
      return {
        x: date,
        timestamp: timestamp,
        o: item.open,
        h: item.high,
        l: item.low,
        c: item.close,
        v: item.volume,
        rsi: item.rsi,
        ma7: item.ma7,
        ma30: item.ma30,
        // Also keep original property names for compatibility
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      };
    });
    
    // Sort by timestamp to ensure chronological order
    historicalData.sort((a, b) => a.timestamp - b.timestamp);
    
    renderChart();
    console.log('Historical data loaded successfully:', historicalData.length, 'entries');
  } catch (error) {
    console.error('Error loading historical data:', error);
    // Fallback: try to load from daily_price.json and convert
    try {
      const fallbackResponse = await fetch('/web/static/daily_price.json');
      if (fallbackResponse.ok) {
        const lineData = await fallbackResponse.json();
        historicalData = lineData.labels.map((label, index) => {
          const price = lineData.data[index];
          const date = new Date(label);
          const variation = price * 0.02;
          
          const open = price + (Math.random() - 0.5) * variation;
          const close = price + (Math.random() - 0.5) * variation;
          const high = Math.max(open, close) + Math.random() * variation;
          const low = Math.min(open, close) - Math.random() * variation;
          
          return {
            x: date,
            timestamp: date.getTime(),
            o: open,
            h: high,
            l: low,
            c: close,
            v: 1000000 + Math.random() * 5000000,
            rsi: 50 + (Math.random() - 0.5) * 30,
            ma7: price * 0.98,
            ma30: price * 0.95,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: 1000000 + Math.random() * 5000000
          };
        });
        renderChart();
        console.log('Fallback historical data generated');
      }
    } catch (fallbackError) {
      console.error('Fallback data loading failed:', fallbackError);
    }
  }
}

// Load data for line charts
async function loadLineChartData() {
  try {
    // Load daily data
    const dailyResponse = await fetch('/web/static/daily_price.json');
    if (dailyResponse.ok) {
      lineChartData.daily = await dailyResponse.json();
      console.log('Daily data loaded:', lineChartData.daily.labels?.length, 'entries');
    } else {
      console.warn('Daily data not found, using fallback');
      // Fallback data untuk daily
      lineChartData.daily = generateFallbackData('daily');
    }
    
    // Load monthly data dengan fallback
    try {
      const monthlyResponse = await fetch('/web/static/monthly_price.json');
      if (monthlyResponse.ok) {
        lineChartData.monthly = await monthlyResponse.json();
        console.log('Monthly data loaded:', lineChartData.monthly.labels?.length, 'entries');
      } else {
        throw new Error('Monthly data not available');
      }
    } catch (error) {
      console.warn('Monthly data not found, generating from daily data');
      lineChartData.monthly = generateMonthlyFromDaily();
    }
    
    // Load yearly data dengan fallback
    try {
      const yearlyResponse = await fetch('/web/static/yearly_price.json');
      if (yearlyResponse.ok) {
        lineChartData.yearly = await yearlyResponse.json();
        console.log('Yearly data loaded:', lineChartData.yearly.labels?.length, 'entries');
      } else {
        throw new Error('Yearly data not available');
      }
    } catch (error) {
      console.warn('Yearly data not found, generating from daily data');
      lineChartData.yearly = generateYearlyFromDaily();
    }
    
    console.log('Line chart data loading completed');
  } catch (error) {
    console.error('Error loading line chart data:', error);
    // Generate semua fallback data jika gagal total
    lineChartData.daily = generateFallbackData('daily');
    lineChartData.monthly = generateFallbackData('monthly');
    lineChartData.yearly = generateFallbackData('yearly');
  }
}

function generateFallbackData(type) {
  const now = new Date();
  const labels = [];
  const data = [];
  let basePrice = 45000;
  
  let periods, dateIncrement;
  
  switch(type) {
    case 'daily':
      periods = 365;
      dateIncrement = 24 * 60 * 60 * 1000; // 1 day
      break;
    case 'monthly':
      periods = 24;
      dateIncrement = 30 * 24 * 60 * 60 * 1000; // 30 days
      break;
    case 'yearly':
      periods = 5;
      dateIncrement = 365 * 24 * 60 * 60 * 1000; // 1 year
      break;
    default:
      periods = 100;
      dateIncrement = 24 * 60 * 60 * 1000;
  }
  
  for (let i = periods; i >= 0; i--) {
    const date = new Date(now - (i * dateIncrement));
    labels.push(date.toISOString().split('T')[0]);
    
    // Simulate price movement
    const randomChange = (Math.random() - 0.5) * 0.1;
    basePrice *= (1 + randomChange);
    data.push(Math.round(basePrice));
  }
  
  return { labels, data };
}

// PERBAIKAN 1: Generate monthly data dari daily data
function generateMonthlyFromDaily() {
  if (!lineChartData.daily || !lineChartData.daily.labels) {
    return generateFallbackData('monthly');
  }
  
  const dailyLabels = lineChartData.daily.labels;
  const dailyData = lineChartData.daily.data;
  
  const monthlyLabels = [];
  const monthlyData = [];
  
  // Group by month
  const monthlyGroups = {};
  
  dailyLabels.forEach((label, index) => {
    const date = new Date(label);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = [];
    }
    monthlyGroups[monthKey].push(dailyData[index]);
  });
  
  // Calculate monthly averages
  Object.keys(monthlyGroups).sort().forEach(monthKey => {
    const values = monthlyGroups[monthKey];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    monthlyLabels.push(monthKey + '-01');
    monthlyData.push(Math.round(average));
  });
  
  return { labels: monthlyLabels, data: monthlyData };
}

// PERBAIKAN 1: Generate yearly data dari daily data
function generateYearlyFromDaily() {
  if (!lineChartData.daily || !lineChartData.daily.labels) {
    return generateFallbackData('yearly');
  }
  
  const dailyLabels = lineChartData.daily.labels;
  const dailyData = lineChartData.daily.data;
  
  const yearlyLabels = [];
  const yearlyData = [];
  
  // Group by year
  const yearlyGroups = {};
  
  dailyLabels.forEach((label, index) => {
    const date = new Date(label);
    const year = date.getFullYear();
    
    if (!yearlyGroups[year]) {
      yearlyGroups[year] = [];
    }
    yearlyGroups[year].push(dailyData[index]);
  });
  
  // Calculate yearly averages
  Object.keys(yearlyGroups).sort().forEach(year => {
    const values = yearlyGroups[year];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    yearlyLabels.push(year + '-01-01');
    yearlyData.push(Math.round(average));
  });
  
  return { labels: yearlyLabels, data: yearlyData };
}

// Fetch real-time data from API
async function fetchRealTimeData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Safely extract values with optional chaining and fallbacks
    const marketData = data.market_data || {};
    const currentPrice = marketData.current_price?.usd || 0;
    const priceChange24h = marketData.price_change_percentage_24h || 0;
    const volume24h = marketData.total_volume?.usd || 0;
    const marketCap = marketData.market_cap?.usd || 0;
    const marketCapRank = data.market_cap_rank || null;
    const high24h = marketData.high_24h?.usd || currentPrice;
    const low24h = marketData.low_24h?.usd || currentPrice;

    // Update DOM elements safely
    if (currentPriceEl) {
      currentPriceEl.textContent = `$${currentPrice.toLocaleString()}`;
    }
    
    if (priceChangeEl) {
      priceChangeEl.textContent = `${priceChange24h.toFixed(2)}%`;
      priceChangeEl.style.color = priceChange24h >= 0 ? '#00ff99' : '#ff3e3e';
    }
    
    if (volumeEl) {
      volumeEl.textContent = `$${(volume24h / 1000000).toFixed(1)}M`;
    }
    
    // Update market cap display
    if (marketCapEl) {
      if (marketCap >= 1e12) {
        marketCapEl.textContent = `$${(marketCap / 1e12).toFixed(2)}T`;
      } else if (marketCap >= 1e9) {
        marketCapEl.textContent = `$${(marketCap / 1e9).toFixed(2)}B`;
      } else if (marketCap >= 1e6) {
        marketCapEl.textContent = `$${(marketCap / 1e6).toFixed(2)}M`;
      } else {
        marketCapEl.textContent = `$${marketCap.toLocaleString()}`;
      }
    }

    if (marketCapRankEl) {
      marketCapRankEl.textContent = `Global Rank: ${marketCapRank ?? 'N/A'}`;
    }

    // Update high/low prices
    if (highLowEl) {
      highLowEl.textContent = `$${low24h.toLocaleString()} - $${high24h.toLocaleString()}`;
    }
    
    lastUpdateTime = new Date();
    console.log('Real-time data updated successfully');
  } catch (error) {
    console.error('Error fetching real-time data:', error);
  }
}

// Render appropriate chart based on current selection
function renderChart() {
  console.log('Rendering chart, type:', currentChartType, 'timeframe:', currentTimeframe);
  
  // PERBAIKAN: Pastikan cleanup yang proper sebelum render
  if (currentChart) {
    try {
      currentChart.destroy();
      currentChart = null;
    } catch (error) {
      console.warn('Error destroying chart:', error);
      currentChart = null;
    }
  }
  
  // Delay rendering untuk memastikan cleanup selesai
  setTimeout(() => {
    if (currentChartType === 'candlestick') {
      renderCandlestickChart();
    } else {
      const activeBtn = document.querySelector('#line-timeframe .active') || 
                       document.querySelector('[data-timeframe].active');
      const timeframe = activeBtn ? activeBtn.dataset.timeframe : 'daily';
      renderLineChart(timeframe);
    }
  }, 100);
}

// Render candlestick chart
// Updated renderCandlestickChart function
// PERBAIKAN 3: Perbaiki renderCandlestickChart dengan implementasi yang lebih sederhana
// PERBAIKAN 2: Render candlestick chart dengan Chart.js Financial
function renderCandlestickChart() {
  console.log('Rendering candlestick chart...');
  const canvas = document.getElementById('candlestickChart');
  if (!canvas) {
    console.error('Candlestick canvas not found');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  // Destroy previous chart
  if (currentChart && typeof currentChart.destroy === 'function') {
    try {
      currentChart.destroy();
      currentChart = null;
    } catch (error) {
      console.warn('Error destroying previous chart:', error);
      currentChart = null;
    }
  }
  
  // Prepare data dengan format yang benar untuk Chart.js Financial
  let filteredData = [];
  
  if (historicalData && historicalData.length > 0) {
    // Filter data berdasarkan timeframe
    const now = new Date();
    let filterDate;
    
    switch(currentTimeframe) {
      case '1d':
        filterDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        filterDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        filterDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        filterDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        filterDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        filterDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Filter dan format data sesuai dengan struktur historicalData
    filteredData = historicalData
      .filter(item => {
        const itemDate = item.x instanceof Date ? item.x : new Date(item.timestamp || item.x);
        return itemDate >= filterDate;
      })
      .map(item => {
        const date = item.x instanceof Date ? item.x : new Date(item.timestamp || item.x);
        return {
          x: date.getTime(),
          o: item.o || item.open,
          h: item.h || item.high,
          l: item.l || item.low,
          c: item.c || item.close
        };
      });
  }
  
  // Jika tidak ada data historicalData, convert dari lineChartData
  if (filteredData.length === 0 && lineChartData.daily && lineChartData.daily.labels) {
    const lineData = lineChartData.daily;
    filteredData = lineData.labels.slice(-100).map((label, index) => {
      const price = lineData.data[lineData.data.length - 100 + index] || lineData.data[index];
      const date = new Date(label);
      const variation = price * 0.015; // 1.5% variation untuk simulasi yang realistis
      
      const open = price + (Math.random() - 0.5) * variation;
      const close = price + (Math.random() - 0.5) * variation;
      const high = Math.max(open, close) + Math.random() * variation;
      const low = Math.min(open, close) - Math.random() * variation;
      
      return {
        x: date.getTime(),
        o: Math.round(open * 100) / 100,
        h: Math.round(high * 100) / 100,
        l: Math.round(low * 100) / 100,
        c: Math.round(close * 100) / 100
      };
    });
  }
  
  if (filteredData.length === 0) {
    console.warn('No data available for candlestick chart');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Limit data points for performance
  const maxDataPoints = 200;
  if (filteredData.length > maxDataPoints) {
    const step = Math.ceil(filteredData.length / maxDataPoints);
    filteredData = filteredData.filter((_, index) => index % step === 0);
  }
  
  console.log('Filtered data length:', filteredData.length);
  console.log('Sample data:', filteredData.slice(0, 3));
  
  // Check if Chart.js and financial plugin are available
  if (typeof Chart !== 'undefined') {
    try {
      // Register the financial plugin if not already registered
      if (typeof Chart.registry !== 'undefined' && typeof chartjsFinancial !== 'undefined') {
        Chart.register(chartjsFinancial);
      }
      
      const chartData = {
        datasets: [{
          label: 'BTC/USD',
          data: filteredData,
          borderColor: '#00ff99',
          backgroundColor: 'rgba(0, 255, 153, 0.1)',
          // Candlestick specific options
          borderWidth: 1,
          upColor: '#00ff99',
          downColor: '#ff3e3e',
          upBorderColor: '#00ff99',
          downBorderColor: '#ff3e3e'
        }]
      };
      
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#00ff99',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const dataPoint = context.raw;
                if (dataPoint && typeof dataPoint === 'object') {
                  return [
                    `Open: $${Number(dataPoint.o).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    `High: $${Number(dataPoint.h).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    `Low: $${Number(dataPoint.l).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    `Close: $${Number(dataPoint.c).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                  ];
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: getTimeUnit(),
              tooltipFormat: 'MMM d, yyyy HH:mm',
              displayFormats: {
                hour: 'HH:mm',
                day: 'MMM d',
                week: 'MMM d',
                month: 'MMM yyyy',
                year: 'yyyy'
              }
            },
            ticks: {
              color: '#aaa',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: {
              color: '#333'
            }
          },
          y: {
            ticks: {
              color: '#aaa',
              callback: function(value) {
                return '$' + Number(value).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
              }
            },
            grid: {
              color: '#333'
            }
          }
        }
      };
      
      // Try to create candlestick chart, fallback to line chart
      try {
        currentChart = new Chart(ctx, {
          type: 'candlestick',
          data: chartData,
          options: chartOptions
        });
        console.log('Candlestick chart created successfully');
      } catch (candlestickError) {
        console.warn('Candlestick chart type not available, using OHLC chart');
        try {
          currentChart = new Chart(ctx, {
            type: 'ohlc',
            data: chartData,
            options: chartOptions
          });
          console.log('OHLC chart created successfully');
        } catch (ohlcError) {
          console.warn('OHLC chart not available, falling back to line chart');
          // Fallback to line chart with close prices
          currentChart = new Chart(ctx, {
            type: 'line',
            data: {
              datasets: [{
                label: 'BTC/USD (Close Price)',
                data: filteredData.map(d => ({x: d.x, y: d.c})),
                borderColor: '#00ff99',
                backgroundColor: 'rgba(0, 255, 153, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
              }]
            },
            options: chartOptions
          });
          console.log('Line chart fallback created');
        }
      }
      
    } catch (error) {
      console.error('Error creating chart:', error);
      renderFallbackCandlestickChart(ctx, filteredData);
    }
  } else {
    console.warn('Chart.js not available, using fallback canvas drawing');
    renderFallbackCandlestickChart(ctx, filteredData);
  }
}

function renderFallbackCandlestickChart(ctx, data) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (data.length === 0) return;
  
  // Calculate dimensions
  const padding = 50;
  const chartWidth = canvas.width - (padding * 2);
  const chartHeight = canvas.height - (padding * 2);
  
  // Find min/max values
  const prices = data.flatMap(d => [d.o, d.h, d.l, d.c]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  if (priceRange === 0) return;
  
  // Calculate candle width
  const candleWidth = Math.max(2, (chartWidth / data.length) - 2);
  
  // Draw grid
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  
  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight * i / 5);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
    
    // Price labels
    const price = maxPrice - (priceRange * i / 5);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('$' + price.toFixed(0), padding - 10, y + 4);
  }
  
  // Draw candlesticks
  data.forEach((candle, index) => {
    const x = padding + (index * (chartWidth / data.length)) + (chartWidth / data.length / 2);
    
    // Calculate y positions
    const openY = padding + chartHeight - ((candle.o - minPrice) / priceRange * chartHeight);
    const closeY = padding + chartHeight - ((candle.c - minPrice) / priceRange * chartHeight);
    const highY = padding + chartHeight - ((candle.h - minPrice) / priceRange * chartHeight);
    const lowY = padding + chartHeight - ((candle.l - minPrice) / priceRange * chartHeight);
    
    // Determine color
    const isGreen = candle.c >= candle.o;
    const color = isGreen ? '#00ff99' : '#ff3e3e';
    
    // Draw high-low line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();
    
    // Draw open-close body
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    
    if (bodyHeight < 1) {
      // Doji - draw a line
      ctx.beginPath();
      ctx.moveTo(x - candleWidth/2, openY);
      ctx.lineTo(x + candleWidth/2, openY);
      ctx.stroke();
    } else {
      // Regular candle body
      if (isGreen) {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      } else {
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      }
    }
  });
  
  // Add title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BTC/USD Candlestick Chart', canvas.width / 2, 30);
}



// Alternative: True Candlestick Chart using Canvas Drawing
function renderTrueCandlestickChart() {
  const canvas = document.getElementById('candlestickChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Filter data based on current timeframe
  let filteredData = [...historicalData];
  const now = new Date();
  
  switch(currentTimeframe) {
    case '1d':
      filteredData = historicalData.filter(d => d.x > new Date(now - 24 * 60 * 60 * 1000));
      break;
    case '1w':
      filteredData = historicalData.filter(d => d.x > new Date(now - 7 * 24 * 60 * 60 * 1000));
      break;
    case '1m':
      filteredData = historicalData.filter(d => d.x > new Date(now - 30 * 24 * 60 * 60 * 1000));
      break;
    case '3m':
      filteredData = historicalData.filter(d => d.x > new Date(now - 90 * 24 * 60 * 60 * 1000));
      break;
    case '1y':
      filteredData = historicalData.filter(d => d.x > new Date(now - 365 * 24 * 60 * 60 * 1000));
      break;
  }
  
  if (filteredData.length === 0) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Calculate dimensions
  const padding = 50;
  const chartWidth = canvas.width - (padding * 2);
  const chartHeight = canvas.height - (padding * 2);
  
  // Find min/max values
  const prices = filteredData.flatMap(d => [d.o, d.h, d.l, d.c]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  // Calculate candle width
  const candleWidth = Math.max(2, chartWidth / filteredData.length - 2);
  
  // Draw background grid
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  
  // Horizontal grid lines (price levels)
  for (let i = 0; i <= 10; i++) {
    const y = padding + (chartHeight * i / 10);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
    
    // Price labels
    const price = maxPrice - (priceRange * i / 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('$' + price.toFixed(0), padding - 10, y + 4);
  }
  
  // Draw candlesticks
  filteredData.forEach((data, index) => {
    const x = padding + (index * (chartWidth / filteredData.length)) + (chartWidth / filteredData.length / 2);
    
    // Calculate y positions
    const openY = padding + chartHeight - ((data.o - minPrice) / priceRange * chartHeight);
    const closeY = padding + chartHeight - ((data.c - minPrice) / priceRange * chartHeight);
    const highY = padding + chartHeight - ((data.h - minPrice) / priceRange * chartHeight);
    const lowY = padding + chartHeight - ((data.l - minPrice) / priceRange * chartHeight);
    
    // Determine color (green if close > open, red if close < open)
    const isGreen = data.c >= data.o;
    const color = isGreen ? '#00ff99' : '#ff3e3e';
    
    // Draw high-low line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();
    
    // Draw open-close body
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    
    if (bodyHeight < 1) {
      // Doji - draw a line
      ctx.beginPath();
      ctx.moveTo(x - candleWidth/2, openY);
      ctx.lineTo(x + candleWidth/2, openY);
      ctx.stroke();
    } else {
      // Regular candle body
      if (isGreen) {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      } else {
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      }
    }
  });
  
  // Add title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`BTC/USD Candlestick Chart (${currentTimeframe})`, canvas.width / 2, 30);
}

// Render line chart
function renderLineChart(timeframe) {
  const canvas = document.getElementById('lineChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const data = lineChartData[timeframe];
  
  if (!data || !data.labels || !data.data) return;
  
  let labels = data.labels;
  let values = data.data;
  
  // For daily, show only last 100 days
  if (timeframe === 'daily') {
    labels = labels.slice(-100);
    values = values.slice(-100);
  }
  
  // Destroy previous chart if exists
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
  
  // Create new chart
  if (typeof Chart !== 'undefined') {
    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `BTC Price (${timeframe})`,
          data: values,
          borderColor: '#00ff99',
          backgroundColor: 'rgba(0, 255, 153, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          }
        },
        scales: {
          x: {
            ticks: { 
              color: '#aaa',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12
            },
            grid: { color: '#333' }
          },
          y: {
            ticks: { 
              color: '#aaa',
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            },
            grid: { color: '#333' }
          }
        }
      }
    });
  }
}

// Helper function to determine time unit based on timeframe
function getTimeUnit() {
  switch(currentTimeframe) {
    case '1d': return 'hour';
    case '1w': return 'day';
    case '1m': 
    case 'daily': return 'day';
    case '3m':
    case 'monthly': return 'week';
    case '1y': return 'month';
    case 'yearly':
    case 'all': return 'year';
    default: return 'day';
  }
}


// Setup control buttons
// PERBAIKAN 2: Sederhanakan Setup Control Buttons
function setupControlButtons() {
  // Chart type buttons
  chartTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chartTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const newChartType = btn.dataset.charttype;
      
      if (currentChartType !== newChartType) {
        currentChartType = newChartType;
        
        // Show/hide appropriate containers
        if (currentChartType === 'candlestick') {
          candlestickContainer?.classList.remove('hidden');
          lineContainer?.classList.add('hidden');
        } else {
          candlestickContainer?.classList.add('hidden');
          lineContainer?.classList.remove('hidden');
        }
        
        setTimeout(renderChart, 50);
      }
    });
  });

  // Unified timeframe buttons - PERBAIKAN 5
  const unifiedTimeframeBtns = document.querySelectorAll('#unified-timeframe [data-timeframe]');
  unifiedTimeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active dari semua unified timeframe buttons
      unifiedTimeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const newTimeframe = btn.dataset.timeframe;
      
      if (currentTimeframe !== newTimeframe) {
        currentTimeframe = newTimeframe;
        setTimeout(renderChart, 50);
      }
    });
  });

  // Model buttons - PERBAIKAN 5
  const modelBtns = document.querySelectorAll('.model-btn');
  modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const model = btn.dataset.model;
      if (model) {
        setActiveModel(model);
      }
    });
  });
}


function setActiveModel(model) {
  activeModel = model;
  console.log('Setting active model to:', model);

  // Update UI to reflect active model
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Find the button with matching data-model attribute
  const activeBtn = document.querySelector(`[data-model="${model}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    console.log('Active button found and updated');
  } else {
    console.warn('Active button not found for model:', model);
  }

  // Update predictions based on selected model
  updatePredictions();
}

// Update prediction displays - SIMPLIFIED to use API endpoints
// Update prediction displays - FIXED VERSION
async function updatePredictions() {
  const predictionElements = ['next-day', 'next-week', 'next-month', 'next-year'];
  
  // Show loading state
  predictionElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Loading...';
  });
  
  try {
    // First get realtime data
    const realtimeResponse = await fetch(`${API_BASE_URL}/api/realtime-data`);
    if (!realtimeResponse.ok) throw new Error(`Realtime data fetch failed: ${realtimeResponse.status}`);
    const realtimeData = await realtimeResponse.json();
    
    // Validate realtime data
    if (!realtimeData.price) {
      throw new Error('Invalid realtime data: missing price');
    }
    
    // Extract current price and additional features
    const currentPrice = realtimeData.price;
    const additionalFeatures = [
      realtimeData.open || currentPrice,
      realtimeData.volume || 1000000,
      realtimeData.change || 0
    ];
    
    // Call the prediction endpoint
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: activeModel,
        current_price: currentPrice,
        features: additionalFeatures
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prediction API failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Raw API response:", result);
    
    // Validate response structure
    if (!result || !result.predictions) {
      throw new Error('Invalid prediction response structure');
    }
    
    const predictions = result.predictions;
    
    // Update prediction elements with proper error handling
    const updateElement = (elementId, value, isConfidence = false) => {
      const el = document.getElementById(elementId);
      if (el) {
        if (typeof value === 'number' && !isNaN(value)) {
          if (isConfidence) {
            el.textContent = `${Math.round(value)}%`;
          } else {
            el.textContent = `$${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
          }
        } else {
          el.textContent = isConfidence ? '0%' : '--';
        }
      }
    };
    
    // Update prediction values
    updateElement('next-day', predictions.next_day);
    updateElement('next-week', predictions.next_week);
    updateElement('next-month', predictions.next_month);
    updateElement('next-year', predictions.next_year);
    
    // Update confidence scores if available
    if (predictions.confidence) {
      updateElement('next-day-conf', predictions.confidence.next_day, true);
      updateElement('next-week-conf', predictions.confidence.next_week, true);
      updateElement('next-month-conf', predictions.confidence.next_month, true);
      updateElement('next-year-conf', predictions.confidence.next_year, true);
      
      // Update confidence bars
      const updateBar = (barId, value) => {
        const barEl = document.getElementById(barId);
        if (barEl && typeof value === 'number' && !isNaN(value)) {
          barEl.style.width = `${Math.max(0, Math.min(100, value))}%`;
        }
      };
      
      updateBar('next-day-bar', predictions.confidence.next_day);
      updateBar('next-week-bar', predictions.confidence.next_week);
      updateBar('next-month-bar', predictions.confidence.next_month);
      updateBar('next-year-bar', predictions.confidence.next_year);
    }
    
    console.log('Predictions updated successfully');
    
  } catch (error) {
    console.error('Error updating predictions:', error);
    
    // Show error state with specific error message
    predictionElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = 'Error';
    });
    
    // Also update confidence displays
    ['next-day-conf', 'next-week-conf', 'next-month-conf', 'next-year-conf'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0%';
    });
    
    // Reset confidence bars
    ['next-day-bar', 'next-week-bar', 'next-month-bar', 'next-year-bar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.width = '0%';
    });
  }
}

// Update model performance - SIMPLIFIED to use API endpoint
async function updateModelPerformance() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/model-performance`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const performance = await response.json();
    
    // Update performance metrics
    if (performance) {
      const r2El = document.getElementById('r2-score');
      const maeEl = document.getElementById('mae');
      const rmseEl = document.getElementById('rmse');
      
      if (r2El) r2El.textContent = (performance.r2_score || 0).toFixed(4);
      if (maeEl) maeEl.textContent = (performance.mae || 0).toFixed(2);
      if (rmseEl) rmseEl.textContent = (performance.rmse || 0).toFixed(2);
    }
  } catch (error) {
    console.error('Error fetching model performance:', error);
    
    // Show default values on error
    const r2El = document.getElementById('r2-score');
    const maeEl = document.getElementById('mae');
    const rmseEl = document.getElementById('rmse');
    
    if (r2El) r2El.textContent = '--';
    if (maeEl) maeEl.textContent = '--';
    if (rmseEl) rmseEl.textContent = '--';
  }
}

// Update model training function - SIMPLIFIED
async function updateModel() {
  const updateBtn = document.querySelector('.update-btn');
  if (!updateBtn) return;
  
  const originalText = updateBtn.innerHTML;
  
  // Show loading state
  updateBtn.innerHTML = '<div class="loading"></div> Training Model...';
  updateBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/retrain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    if (result.success) {
      // Update predictions and performance after retraining
      await updatePredictions();
      await updateModelPerformance();
      
      updateBtn.innerHTML = '<i class="fas fa-check"></i> Model Updated';
      updateBtn.style.background = 'linear-gradient(45deg, #00ff88, #0099ff)';
      
      setTimeout(() => {
        updateBtn.innerHTML = originalText;
        updateBtn.style.background = '';
        updateBtn.disabled = false;
      }, 2000);
    } else {
      throw new Error(result.message || 'Training failed');
    }
    
  } catch (error) {
    console.error('Error updating model:', error);
    
    updateBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Update Failed';
    updateBtn.style.background = 'linear-gradient(45deg, #ff4757, #ff3742)';
    
    setTimeout(() => {
      updateBtn.innerHTML = originalText;
      updateBtn.style.background = '';
      updateBtn.disabled = false;
    }, 3000);
  }
}

// Update API status indicator - SIMPLIFIED
function updateAPIStatus() {
  fetch(`${API_BASE_URL}/api/health`)
    .then(response => response.json())
    .then(data => {
      const statusDot = document.querySelector('.status-dot');
      const statusText = document.querySelector('.status-indicator span');
      
      if (statusDot && statusText) {
        if (data.status === 'healthy' && data.models_loaded) {
          statusDot.style.background = '#00ff88';
          statusText.textContent = 'AI Models Ready';
        } else if (data.status === 'healthy') {
          statusDot.style.background = '#ffa726';
          statusText.textContent = 'Training Models';
        } else {
          statusDot.style.background = '#ff4757';
          statusText.textContent = 'System Error';
        }
      }
    })
    .catch(error => {
      console.error('API Status Error:', error);
      const statusDot = document.querySelector('.status-dot');
      const statusText = document.querySelector('.status-indicator span');
      
      if (statusDot && statusText) {
        statusDot.style.background = '#ff4757';
        statusText.textContent = 'API Offline';
      }
    });
}

// Show Historical Predictions Popup
// Show Historical Predictions Popup
function showHistoricalPredictions() {
  console.log('showHistoricalPredictions called'); // Debug log
  
  const popup = document.getElementById('historical-popup');
  if (popup) {
    // Reset semua style untuk memastikan popup tampil dengan benar
    popup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Animate fade in
    setTimeout(() => {
      popup.style.opacity = '1';
    }, 10);
    
    loadHistoricalPredictions();
    console.log('Historical predictions popup shown');
  } else {
    console.error('Historical popup element not found');
    // Debug: cek apakah element ada
    console.log('All elements with historical-popup:', document.querySelectorAll('[id*="historical"]'));
  }
}



// Close Historical Predictions Popup
function closeHistoricalPredictions() {
  console.log('closeHistoricalPredictions called'); // Debug log
  
  const popup = document.getElementById('historical-popup');
  if (popup) {
    // Animate fade out
    popup.style.opacity = '0';
    setTimeout(() => {
      popup.style.display = 'none';
    }, 300);
    
    console.log('Historical predictions popup closed');
  }
}

// Load Historical Predictions - SIMPLIFIED to use API endpoint
async function loadHistoricalPredictions() {
  console.log('loadHistoricalPredictions called'); // Debug log
  
  const list = document.getElementById('historical-predictions-list');
  if (!list) {
    console.error('Historical predictions list element not found');
    return;
  }
  
  // Show loading state
  list.innerHTML = '<div class="loading-spinner"><div class="loading"></div><p>Loading historical predictions...</p></div>';
  
  try {
    const modelFilter = document.getElementById('model-filter')?.value || 'all';
    console.log('Fetching predictions for model:', modelFilter);
    
    // Ganti dengan URL API Anda yang sebenarnya
    const response = await fetch(`${API_BASE_URL}/api/historical-predictions?model=${modelFilter}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const predictions = await response.json();
    console.log('Received predictions:', predictions);
    
    list.innerHTML = ''; // Clear loading state

    if (predictions && predictions.length > 0) {
      // Populate predictions list
      predictions.forEach(prediction => {
        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        predictionItem.innerHTML = `
          <p><strong>Date:</strong> ${prediction.date}</p>
          <p><strong>Model:</strong> ${prediction.model}</p>
          <p><strong>Predicted Price:</strong> $${prediction.predicted_price.toFixed(2)}</p>
          <p><strong>Actual Price:</strong> $${prediction.actual_price ? prediction.actual_price.toFixed(2) : 'N/A'}</p>
          <p><strong>Accuracy:</strong> ${prediction.accuracy ? prediction.accuracy.toFixed(2) + '%' : 'N/A'}</p>
        `;
        list.appendChild(predictionItem);
      });
    } else {
      list.innerHTML = '<div class="no-data"><p>No predictions found for the selected model.</p></div>';
    }
  } catch (error) {
    console.error('Error loading historical predictions:', error);
    list.innerHTML = `<div class="error-message"><p>Error loading historical predictions: ${error.message}</p></div>`;
  }
}

// TAMBAHAN: Fungsi untuk memastikan popup siap digunakan
function ensurePopupReady() {
  const popup = document.getElementById('historical-popup');
  if (!popup) {
    console.error('Popup element not found in DOM');
    return false;
  }
  
  const header = popup.querySelector('.popup-header');
  const body = popup.querySelector('.popup-body');
  const list = document.getElementById('historical-predictions-list');
  const filter = document.getElementById('model-filter');
  const closeBtn = document.getElementById('close-history-btn');
  
  if (!header || !body || !list || !filter || !closeBtn) {
    console.error('Some popup elements are missing:', {
      header: !!header,
      body: !!body,
      list: !!list,
      filter: !!filter,
      closeBtn: !!closeBtn
    });
    return false;
  }
  
  console.log('Popup is ready');
  return true;
}

function testPopup() {
  console.log('Testing popup functionality...');
  const popup = document.getElementById('historical-popup');
  console.log('Popup element:', popup);
  
  if (popup) {
    console.log('Popup computed styles:', window.getComputedStyle(popup));
    showHistoricalPredictions();
  } else {
    console.error('Popup element not found for testing');
  }
}

// Add Event Listener for Model Filter
document.getElementById('model-filter')?.addEventListener('change', loadHistoricalPredictions);

// Cleanup function
function cleanup() {
  if (realtimeUpdateInterval) {
    clearInterval(realtimeUpdateInterval);
  }
  if (currentChart) {
    currentChart.destroy();
  }
}


window.testPopup = testPopup;
// Handle page unload
window.addEventListener('beforeunload', cleanup);