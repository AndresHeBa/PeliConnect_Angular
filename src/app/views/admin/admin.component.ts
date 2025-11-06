import { Component, OnInit } from '@angular/core';
import { MovieService, Reporte } from '../../services/movie.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  imports: [ CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  reports: Reporte[] = [];
  selectedReport?: Reporte;

  constructor(private moviesServ: MovieService) {}

  ngOnInit(): void {
    this.loadReports();
    console.log(this.reports);
    
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
}
