export default class ClientReportsPage {
  constructor() {
    this.element = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'client-reports-page'
    this.element.innerHTML = `
      <div class="page-header">
        <h1>Relatório de Clientes</h1>
        <p>Relatórios e estatísticas dos clientes</p>
      </div>
      <div class="client-reports-content">
        <div class="card">
          <div class="card-body">
            <h3>Relatórios Geral de Pacientes</h3>
            <p>Em desenvolvimento...</p>
          </div>
        </div>
      </div>
    `

    container.appendChild(this.element)
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
} 