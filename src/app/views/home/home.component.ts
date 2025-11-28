import { Component, AfterViewInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit {
  private router = inject(Router);


  currentSlide = 0;

  ngAfterViewInit() {
    this.initCarousel();
  }

  initCarousel() {
    const carousel = document.getElementById('carousel') as HTMLElement;
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;

    if (!carousel || totalSlides === 0) return;

    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % totalSlides;
      carousel.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }, 5000);
  }

  loadpeliculas(){
    this.router.navigate(['/movies']);
  }

  loadregistro(){
    if (localStorage.getItem('user')){
      this.router.navigate(['/user'])
    }else{
      this.router.navigate(['/registro']);
    }
  }
}
