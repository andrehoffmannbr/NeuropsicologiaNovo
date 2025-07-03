export default class DocumentsPage {
  constructor() {
    this.element = null
  }

  async render(container) {
    this.element = document.createElement('div')
    this.element.className = 'documents-page'
    this.element.innerHTML = `
      <div class="page-header">
        <h1>Laudos</h1>
        <p>Gerenciamento de documentos e laudos</p>
      </div>
      <div class="documents-content">
        <div class="card">
          <div class="card-body">
            <h3>Gerenciar Documentos</h3>
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