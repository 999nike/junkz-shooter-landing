// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Simple form validation and submission handling
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value.trim();
      const message = this.querySelector('textarea').value.trim();
      
      // Basic validation
      if (!email || !email.includes('@') || !email.includes('.')) {
        alert('Please enter a valid email address.');
        return;
      }
      
      if (message.length < 10) {
        alert('Please provide a message with at least 10 characters.');
        return;
      }
      
      // Simulate form submission
      alert('Thank you for your inquiry! We will respond shortly.');
      this.reset();
    });
  }
});

// Lazy load video placeholder (if needed in future)
// This is a lightweight implementation that could be expanded
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Placeholder for future video loading logic
      entry.target.classList.add('loaded');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe video placeholder for potential future enhancements
const videoPlaceholder = document.querySelector('.video-placeholder');
if (videoPlaceholder) {
  observer.observe(videoPlaceholder);
}