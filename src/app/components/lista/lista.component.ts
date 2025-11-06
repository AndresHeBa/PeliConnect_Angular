import { Component } from '@angular/core';
import { Movie } from '../../models/movie.interface';
import { MovieService } from '../../services/movie.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent {
  movies: Movie[] = [];
  readonly IMG_URL = 'https://image.tmdb.org/t/p/w500';
  usuario = localStorage.getItem('user');
  idUser = localStorage.getItem('idUser');
  loading = false;

  constructor(
    private movieService: MovieService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarListaFavoritos();
  }

  /** 🔹 Carga los nombres desde la BD y busca info en TMDB */
  cargarListaFavoritos() {
    this.loading = true;
    if (!this.usuario || !this.idUser) {
      console.error('Usuario no encontrado en localStorage');
      this.loading = false;
      return;
    }
    this.movieService.getListaFavoritos(this.idUser).subscribe({
      next: async (ids: string[]) => {
        if (ids.length === 0) {
          this.movies = [];
          this.loading = false;
          return;
        }
        console.log(ids);
        

        // Buscar los detalles en TMDB por nombre (en paralelo)
        const promesas = ids.map(id =>
          this.movieService.searchMovie(id).toPromise()
        );

        const resultados = await Promise.all(promesas);
        const peliculasConDatos = resultados
          .map((r: any) => r.movies?.[0]) // tomamos la primera coincidencia
          .filter((m: any) => m && m.overview && m.overview.trim() !== ''); // 🔹 Filtrar sin descripción

        this.movies = peliculasConDatos;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar lista de favoritos:', err);
        this.loading = false;
      }
    });
  }

  /** 🔹 Ir a la página de detalles */
  verInformacion(id: number) {
    this.router.navigate(['/movie', id]);
  }
}
