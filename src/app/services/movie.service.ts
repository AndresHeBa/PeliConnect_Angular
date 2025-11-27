import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.interface';

export interface Reporte {
  estado: string;
  id_reporte: number;
  id_user: string;
  descripcion: string;
  id_review: string;
  fecha_reporte: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private readonly API_URL = 'http://peliconnect.ddns.net:3000';
  private IMG_URL = 'https://image.tmdb.org/t/p/w500';
  constructor(private http: HttpClient) { }

  getMovies(page: number = 1): Observable<{ movies: Movie[] }> {
    const url = `${this.API_URL}/get_movies/${page}`;
    return this.http.get<{ movies: Movie[] }>(url);
  }

  searchMovie(nombre: string): Observable<{ movies: Movie[] }> {
    return this.http.get<{ movies: Movie[] }>(`${this.API_URL}/fetch_movie/${nombre}`);
  }

  getMovieDetails(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/get_details/${id}`);
  }

  getMovieInfo(movieId: string): Observable<any> {
    return this.http.get(`${this.API_URL}pelicula/${movieId}`);
  }

  getListaFavoritos(usuario: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/leerLista/${usuario}`);
  }

  addToList(pelicula: string, usuario: string): Observable<any> {
    return this.http.get(`${this.API_URL}/aniadeLista/${pelicula}/${usuario}`);
  }

  getReviews(pelicula: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/leerReviews/${pelicula}`);
  }

  getUserReviews(userId: string): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URL}/userReviews`, { id: userId });
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/review/${reviewId}`);
  }

  postReview(body: any): Observable<any> {
    console.log("Entre a post review" + JSON.stringify(body));
    return this.http.post(`${this.API_URL}/guardaReview`, body);
  }

  getImageUrl(posterPath: string): string {
    return posterPath ? `${this.IMG_URL}${posterPath}` : 'https://via.placeholder.com/1080x1580';
  }

  crearReporte(reporte: any): Observable<any> {
    console.log("Entre a crearReporte" + JSON.stringify(reporte));
    let result = this.http.post(`${this.API_URL}/report`, reporte);
    console.log("Resultado reporte service: " + JSON.stringify(result));
    return result;
  }

  getAllReports(): Observable<Reporte[]> {
    console.log("Entre a get reports");
    let result = this.http.get<Reporte[]>(`${this.API_URL}/report/view`);
    console.log(result);

    return result;
  }

  getReportById(id: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.API_URL}/report/${id}`);
  }

  deleteReport(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/report/${id}`);
  }
}
