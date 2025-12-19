// ===================================================
// CRMSYNC Analytics & Insights
// Calculate and display contact statistics
// ===================================================

class AnalyticsManager {
  constructor() {
    this.cache = {};
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async getInsights() {
    // Check cache
    if (this.cache.insights && Date.now() - this.cache.timestamp < this.cacheExpiry) {
      return this.cache.insights;
    }

    const contacts = await this.getContacts();
    
    const insights = {
      total: contacts.length,
      today: this.getContactsToday(contacts),
      thisWeek: this.getContactsThisWeek(contacts),
      thisMonth: this.getContactsThisMonth(contacts),
      approved: contacts.filter(c => c.status === 'approved').length,
      pending: contacts.filter(c => c.status === 'pending').length,
      topDomains: this.getTopDomains(contacts, 5),
      topCompanies: this.getTopCompanies(contacts, 5),
      growthData: this.getGrowthData(contacts),
      mostActiveDay: this.getMostActiveDay(contacts),
      averagePerWeek: this.getAveragePerWeek(contacts),
      growthRate: this.getGrowthRate(contacts),
      recentActivity: this.getRecentActivity(contacts),
      insights: this.generateSmartInsights(contacts)
    };

    // Cache results
    this.cache = {
      insights,
      timestamp: Date.now()
    };

    return insights;
  }

  async getContacts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['contacts'], (result) => {
        resolve(result.contacts || []);
      });
    });
  }

  getContactsToday(contacts) {
    const today = new Date().setHours(0, 0, 0, 0);
    return contacts.filter(c => {
      const addedDate = new Date(c.addedDate).setHours(0, 0, 0, 0);
      return addedDate === today;
    }).length;
  }

  getContactsThisWeek(contacts) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return contacts.filter(c => new Date(c.addedDate) >= weekAgo).length;
  }

  getContactsThisMonth(contacts) {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return contacts.filter(c => new Date(c.addedDate) >= monthAgo).length;
  }

  getTopDomains(contacts, limit = 5) {
    const domains = {};
    contacts.forEach(c => {
      if (c.email) {
        const domain = c.email.split('@')[1];
        domains[domain] = (domains[domain] || 0) + 1;
      }
    });

    return Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([domain, count]) => ({ domain, count }));
  }

  getTopCompanies(contacts, limit = 5) {
    const companies = {};
    contacts.forEach(c => {
      if (c.company) {
        companies[c.company] = (companies[c.company] || 0) + 1;
      }
    });

    return Object.entries(companies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([company, count]) => ({ company, count }));
  }

  getGrowthData(contacts) {
    // Get last 30 days of data
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const count = contacts.filter(c => {
        const addedDate = new Date(c.addedDate);
        return addedDate <= date;
      }).length;
      
      data.push({ date: date.toISOString().split('T')[0], count });
    }
    return data;
  }

  getMostActiveDay(contacts) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = Array(7).fill(0);
    
    contacts.forEach(c => {
      const day = new Date(c.addedDate).getDay();
      dayCounts[day]++;
    });
    
    const maxCount = Math.max(...dayCounts);
    const maxDay = dayCounts.indexOf(maxCount);
    return { day: days[maxDay], count: maxCount };
  }

  getAveragePerWeek(contacts) {
    if (contacts.length === 0) return 0;
    
    const oldest = contacts.reduce((min, c) => {
      const date = new Date(c.addedDate);
      return date < min ? date : min;
    }, new Date());
    
    const weeks = Math.ceil((Date.now() - oldest.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeks > 0 ? Math.round(contacts.length / weeks * 10) / 10 : 0;
  }

  getGrowthRate(contacts) {
    const thisWeek = this.getContactsThisWeek(contacts);
    const lastWeek = contacts.filter(c => {
      const date = new Date(c.addedDate);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= twoWeeksAgo && date < weekAgo;
    }).length;

    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }

  getRecentActivity(contacts) {
    return contacts
      .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        company: c.company,
        date: c.addedDate,
        daysAgo: Math.floor((Date.now() - new Date(c.addedDate)) / (24 * 60 * 60 * 1000))
      }));
  }

  generateSmartInsights(contacts) {
    const insights = [];
    const thisWeek = this.getContactsThisWeek(contacts);
    const thisMonth = this.getContactsThisMonth(contacts);
    const growthRate = this.getGrowthRate(contacts);
    const pending = contacts.filter(c => c.status === 'pending').length;

    // Growth insights
    if (growthRate > 20) {
      insights.push({
        icon: '📈',
        type: 'positive',
        message: `Amazing! ${growthRate}% growth this week`
      });
    } else if (growthRate < -20) {
      insights.push({
        icon: '📉',
        type: 'warning',
        message: `Contact growth slowed ${Math.abs(growthRate)}% this week`
      });
    }

    // Activity insights
    if (thisWeek > 10) {
      insights.push({
        icon: '🔥',
        type: 'positive',
        message: `You're on fire! ${thisWeek} new contacts this week`
      });
    }

    // Pending insights
    if (pending > 10) {
      insights.push({
        icon: '⚠️',
        type: 'warning',
        message: `${pending} contacts waiting for review`
      });
    }

    // Milestone insights
    if (contacts.length >= 100 && contacts.length < 110) {
      insights.push({
        icon: '🎉',
        type: 'milestone',
        message: `Milestone reached: ${contacts.length} contacts!`
      });
    }

    return insights;
  }

  renderSparkline(data, width = 100, height = 30) {
    if (!data || data.length === 0) return '';
    
    const values = data.map(d => d.count);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range * height);
      return `${x},${y}`;
    }).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="sparkline">
        <polyline points="${points}" />
      </svg>
    `;
  }

  renderInsightsHTML(insights) {
    return `
      <div class="analytics-container">
        <!-- Summary Stats -->
        <div class="analytics-grid">
          <div class="chart-container">
            <div class="chart-title">Total Contacts</div>
            <div class="chart-value">${insights.total}</div>
            <div class="chart-label">All time</div>
          </div>
          
          <div class="chart-container">
            <div class="chart-title">This Week</div>
            <div class="chart-value">${insights.thisWeek}</div>
            <div class="chart-label">${insights.growthRate > 0 ? '+' : ''}${insights.growthRate}% vs last week</div>
          </div>
          
          <div class="chart-container">
            <div class="chart-title">This Month</div>
            <div class="chart-value">${insights.thisMonth}</div>
            <div class="chart-label">New contacts</div>
          </div>
          
          <div class="chart-container">
            <div class="chart-title">Avg per Week</div>
            <div class="chart-value">${insights.averagePerWeek}</div>
            <div class="chart-label">contacts/week</div>
          </div>
        </div>

        <!-- Growth Chart -->
        <div class="chart-container" style="margin-top: 16px;">
          <div class="chart-title">30-Day Growth</div>
          ${this.renderSparkline(insights.growthData, 100, 40)}
        </div>

        <!-- Smart Insights -->
        ${insights.insights.length > 0 ? `
          <div style="margin-top: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">💡 Insights</div>
            ${insights.insights.map(insight => `
              <div class="insight-card ${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <span>${insight.message}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Top Domains -->
        ${insights.topDomains.length > 0 ? `
          <div style="margin-top: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">🏆 Top Domains</div>
            ${insights.topDomains.map((d, i) => `
              <div class="top-item">
                <span class="rank">#${i + 1}</span>
                <span class="name">${d.domain}</span>
                <span class="count">${d.count}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Recent Activity -->
        ${insights.recentActivity.length > 0 ? `
          <div style="margin-top: 16px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">⏰ Recent Activity</div>
            ${insights.recentActivity.map(activity => `
              <div class="activity-item">
                <div class="activity-name">${activity.name}</div>
                <div class="activity-meta">${activity.company || ''} • ${activity.daysAgo === 0 ? 'Today' : `${activity.daysAgo}d ago`}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  clearCache() {
    this.cache = {};
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.analytics = new AnalyticsManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsManager;
}
