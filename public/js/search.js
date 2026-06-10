/**
 * 列车搜索模块
 * 处理车站加载、搜索表单、结果展示
 */
const Search = {
  stations: [],
  lastSearch: null,

  /**
   * 初始化：加载车站列表，设置默认日期
   */
  async init() {
    try {
      this.stations = await API.trains.getStations();
      this.renderStationSelects();
      document.getElementById('search-date').value = '2026-06-10';
    } catch (e) {
      console.error('加载车站失败:', e);
    }
  },

  /**
   * 渲染车站下拉选项
   */
  renderStationSelects() {
    const fromSelect = document.getElementById('search-from');
    const toSelect = document.getElementById('search-to');

    this.stations.forEach(station => {
      fromSelect.innerHTML += `<option value="${station}">${station}</option>`;
      toSelect.innerHTML += `<option value="${station}">${station}</option>`;
    });
  },

  /**
   * 执行搜索
   */
  async search(from, to, date) {
    this.lastSearch = { from, to, date };
    try {
      App.showLoading('查询中...');
      const trains = await API.trains.search({ from, to, date });
      App.hideLoading();
      this.renderResults(trains, date);
    } catch (e) {
      App.hideLoading();
      App.showToast(e.message, 'error');
    }
  },

  refreshLastSearch() {
    if (this.lastSearch) {
      this.search(this.lastSearch.from, this.lastSearch.to, this.lastSearch.date);
    }
  },

  /**
   * 渲染搜索结果
   */
  renderResults(trains, date) {
    const container = document.getElementById('search-results');

    if (trains.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <p>未找到符合条件的列车</p>
        </div>
      `;
      return;
    }

    container.innerHTML = trains.map(train => {
      const seatsClass = train.available_seats < 50 ? 'low' : '';
      const seatTypeLabels = {
        hard_seat: '硬座',
        hard_sleeper: '硬卧',
        soft_sleeper: '软卧'
      };

      let pricesHtml = '';
      if (train.price_hard_seat > 0) {
        pricesHtml += `<div class="price-item"><div class="price">¥${train.price_hard_seat}</div><div class="label">硬座</div></div>`;
      }
      if (train.price_hard_sleeper > 0) {
        pricesHtml += `<div class="price-item"><div class="price">¥${train.price_hard_sleeper}</div><div class="label">硬卧</div></div>`;
      }
      if (train.price_soft_sleeper > 0) {
        pricesHtml += `<div class="price-item"><div class="price">¥${train.price_soft_sleeper}</div><div class="label">软卧</div></div>`;
      }

      return `
        <div class="train-card">
          <div class="train-info">
            <div>
              <div class="train-no">${train.train_no}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${date}</div>
            </div>
            <div class="train-stations">
              <div class="station-time">
                <div class="time">${train.departure_time}</div>
                <div class="name">${train.departure_station}</div>
              </div>
              <div class="train-arrow">→</div>
              <div class="station-time">
                <div class="time">${train.arrival_time}</div>
                <div class="name">${train.arrival_station}</div>
              </div>
            </div>
          </div>
          <div class="train-prices">
            ${pricesHtml}
          </div>
          <div class="train-seats">
            <div class="count ${seatsClass}">${train.available_seats}</div>
            <div class="label">余票</div>
          </div>
          <button class="btn btn-primary" onclick="App.openBooking(${train.id}, '${train.train_no}')">购票</button>
        </div>
      `;
    }).join('');
  }
};
