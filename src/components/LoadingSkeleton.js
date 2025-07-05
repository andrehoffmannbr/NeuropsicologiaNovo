// 🎨 Componente de Skeleton Loading para melhor UX durante carregamentos
export default class LoadingSkeleton {
  static createCardSkeleton(count = 3) {
    const skeletons = []
    
    for (let i = 0; i < count; i++) {
      skeletons.push(`
        <div class="skeleton-card">
          <div class="skeleton-header">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-info">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
            </div>
          </div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-short"></div>
          </div>
        </div>
      `)
    }
    
    return skeletons.join('')
  }

  static createTableSkeleton(rows = 5, columns = 4) {
    let table = '<div class="skeleton-table">'
    
    // Header
    table += '<div class="skeleton-table-header">'
    for (let col = 0; col < columns; col++) {
      table += '<div class="skeleton-line skeleton-table-header-cell"></div>'
    }
    table += '</div>'
    
    // Rows
    for (let row = 0; row < rows; row++) {
      table += '<div class="skeleton-table-row">'
      for (let col = 0; col < columns; col++) {
        table += '<div class="skeleton-line skeleton-table-cell"></div>'
      }
      table += '</div>'
    }
    
    table += '</div>'
    return table
  }

  static createStatsSkeleton() {
    return `
      <div class="skeleton-stats">
        <div class="skeleton-stat-card">
          <div class="skeleton-line skeleton-stat-number"></div>
          <div class="skeleton-line skeleton-stat-label"></div>
        </div>
        <div class="skeleton-stat-card">
          <div class="skeleton-line skeleton-stat-number"></div>
          <div class="skeleton-line skeleton-stat-label"></div>
        </div>
        <div class="skeleton-stat-card">
          <div class="skeleton-line skeleton-stat-number"></div>
          <div class="skeleton-line skeleton-stat-label"></div>
        </div>
        <div class="skeleton-stat-card">
          <div class="skeleton-line skeleton-stat-number"></div>
          <div class="skeleton-line skeleton-stat-label"></div>
        </div>
      </div>
    `
  }

  static createFormSkeleton() {
    return `
      <div class="skeleton-form">
        <div class="skeleton-form-group">
          <div class="skeleton-line skeleton-label"></div>
          <div class="skeleton-line skeleton-input"></div>
        </div>
        <div class="skeleton-form-group">
          <div class="skeleton-line skeleton-label"></div>
          <div class="skeleton-line skeleton-input"></div>
        </div>
        <div class="skeleton-form-group">
          <div class="skeleton-line skeleton-label"></div>
          <div class="skeleton-line skeleton-textarea"></div>
        </div>
        <div class="skeleton-form-actions">
          <div class="skeleton-line skeleton-button"></div>
          <div class="skeleton-line skeleton-button"></div>
        </div>
      </div>
    `
  }

  static addSkeletonStyles() {
    if (document.getElementById('skeleton-styles')) return

    const style = document.createElement('style')
    style.id = 'skeleton-styles'
    style.textContent = `
      .skeleton-line {
        height: 16px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .skeleton-title {
        height: 20px;
        width: 60%;
      }

      .skeleton-subtitle {
        height: 14px;
        width: 40%;
      }

      .skeleton-short {
        width: 30%;
      }

      .skeleton-card {
        background: white;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .skeleton-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 50%;
        margin-right: 12px;
      }

      .skeleton-info {
        flex: 1;
      }

      .skeleton-table {
        background: white;
        border-radius: 8px;
        overflow: hidden;
      }

      .skeleton-table-header {
        display: flex;
        padding: 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
      }

      .skeleton-table-header-cell {
        flex: 1;
        height: 18px;
        margin-right: 16px;
        margin-bottom: 0;
      }

      .skeleton-table-row {
        display: flex;
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;
      }

      .skeleton-table-cell {
        flex: 1;
        height: 16px;
        margin-right: 16px;
        margin-bottom: 0;
      }

      .skeleton-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .skeleton-stat-card {
        background: white;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .skeleton-stat-number {
        height: 32px;
        width: 60%;
        margin-bottom: 12px;
      }

      .skeleton-stat-label {
        height: 16px;
        width: 80%;
      }

      .skeleton-form {
        background: white;
        padding: 24px;
        border-radius: 8px;
      }

      .skeleton-form-group {
        margin-bottom: 20px;
      }

      .skeleton-label {
        height: 16px;
        width: 30%;
        margin-bottom: 8px;
      }

      .skeleton-input {
        height: 40px;
        width: 100%;
      }

      .skeleton-textarea {
        height: 80px;
        width: 100%;
      }

      .skeleton-form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }

      .skeleton-button {
        height: 40px;
        width: 120px;
      }

      @keyframes loading {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      @media (max-width: 768px) {
        .skeleton-stats {
          grid-template-columns: 1fr;
        }
        
        .skeleton-table-header,
        .skeleton-table-row {
          flex-direction: column;
        }
        
        .skeleton-table-header-cell,
        .skeleton-table-cell {
          margin-right: 0;
          margin-bottom: 8px;
        }
      }
    `
    document.head.appendChild(style)
  }

  static init() {
    this.addSkeletonStyles()
  }
}

// Auto-inicializar estilos
LoadingSkeleton.init() 