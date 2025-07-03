import { domUtils } from '../utils/helpers.js'

class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container')
    if (!this.container) {
      this.container = domUtils.createElement('div', 'toast-container')
      this.container.id = 'toast-container'
      document.body.appendChild(this.container)
    }
    this.toasts = []
  }

  // Mostrar toast
  show(message, type = 'info', duration = 4000) {
    const toast = this.createToast(message, type, duration)
    this.toasts.push(toast)
    this.container.appendChild(toast.element)
    
    // Animação de entrada
    setTimeout(() => {
      toast.element.classList.add('show')
    }, 10)
    
    // Auto-remove
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast)
      }, duration)
    }
    
    return toast
  }

  // Criar elemento toast
  createToast(message, type, duration) {
    const toast = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration
    }
    
    const element = domUtils.createElement('div', `toast toast-${type}`)
    
    // Ícone baseado no tipo
    const iconMap = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    }
    
    element.innerHTML = `
      <div class="toast-content">
        <i data-lucide="${iconMap[type] || 'info'}" class="toast-icon"></i>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" aria-label="Fechar">
        <i data-lucide="x"></i>
      </button>
    `
    
    // Evento de fechar
    const closeBtn = element.querySelector('.toast-close')
    closeBtn.addEventListener('click', () => {
      this.remove(toast)
    })
    
    toast.element = element
    return toast
  }

  // Remover toast
  remove(toast) {
    if (!toast.element) return
    
    toast.element.classList.remove('show')
    toast.element.classList.add('hide')
    
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element)
      }
      this.toasts = this.toasts.filter(t => t.id !== toast.id)
    }, 300)
  }

  // Métodos de conveniência
  success(message, duration = 4000) {
    return this.show(message, 'success', duration)
  }

  error(message, duration = 6000) {
    return this.show(message, 'error', duration)
  }

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration)
  }

  info(message, duration = 4000) {
    return this.show(message, 'info', duration)
  }

  // Limpar todos os toasts
  clear() {
    this.toasts.forEach(toast => this.remove(toast))
  }
}

export const toast = new ToastManager()
export default toast 