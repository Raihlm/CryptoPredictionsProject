let slideIndex = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove('active'));
  slides[index].classList.add('active');
}

function changeSlide(n) {
  slideIndex = (slideIndex + n + slides.length) % slides.length;
  showSlide(slideIndex);
}

function autoSlide() {
  changeSlide(1);
  setTimeout(autoSlide, 5000); // Ganti slide tiap 5 detik
}

autoSlide();
