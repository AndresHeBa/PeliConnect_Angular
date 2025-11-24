import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var bootstrap: any;

@Component({
  selector: 'app-movie-info',
  templateUrl: './movie-info.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./movie-info.component.css']
})
export class MovieInfoComponent implements OnInit {
  user = localStorage.getItem('user') || '';

  reviews: any[] = []; // tus reseñas existentes
  reviewSeleccionada: any = null;
  descripcionReporte = '';
  movie: any = {};
  noReviews = true;
  movieId!: string;
  loading: boolean = true;
  error: string | null = null;
  trailerUrl?: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.movieService.getMovieDetails(id).subscribe({
        next: (data) => {
          this.movie = data;
          if (data.trailer_key) {
            this.trailerUrl = this.getYoutubeEmbed(data.trailer_key);
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar los detalles de la película.';
          this.loading = false;
        }
      });
      this.creaReviews();
    }
  }

  getYoutubeEmbed(key: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${key}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }


  getMovieDetails(id: string): void {
    this.loading = true;
    this.error = null;

    this.movieService.getMovieDetails(id).subscribe({
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

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : 'assets/img/no-image.jpg';
  }

  getBackdropUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/original${path}` : '';
  }

  aniadirLista(): void {
    const pelicula = localStorage.getItem('id');
    const usuario = this.user;
    if (!usuario || !pelicula) return;

    this.movieService.addToList(pelicula, usuario).subscribe(res => {
      console.log('Película añadida a la lista', res);
    });
  }

  creaReviews(): void {
    const pelicula = localStorage.getItem('id');
    console.log("Get Resenas " + pelicula);
    
    if (!pelicula) return;

    this.movieService.getReviews(pelicula).subscribe(data => {
      this.reviews = data;
      this.noReviews = data.length === 0;
    });
  }

  enviarResena(form: any): void {
    console.log("Submit Review");
    
    const pelicula = localStorage.getItem('id');
    if (!form.value.texto || !form.value.calificacion || !this.user) return;

    const body = {
      pelicula: pelicula,
      usuario: this.user,
      texto: form.value.texto,
      calificacion: form.value.calificacion
    };

    console.log(body);
    

    this.movieService.postReview(body).subscribe(() => {
      form.reset();
      this.creaReviews();
    });
  }

  abrirModalReporte(review: any) {
    this.reviewSeleccionada = review;
    this.descripcionReporte = '';
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
  }

  enviarReporte() {
    if (!this.descripcionReporte.trim()) {
      alert('Por favor ingresa una descripción.');
      return;
    }

    console.log(this.reviewSeleccionada);
    

    const reporte = {
      descripcion: this.descripcionReporte,
      id_user: localStorage.getItem('idUser'),
      id_review: this.reviewSeleccionada.idReview,   // asegúrate que la reseña tenga un campo id
      fecha_reporte: new Date().toISOString().split('T')[0]
    };

    console.log(reporte);
    

    this.movieService.crearReporte(reporte).subscribe({
      next: () => {
        alert('Reporte enviado con éxito.');
        const modalElement = document.getElementById('reportModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
      }
    });
    

    
  }


  getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }
}
