import { Component, OnInit } from '@angular/core';
import { MovieService, Reporte } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, usuario } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  // Datos principales
  reports: Reporte[] = [];
  users: usuario[] = [];

  // Datos filtrados
  filteredReports: Reporte[] = [];
  filteredUsers: usuario[] = [];

  // Modales
  selectedReport?: Reporte;
  selectedUser?: usuario;
  userToBan?: usuario;

  // Filtros y búsquedas
  searchReportText: string = '';
  filterReportStatus: string = '';
  searchUserText: string = '';
  filterUserStatus: string = '';

  // Baneo
  banReason: string = '';

  // Gestión de reportes
  reportAction: 'activo' | 'revision' | 'ban' | 'dismiss' | null = null;
  adminNotes: string = '';

  // Tabs
  selectedTab: 'reports' | 'users' | 'stats' = 'reports';

  error: string | null = null;

  constructor(
    private moviesServ: MovieService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadReports();
    this.getusers();
  }

  // =======================
  // REPORTES
  // =======================
  loadReports() {
    this.moviesServ.getAllReports().subscribe({
      next: (res) => {
        console.log('Reportes recibidos:', res);
        this.reports = res;
        // agregar nombres
        this.reports.forEach(element => {
          this.moviesServ.getMovieDetails(element.id_pelicula.toString()).subscribe({
            next: (data) => {
              element.name_movie = data.title;
            },
            error: () => {
              this.error = 'No se pudieron cargar los detalles de la película.';
            }
          });
        });


        this.applyReportFilters(); // Aplicar filtros después de cargar
      },
      error: (err) => console.error('Error al cargar reportes', err)
    });
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'A':
        return 'Activo';
      case 'R':
        return 'En revisión';
      case 'B':
        return 'Baneado';
      case 'D':
        return 'Desestimado';
      default:
        return 'Desconocido';
    }
  }

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'A':
        return 'estado-activo';
      case 'R':
        return 'estado-revision';
      case 'B':
        return 'estado-baneado';
      case 'D':
        return 'estado-desestimado';
      default:
        return '';
    }
  }

  applyReportFilters() {
    this.filteredReports = this.reports.filter(report => {
      // Búsqueda de texto
      const matchesSearch = !this.searchReportText ||
        report.descripcion?.toLowerCase().includes(this.searchReportText.toLowerCase()) ||
        report.id_user?.toString().includes(this.searchReportText) ||
        report.id_reporte?.toString().includes(this.searchReportText);

      // Filtro de estado (comparación case-insensitive)
      const matchesStatus = !this.filterReportStatus ||
        report.estado?.toLowerCase() === this.filterReportStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    console.log('Reportes filtrados:', this.filteredReports.length, 'de', this.reports.length);
  }

  viewReport(report: Reporte) {
    this.selectedReport = report;
    this.reportAction = null;
    this.adminNotes = '';
    document.body.classList.add('modal-open');
  }

  deleteReport(id: number) {
    if (confirm('¿Seguro que quieres eliminar este reporte?')) {
      this.moviesServ.deleteReport(id).subscribe({
        next: () => {
          alert('Reporte eliminado exitosamente');
          this.loadReports();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error al eliminar reporte', err);
          alert('Error al eliminar el reporte. Por favor intenta de nuevo.');
        }
      });
    }
  }

  // Nuevas acciones para reportes
  markAsReviewing() {
    if (!this.selectedReport) return;
    this.reportAction = 'revision';
  }

  markAsDismissed() {
    if (!this.selectedReport) return;
    this.reportAction = 'dismiss';
  }

  proceedToBanUser() {
    if (!this.selectedReport) return;
    this.reportAction = 'ban';
  }

  confirmReportAction() {
    if (!this.selectedReport || !this.reportAction) return;

    const reportId = this.selectedReport.id_reporte;
    const userId = this.selectedReport.id_user_review;

    switch (this.reportAction) {
      case 'revision':
        // Actualizar estado a "En revisión"
        this.updateReportStatus(reportId, 'R');
        break;

      case 'dismiss':
        // Marcar como resuelto/desestimado
        if (confirm('¿Desestimar este reporte? El usuario NO será baneado.')) {
          this.updateReportStatus(reportId, 'D');
        }
        break;

      case 'ban':
        // Banear al usuario reportado
        if (!this.adminNotes.trim()) {
          alert('Por favor ingresa una nota sobre el baneo');
          return;
        }
        if (confirm(`¿Confirmar baneo del usuario ${this.selectedReport.nombre_usuario_review}?`)) {
          this.updateReportStatus(reportId, 'B');
          this.banUserFromReport(userId.toString(), reportId);
        }
        break;
    }
  }

  updateReportStatus(reportId: number, newStatus: string) {
    // Aquí deberías llamar a tu servicio para actualizar el estado
    // Por ahora simulamos la actualización local
    const reportIndex = this.reports.findIndex(r => r.id_reporte === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex].estado = newStatus;
      this.applyReportFilters();
      //alert(`Reporte actualizado a: ${newStatus}`);
      this.authService.updateReportStatus(reportId, newStatus).subscribe({
        next: () => {
          //alert(`Reporte actualizado a: ${newStatus}`);
          this.loadReports();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error al actualizar reporte', err);
          alert('Error al actualizar el reporte');
        }
      });
      this.closeModal();
    }

    // TODO: Descomentar cuando tengas el endpoint en tu servicio
    /*
    
    */
  }

  banUserFromReport(userId: String, reportId: number) {
    const bandate = new Date().toLocaleDateString();
    const reason = `Reporte #${reportId}: ${this.adminNotes}`;

    this.authService.banuser(userId.toString(), bandate, reason).subscribe({
      next: () => {
        // Actualizar el estado del reporte a "Baneado"
        alert(`Usuario ${userId} baneado exitosamente`);
        this.getusers(); // Recargar lista de usuarios
      },
      error: (err) => {
        console.error('Error al banear usuario', err);
        alert('Error al banear el usuario');
      }
    });
  }

  cancelReportAction() {
    this.reportAction = null;
    this.adminNotes = '';
  }

  closeModal() {
    this.selectedReport = undefined;
    this.reportAction = null;
    this.adminNotes = '';
    document.body.classList.remove('modal-open');
  }

  // =======================
  // USUARIOS
  // =======================
  getusers() {
    console.log("Cargando usuarios...");
    this.authService.readuser().subscribe({
      next: (data) => {
        console.log('Usuarios recibidos:', data);
        this.users = Array.isArray(data)
          ? data
          : (data && (data as any).users)
            ? (data as any).users
            : [];

        // Normalizar el campo activo a string
        this.users = this.users.map(user => ({
          ...user,
          activo: user.activo?.toString() || '0'
        }));

        this.applyUserFilters(); // Aplicar filtros después de cargar
        console.log('Total usuarios:', this.users.length);
      },
      error: (err) => {
        console.error('Error al cargar usuarios', err);
        alert('Error al cargar usuarios. Por favor recarga la página.');
      }
    });
  }

  applyUserFilters() {
    this.filteredUsers = this.users.filter(user => {
      // Búsqueda de texto
      const matchesSearch = !this.searchUserText ||
        user.nombre?.toLowerCase().includes(this.searchUserText.toLowerCase()) ||
        user.Correo?.toLowerCase().includes(this.searchUserText.toLowerCase()) ||
        user.id?.toString().includes(this.searchUserText);

      // Filtro de estado (comparación exacta con strings)
      const matchesStatus = !this.filterUserStatus ||
        user.activo === this.filterUserStatus;

      return matchesSearch && matchesStatus;
    });

    console.log('Usuarios filtrados:', this.filteredUsers.length, 'de', this.users.length);
    console.log('Filtro activo:', this.filterUserStatus);
  }

  viewUser(user: usuario) {
    this.selectedUser = user;
    document.body.classList.add('modal-open');
  }

  closeUserModal() {
    this.selectedUser = undefined;
    document.body.classList.remove('modal-open');
  }

  // =======================
  // BANEO DE USUARIOS
  // =======================
  openBanModal(user: usuario) {
    this.userToBan = user;
    this.banReason = '';
    document.body.classList.add('modal-open');
  }

  closeBanModal() {
    this.userToBan = undefined;
    this.banReason = '';
    document.body.classList.remove('modal-open');
  }

  confirmBanUser() {
    if (!this.userToBan) return;

    if (!this.banReason.trim()) {
      alert('Por favor ingresa un motivo para el baneo');
      return;
    }

    const bandate = new Date().toLocaleDateString();
    const userId = this.userToBan.id;

    this.authService.banuser(userId, bandate, this.banReason).subscribe({
      next: () => {
        alert(`Usuario ${this.userToBan?.nombre} baneado exitosamente`);
        this.getusers();
        this.closeBanModal();
      },
      error: (err) => {
        console.error('Error al banear usuario', err);
        alert('Error al banear el usuario. Por favor intenta de nuevo.');
      }
    });
  }

  activateUser(id: string) {
    if (confirm('¿Seguro que quieres activar este usuario?')) {
      this.authService.actuser(id).subscribe({
        next: () => {
          alert(`Usuario activado exitosamente`);
          this.getusers();
          this.closeUserModal();
        },
        error: (err) => {
          console.error('Error al activar usuario', err);
          alert('Error al activar el usuario. Por favor intenta de nuevo.');
        }
      });
    }
  }

  // =======================
  // ESTADÍSTICAS
  // =======================
  getActiveUsersCount(): number {
    const count = this.users.filter(u => u.activo === '1').length;
    console.log('Usuarios activos:', count);
    return count;
  }

  getBannedUsersCount(): number {
    const count = this.users.filter(u => u.activo === '0').length;
    console.log('Usuarios baneados:', count);
    return count;
  }

  getPendingReportsCount(): number {
    const count = this.reports.filter(r => {
      const estado = r.estado?.toLowerCase() || '';
      return estado === 'en revisión' || estado === 'activo' || estado === 'pendiente';
    }).length;
    console.log('Reportes pendientes:', count);
    return count;
  }

  getBanPercentage(): string {
    if (this.users.length === 0) return '0.0';
    const percentage = (this.getBannedUsersCount() / this.users.length) * 100;
    return percentage.toFixed(1);
  }

}