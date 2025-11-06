import { Component, OnInit } from '@angular/core';
import { Movie } from '../../models/movie.interface';
import { MovieService } from '../../services/movie.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-movies',
  imports: [CommonModule, FormsModule],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css'
})

export class MoviesComponent implements OnInit {
  movies: Movie[] = [];
  readonly IMG_URL = 'https://image.tmdb.org/t/p/w500';
  currentPage = 1;
  totalPages = 10; // puedes actualizarlo si tu API devuelve total de páginas
  searchTerm = '';
  searching = false;
  showingSearchResults = false;

  constructor(
    private movieService: MovieService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPeliculas(this.currentPage);
  }

  cargarPeliculas(page: number) {
    this.movieService.getMovies(page).subscribe({
      next: (data) => {
        this.movies = data.movies.slice(0, 20);
      },
      error: (err) => console.error('Error al obtener películas:', err)
    });
  }

  buscarPelicula() {
    if (!this.searchTerm.trim()) {
      this.cargarPeliculas(this.currentPage);
      return;
    }

    this.searching = true;
    this.movieService.searchMovie(this.searchTerm.trim()).subscribe({
      next: (data) => {
        console.log(data);
        
        this.movies = data.movies;
        this.showingSearchResults = true;
        this.searching = false;
      },
      error: (err) => {
        console.error('Error al buscar películas:', err);
        this.searching = false;
      }
    });
  }

  limpiarBusqueda() {
    this.searchTerm = '';
    this.cargarPeliculas(this.currentPage);
  }

  verInformacion(id: number) {
    localStorage.setItem('id', id.toString());
    this.router.navigate(['/movie/', id]);
  }

  paginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarPeliculas(this.currentPage);
    }
  }

  paginaSiguiente() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cargarPeliculas(this.currentPage);
    }
  }
}
