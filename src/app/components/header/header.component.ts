import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  user = localStorage.getItem('user') || '';
  admin = localStorage.getItem('admin');
  isMenuOpen: boolean = false;

  ngOnInit() {
    // Listener para clicks fuera del menú
    document.addEventListener('click', this.handleClickOutside.bind(this));
    // Listener para cambios de tamaño de ventana
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  handleResize() {
    // Si la pantalla es mayor a 768px, cerrar el menú móvil
    if (window.innerWidth > 768) {
      this.closeMenu();
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;

    // Bloquear/desbloquear scroll del body de manera más robusta
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const nav = document.querySelector('nav');
    const menuToggle = document.querySelector('.menu-toggle');

    if (this.isMenuOpen && !nav?.contains(target) && !menuToggle?.contains(target)) {
      this.closeMenu();
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.user = '';
    this.closeMenu();
  }
}