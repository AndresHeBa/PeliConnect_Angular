import { Component, OnInit } from '@angular/core';
import { MovieService, Reporte } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { AuthService, usuario  } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  reports: Reporte[] = [];
  selectedReport?: Reporte;
  serchuser = '';
  users: usuario[] = [];
  selectedUser?: usuario;
  selectedTab: 'reports' | 'users' = 'reports';
  constructor(private moviesServ: MovieService, private authService: AuthService) { }

  ngOnInit(): void {
    this.loadReports();
    this.getusers();
    console.log(this.reports);

  }

  // funciones buscar usuario por id
  buscar(){
    console.log("Buscando usuario: " + this.serchuser);
  }

  limpiarBusqueda() {
    this.serchuser = '';
  }

  loadReports() {
    this.moviesServ.getAllReports().subscribe({
      next: (res) => {
        console.log('Reportes recibidos:', res); // <--- aquí
        this.reports = res;
      },
      error: (err) => console.error('Error al cargar reportes', err)
    });
  }


  viewReport(report: Reporte) {
    this.selectedReport = report;
    console.log(this.selectedReport);

  }

  deleteReport(id: number) {
    if (confirm('¿Seguro que quieres eliminar este reporte?')) {
      this.moviesServ.deleteReport(id).subscribe({
        next: () => {
          alert('Reporte eliminado');
          this.loadReports(); // recargar la lista
          this.closeModal(); // cerrar el modal
        },
        error: (err) => console.error('Error al eliminar reporte', err)
      });
    }
  }

  openModal(report: any) {
    this.selectedReport = report;
    document.body.classList.add('modal-open'); // Previene scroll del body
  }

  closeModal() {
    this.selectedReport = undefined;
    document.body.classList.remove('modal-open');
  }
  

  //usuarios

  getusers(){
    console.log("entro a viewusers");
    
    this.authService.readuser().subscribe({
      next: (data) => {
        console.log('Usuarios recibidos:', data); // <--- aquí
        this.users = Array.isArray(data) ? data : (data && (data as any).users) ? (data as any).users : [];
        console.log(this.users);
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  viewUser(user: usuario) {
    this.selectedUser = user;
    document.body.classList.add('modal-open'); // Previene scroll del body
    console.log(this.selectedUser);
  }

  closeUserModal() {
    this.selectedUser = undefined;
    document.body.classList.remove('modal-open');
  }

  banUser(id: string) {
    if (confirm('¿Seguro que quieres banear este usuario?')) {
      this.authService.banuser(id).subscribe({
        next: () => {
          alert(`Usuario con ID ${id} baneado`); // Mensaje de confirmación
          this.getusers(); // Recarga la lista de usuarios
          this.closeUserModal(); // Cierra el modal después de banear
        },
        error: (err) => console.error('Error al banear usuario', err)
      });
    }
  }

  activateUser(id: string) {
    if (confirm('¿Seguro que quieres activar este usuario?')) {
      this.authService.actuser(id).subscribe({
        next: () => {
          alert(`Usuario con ID ${id} activado`); // Mensaje de confirmación
          this.getusers(); // Recarga la lista de usuarios
          this.closeUserModal(); // Cierra el modal después de activar
        },
      error: (err) => console.error('Error al activar usuario', err)
      });
    }
  }



}
