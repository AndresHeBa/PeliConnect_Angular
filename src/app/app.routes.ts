import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { RegistroComponent } from './views/registro/registro.component';
import { LoginComponent } from './views/login/login.component';
import { MoviesComponent } from './views/movies/movies.component';
import { ListaComponent } from './components/lista/lista.component';
import { MovieInfoComponent } from './views/movie-info/movie-info.component';
import { AdminComponent } from './views/admin/admin.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path : 'home', component: HomeComponent },
    { path : 'registro', component: RegistroComponent },
    { path: 'login' , component:LoginComponent},
    { path: 'movies' , component:MoviesComponent },
    { path: 'lista' , component:ListaComponent },
    { path: 'movie/:id', component: MovieInfoComponent },
    { path: 'admin', component: AdminComponent},
];
