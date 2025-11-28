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
  readonly IMG_URL = 'https://image.tmdb.org/t/p/w500';
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
  loading: boolean = true;
  error: string | null = null;
  movie: any = {};

  // ================ DELETE ================



  // Filtros
  searchTerm: string = '';
  currentScoreFilter: string = 'all';
  scoreFilters = [
    { label: 'Todos', value: 'all' },
    { label: '5 ⭐', value: '5' },
    { label: '4.5 ⭐', value: '4.5' },
    { label: '4 ⭐', value: '4' },
    { label: '3.5 ⭐', value: '3.5' },
    { label: '3 ⭐', value: '3' },
    { label: '2.5 ⭐', value: '2.5' },
    { label: '2 ⭐', value: '2' },
    { label: '1.5 ⭐', value: '1.5' },
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
      this.router.navigate(['/login']);
    }
    this.charn = this.charname.charAt(0).toUpperCase();

    this.getinfo();
  }

  getinfo() {
    this.authSvc.readuserid(this.user).subscribe({
      next: (data) => {
        //console.log('usuario recibido:', data);
        this.userData = Array.isArray(data) ? data[0] : (data as any).user;
        //console.log(this.userData);
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
        //console.log('Perfil actualizado:', response);
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
        //console.log('2FA generado:', response);
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
        //console.log('2FA verificado:', response);

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
        //console.log('2FA desactivado:', response);
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
        //console.log('Contraseña cambiada:', response);
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
        this.userComments = comments.map(c => ({
          ...c,
          expanded: false,
          movieTitle: 'Cargando...',
          moviePoster: ''
        }));
        this.filteredComments = [...this.userComments];
        console.log(this.userComments)
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
        this.movies.getMovieDetails(id).subscribe({
          next: (data) => {
            this.moviesCache = data;
            this.userComments.forEach(comment => {
              if (comment.ID_pelicula === id) {
                comment.movieTitle = data.title || 'Película';
                comment.fecha = data.release_date || ' ';
                comment.poster = data.poster_path;
              }
            });
            this.loading = false;
          },
          error: () => {
            this.error = 'No se pudieron cargar los detalles de la película.';
            this.loading = false;
          }
        });
      }
    });
  }

  getMovieTitle(movieId: string): string {
    const comment = this.userComments.find(c => c.ID_pelicula === movieId);
    return comment?.movieTitle || 'Cargando...';
  }

  getMoviePoster(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : 'assets/img/no-image.jpg';
  }

  getMovieDetails(id: string): void {
    this.loading = true;
    this.error = null;

    this.movies.getMovieDetails(id).subscribe({
      next: (data) => {
        this.movie = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener detalles:', err);
        this.error = 'No se pudieron cargar los detalles de la película.';
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.totalComments = this.userComments.length;
    if (this.totalComments > 0) {
      const sum = this.userComments.reduce((acc, c) => acc + Number(c.score), 0);
      this.averageScore = (sum / 2) / this.totalComments;
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

    // Filtrar por score (soporta escalas 0-5 y 0-10 y decimales como 4.5)
    if (this.currentScoreFilter !== 'all') {
      const selectedScore = parseFloat(this.currentScoreFilter);

      filtered = filtered.filter(c => {
        let commentScore = Number(c.score);

        if (isNaN(commentScore)) return false;

        // Si el score viene en escala 0-10 (ej. 9 o 8.5), convertir a 0-5
        if (commentScore > 5) {
          commentScore = commentScore / 2;
        }

        // Comparación con tolerancia para cubrir valores decimales (4.5)
        const tolerance = 0.25; // puedes ajustar si deseas mayor/menor tolerancia
        return Math.abs(commentScore - selectedScore) <= tolerance;
      });
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

  deleteComment(id: any) {
    if (confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      console.log(id)
      this.authSvc.deleteReview(id).subscribe({
        next: () => {
          window.location.reload()
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
      window.location.reload()
    }
  }

  // Propiedades para el modal de eliminar cuenta
  showDeleteAccountModal: boolean = false;
  deleteConfirmationText: string = '';
  deleteAccountError: string = '';

  // Método para abrir el modal
  openDeleteAccountModal() {
    this.showDeleteAccountModal = true;
    this.deleteConfirmationText = '';
    this.deleteAccountError = '';
  }

  // Método para cerrar el modal
  closeDeleteAccountModal() {
    this.showDeleteAccountModal = false;
    this.deleteConfirmationText = '';
    this.deleteAccountError = '';
  }

  // Método para confirmar y eliminar la cuenta
  confirmDeleteAccount() {
    if (this.deleteConfirmationText !== 'ELIMINAR') {
      this.deleteAccountError = 'Debes escribir "ELIMINAR" exactamente para confirmar';
      return;
    }

    // Aquí va tu lógica de eliminación
    this.authSvc.deleteAccount(this.user).subscribe({
      next: () => {
        alert('Tu cuenta ha sido eliminada');
        localStorage.clear();
        window.location.reload()
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        console.error('Error al eliminar cuenta:', error);
        this.deleteAccountError = 'Error al eliminar la cuenta. Por favor intenta de nuevo.';
      }
    });
  }

  // Actualiza tu método deleteAccount() existente
  deleteAccount() {
    this.openDeleteAccountModal();
  }
}