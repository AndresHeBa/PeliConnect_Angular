import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, usuarioinf } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  userData?: usuarioinf;
  user = localStorage.getItem('idUser') || '';
  activeTab = 'profile';
  twoFaEnabled: boolean = false;
  showPassword = false;
  charname = localStorage.getItem('user') || '';
  charn = '';

  // Modo edición
  isEditMode: boolean = false;
  editableUserData: usuarioinf = {} as usuarioinf;

  // Password visibility
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Password fields
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // 2FA Setup
  show2FASetup: boolean = false;
  qrCodeUrl: string = '';
  twoFaSecret: string = '';
  verificationCode: string = '';
  verificationError: string = '';
  secretCopied: boolean = false;

  // ==================== COMENTARIOS ====================
  userComments: any[] = [];
  filteredComments: any[] = [];
  paginatedComments: any[] = [];
  loadingComments: boolean = false;

  // Filtros
  searchTerm: string = '';
  currentScoreFilter: string = 'all';
  scoreFilters = [
    { label: 'Todos', value: 'all' },
    { label: '5 ⭐', value: '5' },
    { label: '4 ⭐', value: '4' },
    { label: '3 ⭐', value: '3' },
    { label: '2 ⭐', value: '2' },
    { label: '1 ⭐', value: '1' }
  ];

  // Paginación
  currentPage: number = 1;
  commentsPerPage: number = 6;
  totalPages: number = 1;

  // Estadísticas
  totalComments: number = 0;
  averageScore: number = 0;

  // Cache de películas
  moviesCache: Map<string, any> = new Map();

  menuItems = [
    { id: 'profile', label: 'Perfil', icon: 'user' },
    { id: 'security', label: 'Seguridad', icon: 'shield' },
    { id: 'comments', label: 'Comentarios', icon: 'comment' },
    { id: 'settings', label: 'Configuración', icon: 'settings' }
  ];

  constructor(private authSvc: AuthService, private movies: MovieService) { }
  private router = inject(Router);

  ngOnInit() {
    if (!localStorage.getItem('user')) {
      this.router.navigate(['/home']);
    }
    console.log(this.user);
    console.log(this.charname);
    this.charn = this.charname.charAt(0).toUpperCase();

    this.getinfo();
  }

  getinfo() {
    this.authSvc.readuserid(this.user).subscribe({
      next: (data) => {
        console.log('usuario recibido:', data);
        this.userData = Array.isArray(data) ? data[0] : (data as any).user;
        console.log(this.userData);
        this.twoFaEnabled = this.userData?.two_fa || false;
      },
      error: (err) => console.error('Error al cargar usuario', err)
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'comments' && this.userComments.length === 0) {
      this.loadUserComments();
    }
  }

  // ==================== EDICIÓN DE PERFIL ====================

  enableEditMode() {
    this.isEditMode = true;
    this.editableUserData = { ...this.userData } as usuarioinf;
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editableUserData = {} as usuarioinf;
  }

  actualizarinfo() {
    if (!this.editableUserData.nombre || this.editableUserData.nombre.trim() === '') {
      alert('El nombre no puede estar vacío');
      return;
    }

    if (!this.editableUserData.Correo || !this.validateEmail(this.editableUserData.Correo)) {
      alert('Por favor ingresa un correo válido');
      return;
    }

    this.authSvc.updateUser(this.user, this.editableUserData).subscribe({
      next: (response) => {
        console.log('Perfil actualizado:', response);
        this.userData = { ...this.editableUserData };
        this.charn = this.userData.nombre?.charAt(0).toUpperCase() || 'U';
        localStorage.setItem('user', this.userData.nombre || '');
        this.isEditMode = false;
        alert('Perfil actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        alert('Error al actualizar el perfil. Intenta nuevamente.');
      }
    });
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ==================== 2FA ====================

  toggleTwoFa() {
    if (!this.twoFaEnabled) {
      this.setup2FA();
    } else {
      this.show2FASetup = true;
    }
  }

  setup2FA() {
    this.show2FASetup = true;
    this.verificationCode = '';
    this.verificationError = '';

    this.authSvc.generate2FA(this.user).subscribe({
      next: (response: any) => {
        console.log('2FA generado:', response);
        this.twoFaSecret = response.secret;
        this.qrCodeUrl = response.qrCode;
      },
      error: (error) => {
        console.error('Error al generar 2FA:', error);
        alert('Error al generar código 2FA');
        this.show2FASetup = false;
      }
    });
  }

  verify2FACode() {
    if (this.verificationCode.length !== 6) {
      this.verificationError = 'El código debe tener 6 dígitos';
      return;
    }

    this.authSvc.verify2FAs(this.user, this.verificationCode).subscribe({
      next: (response: any) => {
        console.log('2FA verificado:', response);

        if (response.success) {
          this.twoFaEnabled = true;

          if (this.userData) {
            this.userData.two_fa = true;
          }

          this.show2FASetup = false;
          alert('¡Autenticación de dos factores activada exitosamente!');
        } else {
          this.verificationError = 'Código incorrecto. Intenta nuevamente.';
        }
      },
      error: (error) => {
        console.error('Error al verificar 2FA:', error);
        this.verificationError = 'Error al verificar el código. Intenta nuevamente.';
      }
    });
  }

  disable2FA() {
    if (this.verificationCode.length !== 6) {
      this.verificationError = 'Ingresa tu código actual para confirmar';
      return;
    }

    this.authSvc.disable2FA(this.user, this.verificationCode).subscribe({
      next: (response: any) => {
        console.log('2FA desactivado:', response);
        if (response.success) {
          this.twoFaEnabled = false;
          if (this.userData) {
            this.userData.two_fa = false;
          }
          this.show2FASetup = false;
          alert('Autenticación de dos factores desactivada');
        } else {
          this.verificationError = 'Código incorrecto';
        }
      },
      error: (error) => {
        console.error('Error al desactivar 2FA:', error);
        this.verificationError = 'Error al desactivar 2FA';
      }
    });
  }

  close2FASetup() {
    this.show2FASetup = false;
    this.verificationCode = '';
    this.verificationError = '';
    this.qrCodeUrl = '';
    this.twoFaSecret = '';
  }

  copySecret() {
    if (this.twoFaSecret) {
      navigator.clipboard.writeText(this.twoFaSecret).then(() => {
        this.secretCopied = true;
        setTimeout(() => {
          this.secretCopied = false;
        }, 2000);
      });
    }
  }

  // ==================== SEGURIDAD / CAMBIO DE CONTRASEÑA ====================

  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  changePassword() {
    if (!this.currentPassword) {
      alert('Ingresa tu contraseña actual');
      return;
    }

    if (!this.newPassword || this.newPassword.length < 8) {
      alert('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.authSvc.changePassword(this.user, this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        console.log('Contraseña cambiada:', response);
        alert('Contraseña cambiada exitosamente');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        alert('Error al cambiar la contraseña. Verifica tu contraseña actual.');
      }
    });
  }

  // ==================== GESTIÓN DE COMENTARIOS ====================

  loadUserComments() {
    this.loadingComments = true;

    this.authSvc.getUserReviews(this.user).subscribe({
      next: (comments) => {
        console.log('Comentarios recibidos:', comments);
        this.userComments = comments.map(c => ({
          ...c,
          expanded: false,
          movieTitle: 'Cargando...',
          moviePoster: ''
        }));
        this.filteredComments = [...this.userComments];
        this.calculateStats();
        this.updatePagination();
        this.loadingComments = false;

        // Cargar información de películas
        this.loadMoviesInfo();
      },
      error: (err) => {
        console.error('Error al cargar comentarios:', err);
        this.loadingComments = false;
      }
    });
  }

  loadMoviesInfo() {
    const movieIds = [...new Set(this.userComments.map(c => c.ID_pelicula))];

    movieIds.forEach(id => {
      if (!this.moviesCache.has(id)) {
        // Aquí debes usar tu servicio de películas
        // Por ejemplo: this.movieSvc.getMovieById(id).subscribe(...)
        // Por ahora, usamos datos simulados
        this.movies.getMovieInfo(id).subscribe({
          next: (movie) => {
            this.moviesCache.set(id, movie);
            // Actualizar los comentarios con la info de la película
            this.userComments.forEach(comment => {
              if (comment.ID_pelicula === id) {
                comment.movieTitle = movie.titulo || movie.Titulo || 'Película';
                comment.moviePoster = movie.poster || movie.Poster || '';
              }
            });
          },
          error: (err) => {
            console.error(`Error al cargar película ${id}:`, err);
            // Fallback
            this.userComments.forEach(comment => {
              if (comment.ID_pelicula === id) {
                comment.movieTitle = `Película #${id}`;
              }
            });
          }
        });
      }
    });
  }

  getMovieTitle(movieId: string): string {
    const comment = this.userComments.find(c => c.ID_pelicula === movieId);
    return comment?.movieTitle || 'Cargando...';
  }

  getMoviePoster(movieId: string): string {
    const comment = this.userComments.find(c => c.ID_pelicula === movieId);
    return comment?.moviePoster || '';
  }

  calculateStats() {
    this.totalComments = this.userComments.length;
    if (this.totalComments > 0) {
      const sum = this.userComments.reduce((acc, c) => acc + Number(c.score), 0);
      this.averageScore = sum / this.totalComments;
    } else {
      this.averageScore = 0;
    }
  }

  filterComments() {
    let filtered = [...this.userComments];

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const movieTitle = (c.movieTitle || '').toLowerCase();
        const content = (c.Contenido || '').toLowerCase();
        return movieTitle.includes(term) || content.includes(term);
      });
    }

    // Filtrar por score
    if (this.currentScoreFilter !== 'all') {
      const score = parseInt(this.currentScoreFilter);
      filtered = filtered.filter(c => Number(c.score) === score);
    }

    this.filteredComments = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  setScoreFilter(filter: string) {
    this.currentScoreFilter = filter;
    this.filterComments();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredComments.length / this.commentsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;

    const startIndex = (this.currentPage - 1) * this.commentsPerPage;
    const endIndex = startIndex + this.commentsPerPage;
    this.paginatedComments = this.filteredComments.slice(startIndex, endIndex);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  toggleCommentExpansion(comment: any) {
    comment.expanded = !comment.expanded;
  }

  formatDate(date: any): string {
    if (!date) return 'Fecha desconocida';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  editComment(comment: any) {
    // Navegar a la película para editar el comentario
    console.log('Editar comentario:', comment);
    this.router.navigate(['/pelicula', comment.ID_pelicula]);
  }

  deleteComment(comment: any) {
    if (confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      this.authSvc.deleteReview(comment.ID || comment.id).subscribe({
        next: () => {
          this.userComments = this.userComments.filter(c =>
            (c.ID || c.id) !== (comment.ID || comment.id)
          );
          this.filterComments();
          this.calculateStats();
          alert('Comentario eliminado exitosamente');
        },
        error: (err) => {
          console.error('Error al eliminar comentario:', err);
          alert('Error al eliminar el comentario');
        }
      });
    }
  }

  // En user.component.ts - Agregar estas variables
  darkModeEnabled: boolean = true;
  autoplayEnabled: boolean = false;
  subtitlesEnabled: boolean = true;
  emailNotificationsEnabled: boolean = true;
  newReleasesNotificationsEnabled: boolean = true;
  publicProfileEnabled: boolean = false;
  shareActivityEnabled: boolean = false;
  selectedLanguage: string = 'es';
  selectedRegion: string = 'mx';

  // Métodos para configuración
  logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('iduser')
      this.router.navigate(['/login']);
    }
  }

  deleteAccount() {
    // if (confirm('⚠️ ADVERTENCIA: Esta acción es irreversible. ¿Estás COMPLETAMENTE seguro de que deseas eliminar tu cuenta?')) {
    //   const confirmText = prompt('Escribe "ELIMINAR" para confirmar:');
    //   if (confirmText === 'ELIMINAR') {
    //     this.authSvc.deleteAccount(this.user).subscribe({
    //       next: () => {
    //         alert('Tu cuenta ha sido eliminada');
    //         localStorage.clear();
    //         this.router.navigate(['/']);
    //       },
    //       error: (err) => {
    //         console.error('Error al eliminar cuenta:', err);
    //         alert('Error al eliminar la cuenta');
    //       }
    //     });
    //   }
    // }
  }
}